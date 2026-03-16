/**
 * API 接口集合
 * 封装网易云音乐 API 的所有请求方法
 * 按功能模块分组：轮播图、登录、搜索、歌曲、歌单、歌手、专辑、MV、评论、推荐
 */
import { httpGet } from '@/utils/http';

// ═══════ 轮播图 ═══════

/**
 * 获取首页 Banner 轮播图
 * @param type 资源类型，0: PC, 1: Android, 2: iPhone, 3: iPad
 */
export const banner = (params?: { type?: 0 | 1 | 2 | 3 }) => httpGet('/banner', params);

// ═══════ 登录相关 ═══════

/**
 * 手机号登录
 * @param phone 手机号
 * @param password 密码
 * @param md5_password md5加密后的密码
 * @param captcha 验证码
 * @param countrycode 国家码，默认为 86
 */
export const loginCellphone = (params: {
    phone: string;
    password?: string;
    md5_password?: string;
    captcha?: string;
    countrycode?: string;
}) => httpGet('/login/cellphone', params);

/**
 * 邮箱登录
 * @param email 邮箱地址
 * @param password 密码
 * @param md5_password md5加密后的密码
 */
export const loginEmail = (params: { email: string; password?: string; md5_password?: string }) =>
    httpGet('/login', params);

/** 刷新登录状态，返回新的 token */
export const loginRefresh = () => httpGet('/login/refresh');

/** 获取当前登录状态，返回用户基本信息及认证状态 */
export const loginStatus = () => httpGet('/login/status');

/** 匿名登录，用于未登录时获取部分需要权限的数据 */
export const loginAnonymous = () => httpGet('/register/anonimous');

// ═══════ 验证码 ═══════

/**
 * 发送验证码
 * @param phone 手机号
 * @param ctcode 国家码，默认为 86
 */
export const captchaSent = (params: { phone: string; ctcode?: number }) =>
    httpGet('/captcha/sent', params);

/**
 * 验证验证码是否正确
 * @param phone 手机号
 * @param captcha 验证码
 * @param ctcode 国家码，默认为 86
 */
export const captchaVerify = (params: { phone: string; captcha: string; ctcode?: number }) =>
    httpGet('/captcha/verify', params);

// ═══════ 二维码登录 ═══════

/** 获取二维码登录所需的 key */
export const qrLoginKey = () => httpGet('/login/qr/key');

/**
 * 传入 key 生成二维码 Base64 字符串
 * @param key 通过 qrLoginKey 获取到的 key
 * @param qrimg 是否返回 base64 图像
 */
export const qrLoginCreate = (params: { key: string; qrimg?: boolean }) =>
    httpGet('/login/qr/create', params);

/**
 * 轮询检查二维码扫描和登录状态
 * 状态码：800 扫码，801 等待扫码，802 待确认，803 授权登录成功
 */
export const qrLoginCheck = (params: { key: string; noCookie?: boolean }) =>
    httpGet('/login/qr/check', params);

// ═══════ 搜索 ═══════

/**
 * 搜索功能
 * @param keywords 搜索关键词
 * @param limit 返回数量，默认 30
 * @param offset 偏移量，用于分页
 * @param type 搜索类型：1 歌曲, 10 专辑, 100 歌手, 1000 歌单, 1004 MV 等
 */
export const search = (params: {
    keywords: string;
    limit?: number;
    offset?: number;
    type?: 1 | 10 | 100 | 1000 | 1002 | 1004 | 1006 | 1009 | 1014 | 1018 | 2000;
}) => httpGet('/search', params);

/**
 * 云搜索（相较于普通搜索，返回更丰富的结果和数据结构）
 * 参数与普通搜索一致
 */
export const cloudSearch = (params: {
    keywords: string;
    limit?: number;
    offset?: number;
    type?: 1 | 10 | 100 | 1000 | 1002 | 1004 | 1006 | 1009 | 1014 | 1018 | 2000;
}) => httpGet('/cloudsearch', params);

/**
 * 搜索建议（下拉联想词）
 * @param type 传 'mobile' 返回移动端数据结构
 */
export const searchSuggest = (params: { keywords: string; type?: 'mobile' }) =>
    httpGet('/search/suggest', params);

/** 获取热门搜索列表（简略版） */
export const searchHot = () => httpGet('/search/hot');

/** 获取热门搜索列表（详细版，包含排名、热度值等） */
export const searchHotDetail = () => httpGet('/search/hot/detail');

/** 获取默认搜索关键词（通常显示在搜索框的 placeholder 中） */
export const searchDefault = () => httpGet('/search/default');

/** 搜索多重匹配（可能同时返回歌手、专辑、歌单等最佳匹配项） */
export const searchMultimatch = (params: { keywords: string }) =>
    httpGet('/search/multimatch', params);

// ═══════ 歌曲播放 ═══════

