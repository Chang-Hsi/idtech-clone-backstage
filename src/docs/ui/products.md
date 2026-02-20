# Content Types > Products 企劃書（已落地 v2）

## 1. 目標

建立後台 `Content Types > Products`，管理 `ProductDetailPage` 實體資料，並與 `Banner Hub` 職責拆分。

## 2. 已落地範圍

目前已完成：

1. 產品列表頁（搜尋、Tab、分頁、封存/還原）
2. 產品新增頁
3. 產品編輯頁
4. 後端 API（列表、單筆、建立、更新、封存、還原）
5. `slug` 後端自動生成與唯讀策略
6. `collection/use-case` 關聯篩選（兩個下拉）
7. 封存產品從前台公開 API 隱藏

## 3. 前端架構（已落地）

路由：

1. `/pages/content/products`
2. `/pages/content/products/new`
3. `/pages/content/products/:slug/edit`

頁面分層：

1. `pages` 僅拼接：
   - `src/pages/Pages/ProductsContentPageManager.jsx`
   - `src/pages/Pages/ProductCreatePageManager.jsx`
   - `src/pages/Pages/ProductEditPageManager.jsx`
2. 實作在 `components`：
   - `src/components/pages/products/ProductsContentList.jsx`
   - `src/components/pages/products/ProductEditorPage.jsx`

## 4. 列表頁功能（已落地）

表格欄位：

1. `ID`（前端序號）
2. `IMAGE`（圓形縮圖）
3. `Name`
4. `Slug`
5. `Status`
6. `Collection Count`
7. `Updated At`
8. `Actions`（Edit / Archive / Restore）

互動：

1. 關鍵字搜尋（name / slug）
2. Tab 切換（Active / Archived）
3. 分頁（共用 `Pagination`）
4. 下拉篩選：
   - Use Cases
   - Collections
5. `Archive` 有確認彈窗（與 Home 一致）
6. `Restore` 直接執行（目前無確認彈窗）

## 5. 新增/編輯頁功能（已落地）

欄位：

1. Basic：
   - `name`
   - `slug`（唯讀）
   - `shortDescription`
   - `status`
2. Media：
   - `media.heroImageUrl`
   - `Background Preview`（失焦後 500ms 更新 + 防呆）
3. Detail：
   - `detail.heroEyebrow`
   - `detail.heroDescription`
   - `detail.heroImageUrl`
4. Downloads：
   - `downloads.datasheetName`
   - `downloads.datasheetUrl`
   - `downloads.datasheetMimeType`

儲存行為：

1. 新增成功自動回列表頁
2. 編輯成功自動回列表頁

## 6. 後端 API（已落地）

`idtech-clone-api/src/server.js`：

1. `GET /api/backstage/content/products`
   - query: `limit`, `offset`, `q`, `status`, `collectionSlug`, `useCaseSlug`
   - 回傳：
     - `items`
     - `pagination`
     - `filterOptions.collections`
     - `filterOptions.useCases`
2. `GET /api/backstage/content/products/:slug`
3. `POST /api/backstage/content/products`
4. `PUT /api/backstage/content/products/:slug`
5. `POST /api/backstage/content/products/:slug/archive`
6. `POST /api/backstage/content/products/:slug/restore`

## 7. 關聯資料（已落地）

已補正式關聯表：

1. `ProductCollectionLink`
2. `ProductUseCaseLink`

說明：

1. seed 會把舊 JSON payload 關聯同步寫入 link tables。
2. API 會優先讀 link tables；必要時 fallback 舊 JSON。

## 8. 前台公開 API 同步規則（已落地）

封存 (`archived`) 產品會從公開前台 API 隱藏：

1. `/api/products` 不回傳 archived
2. `/api/products/collections/:slug` 會過濾 archived 的 display/featured products
3. `/api/products/:productSlug` archived 直接回 404
4. `/api/use-cases/:slug` 會過濾 archived 的 `featuredProductSlugs`

## 9. 待辦（下一階段）

1. Products 編輯頁欄位驗證（URL 格式、字數上限、必填規則）
2. Products 與 Collections/Use Cases 關聯管理 UI（而不只做篩選）
3. Datasheet 真正檔案上傳流程整合進 Products 編輯頁
