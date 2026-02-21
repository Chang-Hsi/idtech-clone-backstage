# Resources 後台企劃（定稿 v1）

## 1. 目標

管理前台 `ResourcesPage` 與 `ResourceArticlePage` 的內容資料，讓內容可在後台完成：

1. 列表查詢與維護（Active / Archived）
2. 新增 / 編輯文章
3. 封存 / 還原
4. Markdown 內文編輯與預覽（對齊前台 md-prose 視覺）

---

## 2. 責任邊界

Resources 後台負責：

1. 文章列表資料（卡片用 metadata）
2. 文章內頁資料（markdown 內容）
3. 多語內容管理（至少 `en` / `zh`）
4. 發佈時間與排序依據維護（`publishedAt`）
5. 資料內容維護（不含 SEO）

Resources 後台不負責：

1. Banner（由 `Banner Hub` 集中管理）
2. Resources 子分類頁（`/resources/whitepapers` 等）
   - 目前暫不動工

---

## 3. 關鍵決策

1. 不做 `category` 欄位（目前前台也未啟用子分類頁）。
2. `slug` 不允許在前後台編輯：
   - 由後端依規則自動生成
   - 前端/後台僅顯示，不可修改
3. 採用「單一實體模型」：
   - 一筆 Resource 同時包含列表 metadata 與文章內容
   - 不拆成兩張主表
4. 內容採多語欄位（`en` / `zh`）
5. 文章排序預設依 `publishedAt desc`

---

## 4. 資料模型（MVP）

建議 Resource 實體欄位：

1. 系統欄位
   - `id`
   - `slug`（後端產生、唯讀）
   - `status`（`active` / `archived`）
   - `publishedAt`
   - `createdAt`
   - `updatedAt`
   - `updatedBy`

2. 列表欄位
   - `coverImageUrl`
   - `title`（i18n：`en` / `zh`）
   - `excerpt`（i18n：`en` / `zh`）

3. 內頁欄位
   - `contentMarkdown`（i18n：`en` / `zh`）

---

## 5. 後台頁面規劃

實作分層：

1. `src/pages/contentTypes/...` 只負責拼接
2. `src/components/pages/resources/*` 放實際功能

### 5.1 Resources 列表頁

欄位建議：

1. `ID`（前端序號）
2. `Image`
3. `Title (en)`
4. `Slug`（唯讀顯示）
5. `Published At`
6. `Updated At`
7. `Updated By`
8. `Status`
9. `Actions`（Edit / Archive / Restore）

行為：

1. Tab：`Active` / `Archived`
2. Search：`title` / `slug`
3. Pagination：`limit` / `offset`
4. Archive/Restore：二次確認彈窗（`ConfirmDialog`）

### 5.2 Resources 新增 / 編輯頁

區塊建議：

1. Basic
   - Title（en/zh，擇一必填）
   - Excerpt（en/zh，擇一必填）
   - Cover Image URL + Preview
   - Published At
   - Status
   - Slug（唯讀）

2. Article Content
   - Markdown Editor（en）
   - Markdown Editor（zh）
   - Live Preview（套 md-prose 樣式）
   - contentMarkdown（en/zh，擇一必填）

驗證：

1. 延用現有 schema-driven 驗證機制
2. 必填欄位顯示紅色 `*`
3. 欄位 blur 後顯示錯誤
4. submit 做全量驗證 + 錯誤摘要
5. 多語欄位採「en/zh 擇一必填」

---

## 6. API 規劃（MVP）

1. 列表：
   - `GET /api/backstage/content/resources?limit=&offset=&q=&status=`
2. 詳情：
   - `GET /api/backstage/content/resources/:slug`
3. 新增：
   - `POST /api/backstage/content/resources`
4. 更新：
   - `PUT /api/backstage/content/resources/:slug`
5. 封存：
   - `POST /api/backstage/content/resources/:slug/archive`
6. 還原：
   - `POST /api/backstage/content/resources/:slug/restore`

前台 API（同步改造方向）：

1. `GET /api/resources`
2. `GET /api/resources/:articleSlug`

---

## 7. 與前台對齊

1. `/resources` 使用列表資料（hero + items）
2. `/resources/:articleSlug` 使用單篇資料
3. 文章語言切換沿用現有 `?lang=` 方案
4. 前台語言 fallback：先取目前語言，若為空則回退另一語言
5. Prev / Next 可由同狀態文章的 `publishedAt` 推導（後端或前端擇一）

---

## 8. 開發順序建議

1. DB schema + migration（resources 實體）
2. seed 資料（至少 3 篇，含 en/zh）
3. backstage list API + list UI
4. backstage editor API + editor UI（含 markdown preview）
5. 前台 resources API 改接 DB
6. 前後台驗證與回歸測試