/**
 * 获取歌曲播放地址 (旧版接口)
 * @param id 歌曲 id
 * @param br 码率，默认 999000 即最大码率
 */
export const songUrl = (params: { id: string; br?: number }) => httpGet('/song/url', params);

/**
 * 获取歌曲播放地址 V1（新版接口，支持更细致的音质等级选择）
 * @param level 音质等级：standard(标准), higher(较高), lossless(无损), hires(Hi-Res) 等
 */
export const songUrlV1 = (params: {
    id: string;
    level?:
        | 'standard'
        | 'higher'
        | 'exhigh'
        | 'lossless'
        | 'hires'
        | 'jyeffect'
        | 'sky'
        | 'jymaster';
}) => httpGet('/song/url/v1', params);

/** 检查音乐是否可用（是否有版权等） */
export const checkMusic = (params: { id: string; br?: number }) => httpGet('/check/music', params);

/** 获取歌曲对应的下载地址 */
export const songDownloadUrl = (params: { id: string; br?: number }) =>
    httpGet('/song/download/url', params);

// ═══════ 评论 ═══════

/**
 * 获取歌曲评论
 * @param id 歌曲 id
 * @param limit 每页条数
 * @param offset 分页偏移量
 */
export const commentMusic = (params: {
    id: number;
    limit?: number;
    offset?: number;
    before?: number;
}) => httpGet('/comment/music', params);

/** 获取歌单评论 */
export const commentPlaylist = (params: {
    id: number;
    limit?: number;
    offset?: number;
    before?: number;
}) => httpGet('/comment/playlist', params);

/**
 * 获取热门评论
 * @param type 资源类型 0: 歌曲, 1: mv, 2: 歌单, 3: 专辑 等
 */
export const commentHot = (params: {
    id: number;
    type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    limit?: number;
    offset?: number;
    before?: number;
}) => httpGet('/comment/hot', params);

/**
 * 新版评论接口（支持多种排序和游标分页）
 * @param sortType 1: 按推荐排序, 2: 按热度排序, 3: 按时间排序
 * @param cursor 分页游标，第一页不传或传 0
 */
export const commentNew = (params: {
    id: number;
    type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    sortType?: 1 | 2 | 3;
    pageNo?: number;
    pageSize?: number;
    cursor?: number;
}) => httpGet('/comment/new', params);

/**
 * 发送/回复评论
 * @param t 1 发送, 2 回复
 * @param type 资源类型 0: 歌曲, 1: mv, 2: 歌单等
 * @param content 评论内容
 * @param commentId 回复的评论id (当 t=2 时需要)
 */
export const commentSend = (params: {
    t: 1 | 2;
    type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    id?: number;
    threadId?: string;
    content: string;
    commentId?: number;
}) => httpGet('/comment', params);

/**
 * 删除评论
 * @param t 0 为删除
 * @param commentId 需要删除的评论id
 */
export const commentDelete = (params: {
    t: 0;
    type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    id?: number;
    threadId?: string;
    commentId: number;
}) => httpGet('/comment', params);

// ═══════ 详情相关 ═══════

/**
 * 获取一首或多首歌曲的详细信息
 * @param ids 歌曲id，多个id用逗号隔开
 */
export const songDetail = (params: { ids: string }) => httpGet('/song/detail', params);

/** 获取专辑详细信息及专辑内包含的歌曲 */
export const albumDetail = (params: { id: number | string }) => httpGet('/album', params);

// ═══════ 歌单相关 ═══════

/**
 * 获取歌单详情（不包含完整歌曲列表，只有基本信息和前几个歌曲）
 * @param s 歌单最近的 s 个收藏者
 */
export const playlistDetail = (params: { id: number; s?: number }) =>
    httpGet('/playlist/detail', params);

/**
 * 获取歌单的所有歌曲
 * @param limit 限制获取数量，配合 offset 实现分页
 */
export const playlistTrackAll = (params: { id: number; limit?: number; offset?: number }) =>
    httpGet('/playlist/track/all', params);

/** 获取用户创建或收藏的歌单列表 */
export const userPlaylist = (params: { uid: number; limit?: number; offset?: number }) =>
    httpGet('/user/playlist', params);

/**
 * 获取精品（推荐）歌单
 * @param order 'new' 最新, 'hot' 最热
 * @param cat 歌单分类标签，如 "华语", "古风" 等
 */
export const topPlaylist = (params: {
    order?: 'new' | 'hot';
    cat?: string;
    limit?: number;
    offset?: number;
}) => httpGet('/top/playlist', params);

/** 获取新歌速递列表 (type 决定地区分类) */
export const topSong = (params: { type: 0 | 7 | 96 | 8 | 16 }) => httpGet('/top/song', params);

/** 获取所有榜单的摘要列表 */
export const toplist = () => httpGet('/toplist');

/** 获取所有榜单的详细列表（包含前3首歌曲名） */
export const toplistDetail = () => httpGet('/toplist/detail');

