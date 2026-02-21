# Careers 後台企劃（MVP）

## 1. 範圍定義

### In Scope
- 管理 `tabs`（地區分頁）
- 管理 `jobs`（職缺）
- 列表型管理 UI（參考 `UseCasesContentList`）
- 刪除 tab 前的隸屬檢查與阻擋流程

### Out of Scope
- `seo`
- `hero`
- `intro`（先視為固定文案，不提供編輯）

## 2. 資料來源與欄位（排除 seo/hero）

### Careers Page payload（核心）
- `tabs[]`: `{ key, label }`
- `jobs[]`:
  - `id`
  - `slug`
  - `title`
  - `isOpen`
  - `region`
  - `countryCode`
  - `locationLabel`
  - `employmentType`
  - `imageUrl`
  - `summary`
  - `jobDuties[]`
  - `qualifications[]`
  - `applyEmail`

## 3. 產品規則（你本次指定）

1. `slug` 不可編輯
- Create 時由系統生成。
- Edit 時唯讀顯示，不可修改。
- 後端仍需保留唯一性保護。

2. 刪除 tab 的阻擋規則
- 嘗試刪除某 tab（例如 `key = us`）時，先檢查 `jobs` 是否有 `countryCode === tab.key`。
- 若有，禁止刪除，顯示提醒彈窗。
- 提醒彈窗使用新元件：`src/components/dialog/RemindDialog.jsx`。
- 提示文案（建議）：
  - 標題：`Unable to Delete Tab`
  - 內容：`尚有隸屬該地區的職缺（{count} 筆），請先調整這些職缺的地區或封存後再刪除。`

3. 管理頁 UI 形式
- 以列表型管理為主，風格參考：`src/components/pages/useCases/UseCasesContentList.jsx`。
- 結構：
  - 上方工具區：Title、New Job 按鈕、Tab 切換、搜尋。
  - 中央列表區：table（可分 Active/Archived）。
  - 每列 actions：Edit / Archive（或 Restore）。

## 4. 畫面與互動設計

### A. Tabs 管理
- 建議在 Careers manager 頂部提供「Tab 管理區」：
  - 新增 tab
  - 編輯 label
  - 刪除 tab（帶阻擋檢查）
- `all` 為系統保留，不可刪除。
- tab key 建議受控 enum：`tw/us/jp`（MVP）或從「已存在 countryCode」中選取。

### B. Jobs 列表（UseCasesContentList 模式）
- 欄位建議：
  - ID
  - Image
  - Title
  - Slug（唯讀）
  - CountryCode
  - EmploymentType
  - Updated At
  - Status
  - Actions
- 支援搜尋（title/slug）。
- 支援分頁與每頁筆數切換。

### C. Job 編輯頁
- Create / Edit 共用 editor。
- `slug`：
  - Create：顯示為 `(Auto generated after create)`
  - Edit：顯示唯讀值
- 其他欄位照目前前台需要值提供可編輯表單。

## 5. 驗證規則（schema-driven）
- 沿用專案既有機制：
  - `useFormValidation`
  - `validateSchema` / `validateSchemaField`
  - Page-local schema
- `jobs` 基本規則：
  - `title`: required
  - `countryCode`: required + enum
  - `employmentType`: required
  - `locationLabel`: required
  - `summary`: required
  - `applyEmail`: required + email format
  - `jobDuties`: 至少 1 筆
  - `qualifications`: 至少 1 筆

## 6. 新增元件規格
- `src/components/dialog/RemindDialog.jsx`
- 用途：純提醒（單一確認按鈕）
- Props 建議：
  - `isOpen`
  - `title`
  - `description`
  - `ackLabel = 'OK'`
  - `onAcknowledge`

## 7. 驗收條件
- Careers 管理頁為列表型（風格接近 UseCasesContentList）。
- `slug` 在後台不可編輯。
- 刪除 tab 時，若仍有 job 使用該 `countryCode`，會跳出 `RemindDialog` 並禁止刪除。
- 可正常新增/編輯/封存/還原 jobs。
