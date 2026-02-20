# Content Types > Collections 企劃書（規劃 v1）

## 1. 目標

建立後台 `Content Types > Collections`，管理 `ProductCollectionPage` 的實體內容，並提供「隸屬 products」維護能力。

## 2. 責任邊界

`Collections` 要做：

1. Collection 清單（列表）
2. Collection 新增 / 編輯 / 封存（可選）
3. 維護 Collection 與 Products 的關聯（新增/移除）
4. 維護 Collection 內容欄位（hero、intro、valueProps、資源連結）

`Collections` 不做：

1. 跨頁 Banner（由 `Banner Hub` 管）
2. Product 主資料編輯（由 `Content Types > Products` 管）

## 3. 路由規劃

1. `/pages/content/collections`：列表頁
2. `/pages/content/collections/new`：新增頁
3. `/pages/content/collections/:slug/edit`：編輯頁

說明：與 Products 同一風格，`pages` 僅拼接，實作在 `components/pages/collections`。

## 4. 列表頁規格（MVP）

欄位：

1. `ID`
2. `IMAGE`（縮圖）
3. `Name`
4. `Slug`
5. `Products Count`
6. `Updated At`
7. `Actions`（Edit / Archive）

篩選：

1. 只需要一個 `input search`（name / slug）
2. 分頁（limit / offset）
3. 不需要 use-cases/collections 下拉篩選

## 5. 新增/編輯頁規格（MVP）

基礎欄位：

1. `name`
2. `slug`（建議後端自動生成，編輯唯讀）
3. `heroTitle`
4. `heroSubtitle`
5. `intro`
6. `media.heroImageUrl`

進階欄位：

1. `valueProps[]`
2. `resources[]`
3. `hasFeaturedProductsSection`

關聯欄位（重點）：

1. `linkedProducts[]`
2. 需支援：新增隸屬 product、移除隸屬 product

## 6. Products 勾選 UI 建議

你提到「怎麼勾選 products 還沒想好」，建議如下：

方案 A（推薦 MVP）：雙欄 Transfer List
1. 左側：可選 products（可搜尋）
2. 右側：已選 products
3. 中間：`Add >`、`< Remove`

優點：
1. 大量資料時可控
2. 關聯狀態清楚
3. 實作成本中等，維護簡單

方案 B：可搜尋 Multi-select 下拉
1. 一個輸入框可多選 tags
2. 已選以 chips 顯示，可 X 移除

優點：操作快
缺點：大量產品時可讀性較差

方案 C：產品表格 + checkbox
1. 列表勾選加入 collection
2. 可搭配分頁、搜尋

優點：資訊完整
缺點：新增頁畫面較重

## 7. 我建議的落地順序

1. 先做方案 A（Transfer List）
2. 先只存 `productSlug[]` 關聯
3. 後續再補排序（若需要顯示順序）

## 8. API 規劃（MVP）

列表：

1. `GET /api/backstage/content/collections?limit=10&offset=0&q=`
2. 回傳：`items`, `pagination`

單筆：

1. `GET /api/backstage/content/collections/:slug`

新增：

1. `POST /api/backstage/content/collections`

更新：

1. `PUT /api/backstage/content/collections/:slug`

封存：

1. `POST /api/backstage/content/collections/:slug/archive`（可選）

關聯 products 資料來源：

1. `GET /api/backstage/content/products?status=active&limit=&offset=&q=`
2. 或提供簡化版：`GET /api/backstage/content/products/options?q=`

## 9. 驗收標準

1. 可建立新 collection 並指定隸屬 products（不限數量）
2. 可在編輯頁新增/移除隸屬 products
3. 列表頁只用 search 作篩選並能分頁
4. 前台 collection 頁可正確顯示其隸屬 products
