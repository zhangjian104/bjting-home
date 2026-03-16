# 路由和页面配置

基于 `src/routers/index.ts` 中的配置，当前项目（经过有声小说词汇替换后）的所有页面及其业务作用盘点如下：

## 核心布局 (根路由 `/`)

整个应用被包裹在一个响应式根布局中，根据设备宽度（`isMobile`，小于等于768px视为移动端），自动切换加载：

- **桌面端布局**: `@/layout/index.vue`（通常包含侧边栏导航、顶部控制栏和底部的全局播放控件）
- **移动端布局**: `@/layout/mobile/index.vue`（通常包含底部 Tab 导航和迷你播放条等）

---

## 子页面（渲染在根布局内部）

所有业务页面都沿用了“响应式按需加载”的设计。下表列出了各个路由路径、对应的组件和业务作用（结合有声小说的上下文）：

| 路由路径 (`path`) | 路由名称 (`name`) | 桌面端组件        | 移动端组件               | 业务作用                                                                                               |
| :---------------- | :---------------- | :---------------- | :----------------------- | :----------------------------------------------------------------------------------------------------- |
| `/`               | `home`            | `index.vue`       | `mobile/index.vue`       | **首页** (发现)。包含 Banner 轮播、推荐书单、热门演播者（主播）、最新上架等。                          |
| `/playlist/:id`   | `playlist`        | `playlist.vue`    | `mobile/playlist.vue`    | **书单 / 合集详情页**。展示书籍/合集的详细信息（封面、作者等）以及内部包含的章节（曲目）列表。         |
| `/recent`         | `recent`          | `recent.vue`      | `mobile/recent.vue`      | **最近收听**。展示用户最近播放过的章节/内容的历史记录。                                                |
| `/my-music`       | `my-music`        | `my-music.vue`    | `mobile/recent.vue`      | **我的书架** (原“我的音乐”)。管理用户收藏的书单、内容（移动端当前复用了 recent 组件）。                |
| `/likes`          | `likes`           | `likes.vue`       | `mobile/likes.vue`       | **我喜欢的章节**。展示用户点过“红心（收藏）”的具体章节（歌曲）列表。                                   |
| `/search`         | `search`          | `search.vue`      | `mobile/search.vue`      | **搜索中心**。用于搜索书籍、章节、演播者等。包含热门搜索、搜索联想和按分类查看结果。                   |
| `/charts`         | `charts`          | `charts.vue`      | `mobile/charts.vue`      | **排行榜**。展示各类榜单（如畅销榜、新书榜等）。                                                       |
| `/artists`        | `artists`         | `artists.vue`     | `artists.vue`            | **全部演播者列表** (共用组件)。按分类/首字母等筛选条件展示演播者大全。                                 |
| `/new-albums`     | `new-albums`      | `new-albums.vue`  | `new-albums.vue`         | **最新上架** (共用组件)。展示近期更新的合集（原新碟上架）。                                            |
| `/artist/:id`     | `artist`          | `artist.vue`      | `mobile/artist.vue`      | **演播者主页**。展示某个主播的详细信息，包含他演播的热门章节、录制的合集列表。                         |
| `/song/:id`       | `song`            | `song.vue`        | `mobile/song.vue`        | **单集详情页**。原本用于展示单曲的信息（歌词、评论、相似推荐），在有声书中可作为章节详细信息的展示页。 |
| `/album/:id`      | `album`           | `album.vue`       | `mobile/album.vue`       | **合集详情页**。展示专辑级别的书籍详情与包含的章节列表。在业务逻辑上常与 `playlist` (书单) 有些交集。  |
| `/local-music`    | `local-music`     | `local-music.vue` | `mobile/local-music.vue` | **本地小说**。扫描并播放用户存储在本地的音频文件。                                                     |
| `/settings`       | `settings`        | `settings.vue`    | `mobile/settings.vue`    | **设置**。控制主题（暗黑/浅色）、毛玻璃背景样式、音质偏好、多语言切换等。                              |

## 已隐藏（被注释）的页面

在路由中还有两个关于视频的页面已经被注释掉（为了适应有声小说无视频特性而做的处理）：

- `/mv-list` (`mv-list.vue`)：视频精选列表。
- `/mv-player/:id` (`mv-player.vue`)：独立的高清视频/MV播放页。

## 架构总结

整体路由设计非常完善，利用 `@vueuse/core` 和 Vue 的异步组件 (`defineAsyncComponent`)，做到了**同一 URL 在不同设备上动态懒加载不同 UI 组件**的架构。这在前端项目改造成有声小说的过程中，允许我们非常方便地分别调整桌面端和移动端的视觉展示，而不必担心路由状态管理和核心业务逻辑相冲突。
