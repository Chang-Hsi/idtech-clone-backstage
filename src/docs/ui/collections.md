# Content Types > Collections 企劃書（已落地 v2）

## 1. 目標

管理 `ProductCollectionPage` 實體內容，並可維護 collection 與 products 的關聯，且支援封存/還原流程。

## 2. 責任邊界

`Collections` 負責：

1. 列表（查詢、分頁、Active/Archived）
2. 新增 / 編輯
3. Archive / Restore
4. 維護 collection 與 products 關聯

`Collections` 不負責：

1. 跨頁 banner（由 `Banner Hub` 管）
2. 產品主體欄位（由 `Content Types > Products` 管）

## 3. 路由（已實作）

1. `/pages/content/collections`：列表頁
2. `/pages/content/collections/new`：新增頁
3. `/pages/content/collections/:slug/edit`：編輯頁

實作分層：

1. `src/pages/contentTypes/*Manager.jsx` 僅拼接
2. `src/components/pages/collections/*` 放實際功能

## 4. 列表頁（已實作）

欄位：

1. `ID`（依分頁 offset 計算）
2. `Image`（圓形縮圖）
3. `Name`
4. `Slug`
5. `Products`
6. `Updated At`
7. `Status`
8. `Actions`（Edit / Archive / Restore）

行為：

1. Tab：`Active` / `Archived`
2. Search：name / slug
3. Pagination：`limit` / `offset`
4. Archive 有二次確認彈窗（`ConfirmDialog`）

## 5. 新增/編輯頁（已實作）

基本欄位：

1. `name`
2. `slug`（編輯唯讀，新增由後端產生）
3. `heroTitle`
4. `heroSubtitle`
5. `intro`
6. `imageUrl`（Background Image URL）
7. `status`

媒體預覽：

1. `Background Preview` 顯示於 `Background Image URL` 下方
2. input `blur` 後 500ms 更新預覽
3. 含防呆（無 URL / 載入失敗）
4. 已套用避免卡住 `Loading preview...` 的穩定機制

## 6. Linked Products UI（已實作）

採用雙欄選取（Transfer List + checkbox）：

1. 左欄 `Available`：不隸屬該 collection 的 products
2. 右欄 `Selected`：已隸屬該 collection 的 products
3. 兩欄都支援搜尋
4. 每列含：
 - checkbox
 - 圓形縮圖
 - product 名稱
5. 中間按鈕：
 - 右箭頭：把左欄勾選項移到右欄
 - 左箭頭：把右欄勾選項移回左欄

## 7. API 契約（目前使用）

Collections：

1. `GET /api/backstage/content/collections?limit=&offset=&q=&status=active|archived|all`
2. `GET /api/backstage/content/collections/:slug`
3. `POST /api/backstage/content/collections`
4. `PUT /api/backstage/content/collections/:slug`
5. `POST /api/backstage/content/collections/:slug/archive`
6. `POST /api/backstage/content/collections/:slug/restore`

Linked products options：

1. 前端目前採 `GET /api/backstage/content/products?limit=100&offset=0&q=&status=all`
2. 再映射為 options（`value/label/imageUrl`）

備註：

1. 後端雖有 `products/options` 路由規劃，現階段前端為穩定性使用 products 列表 API。

## 8. 已修正資料一致性（Legacy）

已修正 `legacy-products` 關聯錯配：

1. 前台 `displayProducts.targetSlug` 對齊 `lx-1/lx-2/lx-3`
2. 後台 `linkedProductSlugs` 同步為 `lx-1/lx-2/lx-3`
3. 前後台資料一致

## 9. 驗收標準（現況）

1. Collections 可完整 CRUD（create/update + archive/restore）
2. 列表可依 status + search + pagination 管理資料
3. 編輯頁可透過雙欄勾選 UI 管理關聯 products
4. 前台 collection 頁與後台關聯資料一致
