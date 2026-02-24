# Submissions 訊息中心企劃（已落地 v1）

## 1. 目標

`Messages` 模組的定位是「集中審查前台三個表單提交」，不做內容編輯，只做流程管理。

來源範圍：

1. `LeadFormSection.jsx`（lead）
2. `ContactFormSection.jsx`（contact）
3. `CareerDetailApplyCard.jsx`（career）

v1 功能邊界：

1. 列表查詢
2. 詳細檢視（lead/contact）
3. 狀態流轉（new/resolved/archived）
4. Career 履歷下載

## 2. 導航與資訊架構（IA）

### 2.1 Primary Sidebar

1. 新增 `Messages`（信件 icon）主選單，路由入口：`/submissions/lead/new`
2. 有未處理訊息（`status=new`）時，在 icon 右上顯示小紅點（無邊框）
3. 小紅點資料來源：每 20 秒輪詢一次 `GET /api/backstage/submissions?status=new&page=1&pageSize=1`

### 2.2 Secondary Sidebar

使用 `Message Center` 二層選單，採固定三組，不折疊：

1. `Connect Types`
   - `Pending` -> `/submissions/lead/new`
   - `Completed` -> `/submissions/lead/resolved`
   - `Archived` -> `/submissions/lead/archived`
2. `Contact Types`
   - `Pending` -> `/submissions/contact/new`
   - `Completed` -> `/submissions/contact/resolved`
   - `Archived` -> `/submissions/contact/archived`
3. `Career Types`
   - `Pending` -> `/submissions/career/new`
   - `Completed` -> `/submissions/career/resolved`
   - `Archived` -> `/submissions/career/archived`

## 3. 路由與頁面組成

1. `/submissions` 會 redirect 到 `/submissions/lead/new`
2. 主頁路由：`/submissions/:source/:status`
3. 合法參數：
   - `source`: `lead | contact | career`
   - `status`: `new | resolved | archived`
4. 非法參數自動導回 `/submissions/lead/new`

## 4. 使用 API（Backstage BFF）

1. `GET /api/backstage/submissions`
2. `GET /api/backstage/submissions/:submissionId`
3. `PUT /api/backstage/submissions/:submissionId/status`
4. `POST /api/backstage/submissions/:submissionId/archive`
5. `POST /api/backstage/submissions/:submissionId/restore`
6. `GET /api/backstage/submissions/:submissionId/resume`（career）

列表查詢參數：

1. `source`
2. `status`
3. `keyword`
4. `dateFrom`
5. `dateTo`
6. `page`
7. `pageSize`

## 5. 列表 UI 設計（已落地）

欄位：

1. `ID`（前端序號，不使用 DB id）
2. `Submitted At`
3. `Name`
4. `Email`
5. `Phone`
6. `Job`
7. `Region`
8. `Actions`

行為規則：

1. `ID` 使用跨頁連號：`(page - 1) * pageSize + index + 1`
2. `Submitted At` 強制單行顯示（不換行）
3. 所有表格欄位內容做垂直置中
4. 空值顯示 `--`

`Job/Region` 預覽規則：

1. `career` 優先取 `jobTitle/job/position/role/title/jobSlug`，若都沒有則嘗試從 message 解析
2. `lead` 的 job 欄位用 `company/industry`
3. `contact` 的 job 欄位用 `subject/product/company`
4. region 走 `region/location/country`

`Actions` 規則（icon + tooltip）：

1. 只有 `Archive` 使用紅色風格，其餘維持中性顏色
2. `new`：
   - `Mark Completed`
   - `Archive`
3. `resolved`：
   - `Move to Pending`
   - `Archive`
4. `archived`：
   - `Restore`
5. `career` 列表不顯示 `View Details`
6. `career` 若有履歷，顯示 `Download Resume`

## 6. 詳細檢視 Drawer（lead/contact）

設計方向：

1. 右側滑入 Drawer，開關動畫沿用 Home drawer 互動語意
2. 內容採唯讀表單樣式（不用 table 呈現）
3. 不允許修改提交內容

內容區塊：

1. 基本欄位（ID/Submitted At/Source/Status/Name/Email/Phone）
2. Message
   - 固定高度容器
   - 段落間距放大（提升可讀性）
   - 超長內容啟用 Y 軸捲動
3. Additional Fields（payload）
4. Audit Trail（最多顯示最近 50 筆）

安全遮罩：

1. payload 會排除敏感鍵：`captchaToken`, `gRecaptchaToken`, `recaptchaToken`, `website`

## 7. Career 履歷下載落地

1. Career 列表顯示下載 icon，點擊呼叫 `/api/backstage/submissions/:id/resume`
2. 後端會回傳 attachment，並保留上傳時檔名（含 UTF-8 中文）
3. 下載動作會寫入 submission audit log（`submission.resume.downloaded`）

## 8. 狀態流與資料治理

1. 狀態流：`new -> resolved -> archived`
2. 可從 `resolved` 回退到 `new`
3. `archived` 可 `restore` 回 `new`
4. 不提供 hard delete（沿用 soft delete / archive 策略）

## 9. 目前未納入（下一期）

1. Dashboard `Recent 5 Actions` 下方的未處理訊息卡片
2. Dashboard 在線狀態點位（有未處理訊息時綠轉紅）
3. 訊息批次操作（bulk actions）
4. 履歷預覽（目前僅下載）
