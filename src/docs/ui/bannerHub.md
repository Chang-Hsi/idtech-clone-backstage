# Banner Hub 企劃書（現況版）

## 1. 目的

集中管理前台多頁 Banner 文案與主視覺，讓編輯者在同一頁快速維護：

1. 核心頁 Banner（Products / Use Cases / Resources / Company）
2. 細節頁 Banner（Collection、Use Case Detail、About Us、Careers）
3. Product Detail Banner 與 Datasheet

## 2. 路由與導航（現況）

1. 後台路由：`/pages/banner-hub`
2. 側欄名稱：`Page Types > Banner Hub`
3. 頁面組成：
- `src/pages/pageTypes/BannerHubPageManager.jsx`：只負責拼接
- `src/components/pages/bannerHub/BannerHubManagerContent.jsx`：主內容與邏輯
- `src/components/pages/bannerHub/BannerHubRowEditorDrawer.jsx`：抽屜編輯

## 3. 資料分區（Tab）

## 3.1 Core Banners

管理頁面：

1. Products
2. Use Cases
3. Resources
4. Company

欄位：

1. `eyebrow`
2. `title`
3. `description`

## 3.2 Detail Banners

管理頁面：

1. ProductCollectionPage
2. UseCasesDetailPage
3. AboutUsPage
4. CareersPage

欄位：

1. `image`（縮圖）
2. `eyebrow`
3. `title`
4. `description`
5. `backgroundImageUrl`（僅在抽屜編輯）

說明：列表已移除 `Background Image URL` 欄，改用縮圖視覺化。

## 3.3 Product Detail Banners

管理頁面：

1. ProductDetailPage（逐產品）

欄位：

1. `slug`
2. `image`（縮圖）
3. `eyebrow`
4. `title`
5. `description`
6. `datasheetName`
7. `datasheet actions`（預覽 / 下載 / 上傳）

## 4. UI/UX 規則（現況）

1. 表格為唯讀列表，不在格內直接放 input。
2. 點擊任一列開右側抽屜編輯。
3. 長文字以 `...` 截斷，不換行。
4. 欄位多時，只在卡片內表格區塊出現 X 軸捲動，不推動整個 Layout。
5. Product 與 Detail 列表均顯示圖片縮圖欄位。
6. Datasheet 以 3 個 icon 操作：Preview / Download / Upload（含 tooltip title）。

## 5. 抽屜編輯規則（現況）

`BannerHubRowEditorDrawer` 會依 Tab 顯示對應欄位：

1. Core：`eyebrow`、`title`、`description`
2. Detail：上述欄位 + `backgroundImageUrl`
3. Product：上述欄位 + `datasheetName`

圖片預覽機制：

1. 若有圖片路徑，顯示縮圖預覽。
2. `backgroundImageUrl` 欄位失焦後延遲 500ms 更新預覽。
3. 防呆狀態：
- 無路徑：`No image URL`
- 載入中：`Loading preview...`
- 載入失敗：`Image failed to load`

## 6. API 串接（現況）

前端 API 模組：`src/api/backstageBannerHubApi.js`

1. `GET /api/backstage/banner-hub`
2. `PUT /api/backstage/banner-hub/core`
3. `PUT /api/backstage/banner-hub/detail-pages`
4. `PUT /api/backstage/banner-hub/product-details`
5. `POST /api/backstage/banner-hub/product-details/:productSlug/datasheet`

Datasheet 檔案：

1. 預覽：`GET /api/backstage/files/datasheets/:filename`
2. 下載：`GET /api/backstage/files/datasheets/:filename?download=true`
3. 上傳限制：PDF only（前後端皆限制）

## 7. 責任邊界

Banner Hub 僅負責 Banner 層資料，不負責完整內容實體 CRUD：

1. 不編輯產品 specs/features 等完整內容模型。
2. 不負責 collections 與 products 的深層關聯維護。
3. 實體內容管理仍由 `Content Types > Products / Collections` 處理。

## 8. 驗收標準（現況）

1. 可在 `/pages/banner-hub` 看到三個 Tab 並成功載入 API。
2. 可點擊任一列開抽屜修改並儲存。
3. 表格寬欄不會拖動整個 App Layout，只在表格卡片內橫向捲動。
4. Product Detail 可完成 Datasheet 預覽、下載、上傳（PDF）。
5. Detail/Product 抽屜可顯示圖片預覽，錯誤路徑有 fallback 畫面。