/** 获取用户的最近播放的歌曲记录 */
export const recordRecentSong = (params?: { limit?: number }) =>
    httpGet('/record/recent/song', params);

// ═══════ MV 相关 ═══════

/** 获取 MV 的详细信息 */
export const mvDetail = (params: { mvid: number | string }) => httpGet('/mv/detail', params);

/** 获取 MV 的播放地址 (支持不同分辨率如 1080, 720, 480 等) */
export const mvUrl = (params: { id: number | string; r?: number }) => httpGet('/mv/url', params);

/** 获取相似推荐 MV */
export const simiMv = (params: { mvid: number | string }) => httpGet('/simi/mv', params);

/** 获取全部 MV 列表（支持地区、类型、排序筛选） */
export const mvAll = (params: {
    area?: string;
    type?: string;
    order?: string;
    limit?: number;
    offset?: number;
}) => httpGet('/mv/all', params);

/** 单独的歌曲搜索别名（等同于 search） */
export const searchSong = (params: { keywords: string; limit?: number; offset?: number }) =>
    httpGet('/search', params);

// ═══════ 歌词相关 ═══════

/**
 * 获取歌曲的歌词
 * 返回的数据通常包含原文歌词 (lrc)、翻译歌词 (tlyric) 以及罗马音等
 */
export const lyric = (params: { id: number | string }) => httpGet('/lyric', params);

// ═══════ 推荐发现相关 ═══════

/** 获取首页推荐歌单 (需登录才会个性化，否则返回通用推荐) */
export const personalized = (params?: { limit?: number }) => httpGet('/personalized', params);

/** 获取首页推荐新音乐 */
export const personalizedNewsong = (params?: { limit?: number }) =>
    httpGet('/personalized/newsong', params);

/** 获取首页推荐 MV */
export const personalizedMv = () => httpGet('/personalized/mv');

/** 获取所有的歌单分类（语种、风格、场景等） */
export const playlistCatlist = () => httpGet('/playlist/catlist');

/** 获取热门歌手排行榜 */
export const topArtists = (params?: { limit?: number; offset?: number }) =>
    httpGet('/top/artists', params);

/**
 * 获取歌手分类列表
 * @param type 歌手类型 (-1:全部, 1:男歌手, 2:女歌手, 3:乐队)
 * @param area 地区 (-1:全部, 7:华语, 96:欧美, 8:日本, 16:韩国, 0:其他)
 * @param initial 按首字母筛选 (a-z)
 */
export const artistList = (params?: {
    type?: number;
    area?: number;
    initial?: string;
    limit?: number;
    offset?: number;
}) => httpGet('/artist/list', params);

/** 获取歌手的基本详细信息 */
export const artistDetail = (params: { id: number }) => httpGet('/artist/detail', params);

/** 获取歌手的热门50首单曲 */
export const artistTopSong = (params: { id: number }) => httpGet('/artist/top/song', params);

/** 获取歌手发行的所有专辑 */
export const artistAlbum = (params: { id: number; limit?: number; offset?: number }) =>
    httpGet('/artist/album', params);

/** 获取歌手的图文简介描述 */
export const artistDesc = (params: { id: number }) => httpGet('/artist/desc', params);

/** 获取歌手相关的 MV 列表 */
export const artistMv = (params: { id: number; limit?: number; offset?: number }) =>
    httpGet('/artist/mv', params);

/**
 * 获取新碟上架列表
 * @param area 地区 (ALL:全部, ZH:华语, EA:欧美, KR:韩国, JP:日本)
 */
export const albumNew = (params?: {
    area?: 'ALL' | 'ZH' | 'EA' | 'KR' | 'JP';
    limit?: number;
    offset?: number;
}) => httpGet('/album/new', params);

/** 获取最新发行的精选专辑 */
export const albumNewest = () => httpGet('/album/newest');

/** 获取每日推荐歌曲 (强依赖用户登录账号的听歌口味) */
export const recommendSongs = () => httpGet('/recommend/songs');

/** 获取每日推荐歌单 (强依赖用户登录账号的听歌口味) */
export const recommendResource = () => httpGet('/recommend/resource');

/** 获取私人 FM (电台) 的歌曲，根据用户喜好无尽推送 */
export const personalFm = () => httpGet('/personal_fm');

// ═══════ 有声小说自定义接口 (/sapi) ═══════

/**
 * 获取热门主播列表
 */
export const getPopularAuthors = () => fetch('/sapi/authors/popular').then(r => r.json());

/**
 * 获取有声书库列表
 */
export const getAudiobooks = () => fetch('/sapi/audiobooks').then(r => r.json());

/**
 * 获取有声书详情及章节列表
 * @param bookId 书籍ID
 */
export const getAudiobookDetail = (bookId: string) =>
    fetch(`/sapi/audiobooks/detail?bookId=${encodeURIComponent(bookId)}`).then(r => r.json());
