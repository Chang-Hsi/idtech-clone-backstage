# Content Types > Use Cases 企劃書（已落地 v1）

## 1. 目標

管理 `UseCasesDetailPage` 的實體內容，並維護 use case 與 products 的關聯。

## 2. 責任邊界

`Use Cases` 負責：

1. 列表（查詢、分頁、Active/Archived）
2. 新增 / 編輯
3. Archive / Restore
4. 維護 use case 與 products 關聯

`Use Cases` 不負責：

1. Banner（由 `Banner Hub` 集中管理）
2. Products 主資料（由 `Content Types > Products` 管）

## 3. 路由（已實作）

1. `/pages/content/use-cases`：列表頁
2. `/pages/content/use-cases/new`：新增頁
3. `/pages/content/use-cases/:slug/edit`：編輯頁

實作分層：

1. `src/pages/contentTypes/*Manager.jsx` 只拼接
2. `src/components/pages/useCases/*` 放實際功能

## 4. 列表頁（已實作）

欄位：

1. `ID`
2. `Image`
3. `Title`
4. `Slug`
5. `Products`
6. `Updated At`
7. `Status`
8. `Actions`（Edit / Archive / Restore）

行為：

1. Tab：`Active` / `Archived`
2. Search：title / slug
3. Pagination：`limit` / `offset`
4. Archive 有二次確認彈窗（`ConfirmDialog`）

## 5. 新增/編輯頁（已實作）

欄位：

1. `title`
2. `slug`（編輯唯讀，新增由後端產生）
3. `subtitle`
4. `description`
5. `heroImageUrl`（Background Image URL）
6. `status`

媒體預覽：

1. `Background Preview` 顯示於 `Background Image URL` 下方
2. input `blur` 後 500ms 更新預覽
3. 含防呆（無 URL / 載入失敗）
4. 已套用避免卡住 `Loading preview...` 的穩定機制

## 6. Linked Products UI（已實作）

雙欄勾選移動：

1. 左欄 `Available`：不隸屬該 use case 的 products
2. 右欄 `Selected`：已隸屬該 use case 的 products
3. 兩欄皆支援搜尋
4. 每列含 checkbox + 圓形縮圖 + 名稱
5. 中間按鈕：右箭頭加入、左箭頭移除

## 7. API 契約（目前使用）

Use Cases：

1. `GET /api/backstage/content/use-cases?limit=&offset=&q=&status=active|archived|all`
2. `GET /api/backstage/content/use-cases/:slug`
3. `POST /api/backstage/content/use-cases`
4. `PUT /api/backstage/content/use-cases/:slug`
5. `POST /api/backstage/content/use-cases/:slug/archive`
6. `POST /api/backstage/content/use-cases/:slug/restore`

Linked products options：

1. 前端採 `GET /api/backstage/content/products?limit=100&offset=0&q=&status=all`
2. 再映射為 options（`value/label/imageUrl`）

## 8. 資料一致性規則

1. 關聯來源：`ProductUseCaseLink`
2. 備援來源：`featuredProductSlugs`
3. 前台 `GET /api/use-cases/:slug` 若 `status=archived` 回 404
4. 前台 detail 會自動過濾已 archived 的 products

## 9. 驗收標準

1. 可建立 use case 並維護 linked products（不限數量）
2. 可在編輯頁新增/移除 linked products
3. 列表頁可 search + tab + 分頁
4. archive/restore 後，前台 detail 可正確隱藏/恢復
