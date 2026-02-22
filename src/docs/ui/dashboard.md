# Dashboard 企劃書（idtech-clone-backstage）

## 1. 目標

Dashboard 是後台登入後第一個決策頁，快速回答三件事：

1. 內容健康度：各內容模組量體、封存狀態、近期品質訊號。
2. 組織分布：員工地區與職務分佈是否符合營運預期。
3. 個人操作上下文：我是誰、有哪些權限、剛做過什麼。

## 2. 版面定案（左 70% / 右 30%）

## 2.1 左區（指標 / 資料 / Recharts）

1. KPI Row（全域）
   - Total Managed Content（Products + Collections + Use Cases + Resources + Company Cards + Careers Jobs）
   - Archived Items（跨模組 archived 總數）
   - SEO Targets（可管理 SEO target 總數）
   - Employees（員工總數）
2. Testing Health（Vitest）
   - Backend Coverage / Backstage Coverage / Pass Rate 三張 KPI
   - Testing Trend 折線圖（Recharts）
   - 保留 Trigger Refresh 按鈕（沿用現有機制）
3. 職務與地區分佈（世界地圖）
   - 世界地圖顯示各國員工數（bubble/marker）
   - 點選國家顯示該國職務分布
4. KPI 對應 Charts
   - Content Mix（各模組數量，BarChart）
   - Content Status（active vs archived，PieChart）

## 2.2 右區（登入者資訊）

1. 個人資訊卡
   - Avatar / Display Name / Email / Session Expires
   - CTA：`Go to Profile`（導向 `/settings/profile`）
2. 權限雷達圖
   - 以 permission group 聚合成雷達圖（Content / SEO / Profile / RBAC / Employees / Security / Audit）
3. 最近五筆操作紀錄
   - 取該登入者在 audit logs 的最新 5 筆
   - 顯示 action / target / time

## 3. 資料來源（Phase A：不改後端）

採前端聚合既有 API：

1. `GET /api/backstage/dashboard/testing-health`
2. `GET /api/backstage/content/products?status=all`
3. `GET /api/backstage/content/collections?status=all`
4. `GET /api/backstage/content/use-cases?status=all`
5. `GET /api/backstage/content/resources?status=all`
6. `GET /api/backstage/content/company/cards?status=all`
7. `GET /api/backstage/content/company/careers`
8. `GET /api/backstage/settings`
9. `GET /api/backstage/settings/audit-logs`
10. `GET /api/backstage/seo/targets`

## 4. 元件拆分定案

## 4.1 Page 拼接層

1. `src/pages/DashboardPageManager.jsx`
   - 只負責：
     - 呼叫 `useDashboardData`
     - 拼接左右區塊
     - 顯示 status/error/success

## 4.2 Components 層（全部放 `src/components/pages/dashboard`）

1. `DashboardHeader.jsx`
2. `DashboardKpiRow.jsx`
3. `DashboardTestingHealthPanel.jsx`
4. `DashboardGeoDistributionPanel.jsx`
5. `DashboardContentChartsPanel.jsx`
6. `DashboardUserPanel.jsx`

## 4.3 資料整合 Hook

1. `src/components/pages/dashboard/useDashboardData.js`
   - 並行呼叫 API
   - 轉換 KPI / chart / map / right-panel 所需資料
   - 提供 refresh 與 testing trigger action

## 5. 套件決策

地圖採用 `@nivo/geo`。

原因：

1. 與 React 19 相容（`react-simple-maps` 在此版本有 peer 衝突）。
2. 與既有 Recharts 共存容易，且 dashboard 圖表風格一致。

## 6. 驗收標準

1. `/dashboard` 左右分欄完成，768px 以上不破版，手機版垂直堆疊。
2. `DashboardPageManager.jsx` 無商業邏輯，只做拼接。
3. 各區塊元件皆位於 `components/pages/dashboard`。
4. Testing Health（既有功能）可正常讀取與觸發 refresh。
5. 世界地圖可顯示地區 marker，且可查看該地區職務分佈。
6. 右區可顯示登入者資訊、權限雷達與最近五筆操作。

## 7. 後續（Phase B）

若後續要減少前端多支 API 並發，可新增聚合端點：

1. `GET /api/backstage/dashboard/summary`
2. `GET /api/backstage/dashboard/employee-distribution`
3. `GET /api/backstage/dashboard/activity`

本期先不上這些新端點，維持前端聚合策略。
