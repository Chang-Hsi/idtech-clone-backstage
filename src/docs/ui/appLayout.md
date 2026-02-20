# AppLayout 企劃書（idtech-clone-backstage）

## 1. 目標與定位

本文件定義 `idtech-clone-backstage` 後台系統目前採用的版型策略、專案結構與路由規劃。

核心目標：

- 採用類 Strapi 的後台工作流版型
- 先以「頁面型管理」作為主導航
- 搭配「內容型管理」作為子導航輔助
- 讓後續 CMS 功能可在此骨架上逐步擴充

## 2. 版型策略（目前已實作）

### 2.1 三區塊結構

整體採用三區塊：

1. 主 Sidebar（最左側，固定）
2. 子 Sidebar（依路由顯示）
3. Main Workspace（右側主要工作區）

### 2.2 主 Sidebar

主 Sidebar 由三部分構成：

1. 頂部 Logo 區
2. 中段主導航 icons
3. 底部頭像框（帳號入口）

目前主導航設計：

- Dashboard
- Pages
- SEO
- Settings

設計原則：

- 入口精簡，先聚焦 CMS MVP 所需
- 強調 icon 導航與 active 狀態
- 固定貼齊左側，保持全局可見

### 2.3 子 Sidebar（Context Panel）

子 Sidebar 在需要深層管理的路由顯示。

目前規則：

- 當主模組為 `Pages` 時顯示
- 顯示後會擠壓 Main 區塊（desktop）
- 內容包含：搜尋框、分組清單

目前分組：

1. Page Types（頁面型）
   - Home / Products / Use Cases / Resources / Company / Contact / Legal
2. Content Types（內容型）
   - Products / Collections / Articles / Jobs

### 2.4 Main Workspace

Main 區塊為主要編輯區域：

- 顯示目前路由對應頁面內容
- 在 MVP 階段先使用 placeholder 頁面
- 後續替換為實際管理畫面（表格、表單、編輯器）

## 3. 導航模型決策

目前採用的決策：

1. 主 Sidebar：頁面型管理 + SEO + Settings
2. 子 Sidebar：內容型管理輔助（由 Pages 模組帶出）
3. 主/子導航來源：
   - 第一階段由 router metadata 控制
   - 第二階段再考慮改為後端配置

## 4. Router 結構（目前已實作）

## 4.1 路由骨架

- `/` 進入後導向 `/pages/home`
- 主要頁面皆掛載於 `AppLayout`
- 使用 `handle.primaryNav` / `handle.secondaryNav` 控制 layout 行為

## 4.2 目前路由清單

主模組路由：

- `/dashboard`
- `/pages/home`
- `/pages/banner-hub`
- `/pages/contact`
- `/pages/legal`
- `/pages/content/products`
- `/pages/content/products/new`
- `/pages/content/products/:slug/edit`
- `/pages/content/collections`
- `/pages/content/collections/new`
- `/pages/content/collections/:slug/edit`
- `/pages/content/use-cases`
- `/pages/content/resources`
- `/pages/content/company`
- `/pages/content/articles`
- `/pages/content/jobs`
- `/seo`
- `/settings`

未匹配路由：

- `*` 目前導回 `/pages/home`

## 5. 專案結構（目前狀態）

```txt
src/
  app/
    store.js

  components/
    pages/
      bannerHub/
      collections/
      home/
      products/

  layout/
    AppLayout.jsx
    AuthLayout.jsx

  pages/
    pageTypes/
      HomePageManager.jsx
      BannerHubPageManager.jsx
    contentTypes/
      ProductsContentPageManager.jsx
      ProductCreatePageManager.jsx
      ProductEditPageManager.jsx
      CollectionsContentPageManager.jsx
      CollectionCreatePageManager.jsx
      CollectionEditPageManager.jsx
    LoginPage.jsx
    PlaceholderPage.jsx

  routes/
    guards/
    router.jsx

  features/
    auth/

  lib/
    request.js

  docs/
    ui/
      appLayout.md

  index.css
  main.jsx
```

說明：

- `AppLayout.jsx`：後台主要框架（主 Sidebar + 子 Sidebar + Main）
- `AuthLayout.jsx`：登入流程使用的布局
- `router.jsx`：路由與 layout metadata 規劃中心
- `pageTypes/*Manager.jsx`：Page Types 入口層（只拼接）
- `contentTypes/*Manager.jsx`：Content Types 入口層（只拼接）
- `components/pages/*`：頁面實際功能與 UI
- `store.js`：Redux store 基礎入口

## 6. Responsive 規劃（待強化）

目前完成 desktop 基礎樣式，後續優化：

1. tablet：主 Sidebar 收合、子 Sidebar 可切換顯示
2. mobile：主/子 Sidebar 改為抽屜層
3. 保持 Main 區優先可讀

## 7. 下一步開發建議

1. 建立 `AuthLayout`（未登入頁專用）
2. 加入 route guard（未登入導去 `/auth/login`）
3. 以 `Pages` 模組優先實作真實 CRUD 頁面
4. 將 `SEO` 模組接入後端 API
5. 規劃主/子導航配置後端化（第二階段）

## 8. 備註

本文件為當前實作基線。若後續調整導航模型、路由規則或 layout 行為，請同步更新本企劃書，保持設計與實作一致。
