# Company 後台企劃（定稿 v1）

## 1. 目標

Company 模組分成兩層：

1. `Company Cards`：管理前台 `company-page.cards` 列表
2. `About Us`、`Careers`：管理各自子頁內容（因資料結構不同，不共用同一編輯器）

## 2. 邊界規則

1. Hero/Banner 不在 Company 管理，統一由 `Banner Hub (Level-2)` 維護。
2. SEO 不在 Company 管理，統一由 `SEO` 模組維護。
3. Company 只處理內容本體，不處理頁首視覺與 SEO metadata。

## 3. Sidebar 與路由

Content Types 下 `Company` 改為可展開子目錄：

1. Company Cards：`/pages/content/company/cards`
2. About Us：`/pages/content/company/about-us`
3. Careers：`/pages/content/company/careers`

設計原則：

1. 不依 cards 動態長出 sidebar 項目
2. 固定資訊架構，避免導航爆炸
3. 子頁用專屬頁面管理器，各自演進

## 4. Company Cards（MVP）

`/pages/content/company/cards` 以卡片清單呈現，不走 table。

列表功能：

1. Tabbar：`Active` / `Archived`
2. 卡片 Grid（桌機 3 欄，平板 2 欄，手機 1 欄）
3. 點擊卡片或 Edit icon 開啟編輯 Drawer
4. 拖拽排序（以 drag handle 觸發），排序即同步回寫後端
5. 搜尋（title / description / to）
6. `New Card` 按鈕新增資料

編輯 Drawer：

1. `id`（唯讀）
2. `title`
3. `description`
4. `to`
5. `imageUrl` + Preview（失焦 500ms 更新 + 錯誤防呆）
6. `status`（可切換 active / archived）

目前管理欄位（資料模型）：

1. `id`
2. `to`
3. `title`
4. `imageUrl`
5. `description`
6. `status`
7. `sortOrder`
8. `updatedAt`
9. `updatedBy`

## 5. 子頁策略

1. About Us：單頁型管理
2. Careers：列表 + 內頁型管理
3. 兩者 UI/驗證/資料模型可獨立，不強行共用

## 6. API（Company Cards）

1. `GET /api/backstage/content/company/cards?status=&q=`
2. `POST /api/backstage/content/company/cards`
3. `PUT /api/backstage/content/company/cards/:id`
4. `POST /api/backstage/content/company/cards/:id/archive`
5. `POST /api/backstage/content/company/cards/:id/restore`
6. `POST /api/backstage/content/company/cards/reorder`

Public API 對齊：

1. `GET /api/company` 僅回傳 active cards（過濾 archived）

## 7. 與 Banner Hub 的同步規則

未來若新增新的 Company 子頁：

1. 需新增對應路由與 sidebar 子項
2. 需在 Banner Hub Level-2 增加對應 banner 記錄
3. 需建立該子頁自己的管理頁面（或先用 placeholder）
