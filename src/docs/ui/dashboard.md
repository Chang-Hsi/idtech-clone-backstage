# Dashboard 企劃書（idtech-clone-backstage）

## 1. 目標

Dashboard 是後台登入後第一個決策頁，目的不是「編輯內容」，而是快速回答：

1. 目前站點內容是否健康（內容數量、草稿狀態）
2. 是否有待處理事項（近期變更、送審、失敗任務）
3. SEO 與營運是否正常（索引狀態、關鍵頁面狀態）

## 2. 頁面定位

Dashboard 定位為「總覽與入口」：

1. 顯示高價值摘要指標（KPI）
2. 顯示近期活動與警示
3. 提供一鍵跳轉到對應管理頁

不在 Dashboard 內做深度編輯，深度編輯仍在各內容模組頁進行。

## 3. MVP 範圍（第一版）

第一版先做「靜態結構 + 可接 API 的資料模型」，分成 5 個區塊：

1. 頂部歡迎區（標題、當前時間、快速操作）
2. KPI Cards（4~6 張）
3. Recent Activity（最近更新清單）
4. Draft / Review Queue（待處理清單）
5. SEO Snapshot（首頁與核心頁面摘要）

## 4. 資訊架構

## 4.1 頂部區塊（Header Strip）

建議內容：

1. `Welcome back, {name}`
2. 今日日期與時區
3. 快速操作按鈕：
   - New Page
   - New Article
   - Open SEO Manager

## 4.2 KPI Cards

建議指標（MVP）：

1. Total Pages
2. Published Content
3. Draft Content
4. Last 7 Days Updates
5. SEO Issues（可選）

每張卡可點擊跳轉對應模組，例如草稿卡跳去 `pages/content/resources?status=draft`。

## 4.3 Recent Activity

顯示最近 10 筆活動：

1. 使用者名稱
2. 動作（create/update/publish/unpublish）
3. 目標內容
4. 時間

## 4.4 Draft / Review Queue

顯示待處理項目：

1. 標題
2. 類型（Page / Article / Product）
3. 最後編輯時間
4. 指派者（若無先顯示 `Unassigned`）

## 4.5 SEO Snapshot

顯示核心頁面 SEO 狀態（MVP 先 3~5 個頁面）：

1. Home
2. Products
3. Resources
4. Company
5. Contact

每列欄位可含：

1. Meta Title（是否存在）
2. Meta Description（是否存在）
3. Canonical（是否存在）
4. Indexable（yes/no）

## 5. 資料來源規劃

MVP 先支援兩階段：

1. Phase A：前端 mock data（先把 UI/互動完成）
2. Phase B：改接 API（保留欄位一致）

建議 API（未來）：

1. `GET /api/backstage/dashboard/summary`
2. `GET /api/backstage/dashboard/activity`
3. `GET /api/backstage/dashboard/queue`
4. `GET /api/backstage/dashboard/seo-snapshot`

## 6. 元件拆分建議

頁面組裝：

1. `DashboardPage.jsx`（只負責拼接）

元件層：

1. `DashboardHeader.jsx`
2. `DashboardKpiGrid.jsx`
3. `DashboardActivityPanel.jsx`
4. `DashboardQueuePanel.jsx`
5. `DashboardSeoSnapshotPanel.jsx`

資料層：

1. `src/data/dashboard/dashboardMock.js`（Phase A）
2. `src/services/dashboardApi.js`（Phase B）

## 7. 404 頁與 Dashboard 開發順序

建議順序：

1. 先做 Dashboard（因為是主流程入口）
2. 再補 404（半天內可完成）

原因：

1. Dashboard 能立刻驗證整個 AppLayout 的資訊密度與可用性
2. 404 屬於必要但低風險收尾項，放第二步不會阻塞主流程

## 8. 驗收標準（MVP）

1. 進入 `/dashboard` 可看到完整 5 區塊
2. 所有卡片/項目可點擊並導向合理路由
3. 在 1280px、1024px、768px 下不破版
4. 深色主 Sidebar + 淺色內容區視覺一致
5. 先用 mock data，後續可無痛替換 API

## 9. 開工清單

1. 建立 `DashboardPage.jsx` 與對應元件骨架
2. 建立 dashboard mock data
3. 完成版面與 responsive
4. 接入 router（確認 `/dashboard` 為登入後主入口）
5. 補 `NotFoundPage` 並改 wildcard route

## 10. Testing Health 儀表板（Vitest Coverage）

為了讓 Dashboard 更貼近工程品質監控，本期新增「Testing Health」區塊（Recharts）。

### 10.1 顯示目標

1. Backend Coverage %
2. Backstage Coverage %
3. 最近一次測試通過率（Pass Rate）
4. 趨勢（up/down/flat）

### 10.2 UI 呈現策略

1. KPI Cards：三張核心指標卡，含百分比與趨勢箭頭
2. Recharts LineChart：同圖呈現三條趨勢線
   - Backend Coverage
   - Backstage Coverage
   - Pass Rate
3. 無資料狀態：顯示「尚未從 CI 匯入 metrics」提示

### 10.3 API 與資料流

Dashboard 僅讀取 API，不直接執行測試：

1. CI 跑 Vitest coverage，整理數值後上報後端
2. 後端儲存歷史快照
3. 後台 Dashboard 呼叫 `GET /api/backstage/dashboard/testing-health` 顯示

### 10.4 後端端點規劃

讀取（給後台）：

1. `GET /api/backstage/dashboard/testing-health`

CI 上報（給 pipeline）：

1. `PUT /api/internal/dashboard/testing-health`
2. 驗證：`Authorization: Bearer <DASHBOARD_METRICS_INGEST_TOKEN>` 或 `X-Metrics-Token`

### 10.5 payload（CI -> API）建議格式

```json
{
  "source": "github-actions",
  "branch": "main",
  "commitSha": "abc1234",
  "runId": "1234567890",
  "runUrl": "https://github.com/...",
  "recordedAt": "2026-02-22T10:00:00.000Z",
  "backend": { "lines": 88.5, "functions": 86.2, "branches": 72.4, "statements": 88.1 },
  "backstage": { "lines": 82.3, "functions": 80.1, "branches": 69.8, "statements": 82.0 },
  "passRate": 100
}
```

### 10.6 驗收標準（Testing Health）

1. `/dashboard` 可顯示 3 張 KPI 卡與趨勢圖
2. API 有資料時可正確渲染；無資料時不破版
3. Trend 會依最近一次與前一次快照比較顯示 up/down/flat
4. Backend / Backstage Vitest 皆可通過
