/**
 * 文章构建脚本
 *
 * 扫描 articles/*.md，解析 frontmatter，转换为 HTML，
 * 上传图片到 R2，生成索引，注入模板输出到 public/article/<slug>/index.html。
 *
 * 用法：node scripts/build-articles.mjs [--skip-upload]
 *   --skip-upload  跳过 R2 图片上传（本地预览时使用）
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ARTICLES_DIR = path.join(ROOT, 'articles');
const IMAGES_DIR = path.join(ARTICLES_DIR, 'images');
const TEMPLATE_PATH = path.join(__dirname, 'article-template.html');
const OUTPUT_DIR = path.join(ROOT, 'public', 'article');

const R2_BUCKET = 'audio-test';
const CDN_BASE = 'https://cdn.bjting.com/article';

const SKIP_UPLOAD = process.argv.includes('--skip-upload');

// ── 工具函数 ──────────────────────────────────────────────

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * 上传文件到 R2 桶，返回公开 URL。
 * 如果 --skip-upload 则直接返回本地相对路径。
 */
function uploadToR2(localPath, r2Key) {
    const cdnUrl = `${CDN_BASE}/${r2Key}`;

    if (SKIP_UPLOAD) {
        console.log(`  [跳过上传] ${r2Key}`);
        return cdnUrl;
    }

    try {
        console.log(`  [上传] ${r2Key}`);
        execSync(
            `npx wrangler r2 object put "${R2_BUCKET}/article/${r2Key}" --file="${localPath}" --remote`,
            { stdio: 'pipe' }
        );
    } catch (err) {
        console.error(`  [上传失败] ${r2Key}: ${err.message}`);
    }

    return cdnUrl;
}

// ── 图片路径替换 ──────────────────────────────────────────

/**
 * 扫描 Markdown 正文中的图片引用（相对路径），上传到 R2 并替换为绝对 URL。
 * 支持 ![alt](./images/slug/file.png) 和 ![alt](images/slug/file.png) 格式。
 */
function processImages(mdContent, slug) {
    const imgRegex = /!\[([^\]]*)\]\((\.\/?images\/[^)]+)\)/g;

    return mdContent.replace(imgRegex, (match, alt, relPath) => {
        const cleanPath = relPath.replace(/^\.\//, '');
        const localFile = path.join(ARTICLES_DIR, cleanPath);

        if (!fs.existsSync(localFile)) {
            console.warn(`  [警告] 图片不存在: ${localFile}`);
            return match;
        }

        const filename = path.basename(cleanPath);
        const r2Key = `${slug}/${filename}`;
        const cdnUrl = uploadToR2(localFile, r2Key);

        return `![${alt}](${cdnUrl})`;
    });
}

/**
 * 处理 frontmatter 中的 cover 字段（相对路径 → R2 URL）。
 */
function processCoverImage(cover, slug) {
    if (!cover || cover.startsWith('http')) return cover || '';

    const cleanPath = cover.replace(/^\.\//, '');
    const localFile = path.join(ARTICLES_DIR, cleanPath);

    if (!fs.existsSync(localFile)) {
        console.warn(`  [警告] 封面图不存在: ${localFile}`);
        return '';
    }

    const filename = path.basename(cleanPath);
    const r2Key = `${slug}/${filename}`;
    return uploadToR2(localFile, r2Key);
}

// ── 模板渲染 ──────────────────────────────────────────────

function renderTemplate(template, vars) {
    let html = template;
    for (const [key, value] of Object.entries(vars)) {
        html = html.replaceAll(`{{${key}}}`, value);
    }
    return html;
}

// ── 主流程 ────────────────────────────────────────────────

function build() {
    console.log('📝 开始构建文章...\n');

    if (!fs.existsSync(ARTICLES_DIR)) {
        console.log('articles/ 目录不存在，跳过构建。');
        return;
    }

    const mdFiles = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));

    if (mdFiles.length === 0) {
        console.log('没有找到 .md 文件，跳过构建。');
        return;
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    // 第一遍：解析所有文章的元数据，生成索引
    const articles = [];

    for (const file of mdFiles) {
        const slug = path.basename(file, '.md');
        const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8');
        const { data, content } = matter(raw);

        if (!data.title || !data.date) {
            console.warn(`[跳过] ${file}: 缺少必填的 title 或 date`);
            continue;
        }

        articles.push({
            slug,
            title: data.title,
            description: data.description || '',
            date: typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0],
            cover: data.cover || '',
            tags: data.tags || [],
            content,
        });
    }

    // 按日期降序排列
    articles.sort((a, b) => b.date.localeCompare(a.date));

    // 生成索引 JSON（不含正文）
    const articleIndex = articles.map(({ slug, title, description, date, cover }) => ({
        slug, title, description, date, cover,
    }));

    // 清空并重建输出目录
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true });
    }
    ensureDir(OUTPUT_DIR);

    // 写入索引 JSON
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'index.json'),
        JSON.stringify(articleIndex, null, 2),
        'utf-8'
    );
    console.log(`✅ 生成索引: public/article/index.json (${articles.length} 篇文章)\n`);

    // 第二遍：逐篇处理图片、渲染 HTML、输出文件
    for (const article of articles) {
        console.log(`📄 处理: ${article.slug}`);

        // 处理图片引用
        const processedContent = processImages(article.content, article.slug);
        const coverUrl = processCoverImage(article.cover, article.slug);

        // 更新索引中的 cover URL
        const indexEntry = articleIndex.find(a => a.slug === article.slug);
        if (indexEntry) {
            indexEntry.cover = coverUrl;
        }

        // Markdown → HTML
        const htmlContent = marked.parse(processedContent);

        // 生成 tags HTML
        const tagsHtml = article.tags.length > 0
            ? article.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ')
            : '';

        // 注入模板
        const finalHtml = renderTemplate(template, {
            title: escapeHtml(article.title),
            description: escapeHtml(article.description),
            slug: article.slug,
            date: article.date,
            cover: coverUrl,
            content: htmlContent,
            tags_html: tagsHtml,
            article_index_json: JSON.stringify(articleIndex),
            year: new Date().getFullYear().toString(),
        });

        // 输出文件
        const outDir = path.join(OUTPUT_DIR, article.slug);
        ensureDir(outDir);
        fs.writeFileSync(path.join(outDir, 'index.html'), finalHtml, 'utf-8');
        console.log(`  ✅ 输出: public/article/${article.slug}/index.html\n`);
    }

    // 索引中的 cover 可能在第二遍中被更新了，重新写入
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'index.json'),
        JSON.stringify(articleIndex, null, 2),
        'utf-8'
    );

    // 生成文章 Sitemap
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${articles.map(a => `  <url>
    <loc>https://bjting.com/article/${a.slug}</loc>
    <lastmod>${a.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(
        path.join(ROOT, 'public', 'sitemap-articles.xml'),
        sitemapXml,
        'utf-8'
    );
    console.log(`✅ 生成 Sitemap: public/sitemap-articles.xml`);

    console.log(`🎉 构建完成！共 ${articles.length} 篇文章。`);
}

build();
