# Settings 模組企劃（IDT-25 / RBAC 導向 v1）

## 1. 模組目標

Settings 模組改為「系統治理中心」，不重複 SEO 功能。

核心目標：

1. 個人設定（Profile settings）
2. 角色與權限管理（RBAC）
3. 員工帳號管理（Employees）
4. 系統安全規則（System settings）
5. 審計軌跡（Audit）

## 2. 範圍定義

### In Scope

1. Profile Settings
- 顯示目前登入者資訊
- 修改 display name
- 修改密碼

2. Roles & Permissions
- 角色清單（新增/編輯/停用）
- 權限矩陣設定
- 角色可見頁面與可執行操作（read/write/publish/delete/admin）

3. Employee Management
- 員工清單
- 建立員工帳號
- 指派角色
- 啟用/停用帳號
- 強制重設密碼

4. System Settings（安全規則）
- 密碼政策（最小長度/複雜度/到期天數）
- 登入失敗上限與鎖定時間
- Session timeout

5. Audit Log（至少針對 RBAC/員工/安全規則）
- 記錄誰在何時調整了哪些設定

### Out of Scope（本階段不做）

1. SEO defaults（已由 SEO 模組負責）
2. Backstage 多語系
3. Backstage 時區與通知設定
4. SMTP/Webhook 外部整合

## 3. UI 資訊架構

路由主入口：`/settings`

子分頁建議：

1. `Profile`
2. `Roles & Permissions`
3. `Employees`
4. `Security Policies`
5. `Audit Logs`

## 4. 權限模型建議（關鍵）

採 `resource + action` 模式。

### Resource（MVP）

- `dashboard`
- `pages`
- `content.products`
- `content.collections`
- `content.useCases`
- `content.resources`
- `content.company`
- `seo`
- `settings.profile`
- `settings.rbac`
- `settings.employees`
- `settings.security`

### Action（MVP）

- `read`
- `write`
- `publish`
- `delete`
- `admin`

範例 permission key：

- `seo:read`
- `seo:write`
- `settings.rbac:admin`
- `content.resources:publish`

## 5. 資料模型草案

## 5.1 roles

```json
{
  "id": "role-editor",
  "name": "Editor",
  "description": "Can edit content but cannot manage system settings.",
  "status": "active",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## 5.2 role_permissions

```json
{
  "roleId": "role-editor",
  "resource": "content.resources",
  "action": "write",
  "allowed": true
}
```

## 5.3 employees

```json
{
  "id": "emp-001",
  "email": "editor@idtech.com",
  "displayName": "CMS Editor",
  "status": "active",
  "roleIds": ["role-editor"],
  "lastLoginAt": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## 5.4 security_policies

```json
{
  "passwordMinLength": 12,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumber": true,
  "requireSymbol": true,
  "passwordExpireDays": 90,
  "maxLoginAttempts": 5,
  "lockoutMinutes": 15,
  "sessionTimeoutMinutes": 120
}
```

## 5.5 audit_logs

```json
{
  "id": "audit-xxx",
  "actorId": "emp-001",
  "action": "settings.role.update",
  "targetType": "role",
  "targetId": "role-editor",
  "before": { "...": "..." },
  "after": { "...": "..." },
  "createdAt": "..."
}
```

## 6. API 草案（可直接對接）

1. Profile
- `GET /api/backstage/settings/profile`
- `PUT /api/backstage/settings/profile`
- `PUT /api/backstage/settings/profile/password`

2. Roles
- `GET /api/backstage/settings/roles`
- `POST /api/backstage/settings/roles`
- `PUT /api/backstage/settings/roles/:roleId`
- `PUT /api/backstage/settings/roles/:roleId/permissions`
- `POST /api/backstage/settings/roles/:roleId/archive`
- `POST /api/backstage/settings/roles/:roleId/restore`

3. Employees
- `GET /api/backstage/settings/employees`
- `POST /api/backstage/settings/employees`
- `PUT /api/backstage/settings/employees/:employeeId`
- `PUT /api/backstage/settings/employees/:employeeId/roles`
- `POST /api/backstage/settings/employees/:employeeId/archive`
- `POST /api/backstage/settings/employees/:employeeId/restore`
- `POST /api/backstage/settings/employees/:employeeId/force-reset-password`

4. Security Policies
- `GET /api/backstage/settings/security-policies`
- `PUT /api/backstage/settings/security-policies`

5. Audit
- `GET /api/backstage/settings/audit-logs`

### 6.1 目前實作狀態（2026-02）

為避免與舊草案混淆，以下為目前後端已落地的 Settings API 形態：

1. Aggregated Settings API（已實作）
- `GET /api/backstage/settings`
- `PUT /api/backstage/settings/profile`
- `PUT /api/backstage/settings/profile/password`
- `PUT /api/backstage/settings/roles`
- `PUT /api/backstage/settings/employees`
- `POST /api/backstage/settings/employees/:employeeId/reset-password`
- `PUT /api/backstage/settings/security-policies`
- `GET /api/backstage/settings/audit-logs`

2. Auth API（已實作）
- `POST /api/backstage/auth/login`
- `POST /api/backstage/auth/logout`
- `GET /api/backstage/auth/me`

3. 舊草案中「逐資源 CRUD 端點」（目前未採用）
- 例如 `POST /api/backstage/settings/roles`、`PUT /api/backstage/settings/roles/:roleId`
- 目前實際策略是「以單一 PUT 寫回整個模組資料」，由後端做 schema 驗證與審計紀錄

## 7. 驗證與規則

1. 角色不可刪除「最後一個 admin 角色」。
2. 不可將最後一位 `settings.rbac:admin` 員工停用。
3. email 唯一。
4. 密碼政策不可設置低於最低安全基線（例如長度 < 8）。
5. 所有角色/員工/安全規則異動都寫入 audit。

## 8. 實作分期（建議）

### Phase A（先上線）

1. Profile
2. Roles + Permissions matrix（含 API 權限檢查 middleware）
3. Employees（建立/停用/角色指派）

### Phase B

1. Security Policies
2. Audit Logs 查詢頁

### Phase C

1. UX 強化（批次操作、篩選、匯出）
2. SSO/2FA（若後續需要）

## 9. 目前待你拍板

1. 員工角色是否允許多角色（`roleIds[]`）？
2. 是否先做邀請制（email invite）或先手動建帳？
3. `publish/delete/admin` 是否全部都要，還是先 `read/write/admin`？
4. Audit log 是否需要保留 before/after 完整 JSON（建議保留）？
5. 是否要在 IDT-25 內就把 API 權限 middleware 一起做完（建議做）？

## 10. 後端登入/授權調整（從假登入遷移到正式登入）

目前後台前端是 localStorage mock login。若要讓 RBAC 真正生效，建議後端補以下能力：

1. `employees` 改為 auth source of truth
- 新增欄位：`passwordHash`、`mustResetPassword`、`failedLoginCount`、`lockedUntil`、`lastPasswordChangedAt`
- email 為唯一登入帳號

2. Auth API（MVP）
- `POST /api/backstage/auth/login`
- `POST /api/backstage/auth/logout`
- `GET /api/backstage/auth/me`
- `POST /api/backstage/auth/refresh`（若採 JWT + refresh token）

3. Session/JWT 策略（擇一）
- 方案 A：HttpOnly session cookie（優先建議，前端最簡單）
- 方案 B：access token + refresh token（需多一層 token refresh flow）

4. 權限注入流程
- login 後端依 `employee.roleIds` 聚合 permissions
- 在 request context 寫入：`req.auth = { employeeId, email, permissions }`
- 所有 backstage API 使用 middleware 檢查 `resource:action`

5. 安全規則落地
- `securityPolicies` 套到 login/password change：
- 密碼長度與複雜度
- 失敗次數鎖定（`maxLoginAttempts`, `lockoutMinutes`）
- session timeout
- 強制改密碼（`mustResetPassword`）

## 11. 前端配套調整（Backstage）

1. `AuthProvider` 改為呼叫真實 API，不再比對 hard-coded 帳密
2. `request()` 不再帶 `X-Editor-Id`，改由 cookie/session 或 bearer token 驗證
3. 路由守衛 `RequireAuth` 透過 `GET /api/backstage/auth/me` 判斷登入狀態
4. 設定頁 `Employees` 的「force password reset」需對接後端欄位
5. `Profile Settings` 顯示當前登入者資訊改為來自 `auth/me`

## 12. 推進順序（建議）

1. 先做 Auth API + middleware（不改 UI）
2. 再把 Backstage login 從 mock 換成真實登入
3. 最後啟用 RBAC 對頁面/操作按鈕的前端守衛（hide/disable）

## 13. Profile Settings（已落地）

### 13.1 頁面結構

1. 左側 Identity Card
- Avatar（由 Avatar URL 驅動，載入失敗顯示 fallback）
- Display Name / Email / User ID
- Last sign in
- Account status / reset required
- 角色標籤（唯讀）
- 快捷操作：Change Password（會滾動並 focus 到 Current Password）

2. 右側 Personal Information
- Display Name 可編輯
- Email 唯讀
- Avatar URL 可編輯（含 URL 格式驗證）
- Save Profile 按鈕位於卡片右上

3. 右側 Account Security
- Current Password / New Password
- 眼睛圖示切換顯示密碼
- Update Password 按鈕位於卡片右上（紅底）
- 改密碼成功後，後端使當前帳號所有 session 失效並強制重新登入

4. 右側 Permission Summary（唯讀）
- Total（有效權限格數）
- Read / Write / Archive / Full Access
- 統計採「effective permission」算法（含 `resource:admin` 覆蓋）

5. 右側 My Activity（唯讀）
- 顯示目前登入者行為（以 actorId=email 過濾）
- 使用 Pagination（每頁固定 5 筆）
- 時間格式統一為 `YYYY-MM-DD HH:mm:ss`

### 13.2 主要資料來源

1. `GET /api/backstage/auth/me`
- user, permissions, mustResetPassword, session.expiresAt

2. `GET /api/backstage/settings`
- profile / employees / roles / securityPolicies

3. `GET /api/backstage/settings/audit-logs`
- 前端依登入者 email 過濾為 My Activity

### 13.3 已接入活動類型

1. `settings.auth.login.success`
2. `settings.auth.login.failed`
3. `settings.profile.password.change`
4. `pages.home.update`
5. `backstage.*`（後台寫入事件）

## 14. Roles & Permissions（已落地）

### 14.1 UI 與互動

1. 左側 Role 列表
- 新增角色
- 選取角色
- 每個角色提供 Radar Chart icon（點擊開啟角色權限雷達圖）

2. 右側 Role 編輯
- 角色名稱 / 描述 / 狀態（active / archived）
- 權限矩陣：
- action：Read / Write / Archive
- Full Access（對應 `resource:admin`）
- 啟用 Full Access 時，該列 action checkbox 會 disable

3. Radar Dialog
- 使用 `recharts`
- 顯示各 group 的權限覆蓋率（Core / Content / Publishing / Settings）
- 評分維度：Read + Write + Archive + Full Access

### 14.2 資源定義（目前版本）

1. `pages`
2. `content.products`
3. `content.collections`
4. `content.useCases`
5. `content.resources`
6. `content.company`
7. `seo`
8. `settings.profile`
9. `settings.rbac`
10. `settings.employees`
11. `settings.security`
12. `settings.audit`

### 14.3 後端 enforcement（已啟用）

後端已對 `/api/backstage` 寫入與讀取路徑做權限驗證映射：

1. `/pages*`、`/banner-hub*` -> `pages:*`
2. `/content/products*` -> `content.products:*`
3. `/content/collections*` -> `content.collections:*`
4. `/content/use-cases*` -> `content.useCases:*`
5. `/content/resources*` -> `content.resources:*`
6. `/content/company*` -> `content.company:*`
7. `/seo*` -> `seo:*`
8. `archive/restore` 行為 -> `*:delete`（UI 文案顯示為 Archive）

### 14.4 保底規則

1. 不可讓系統失去最後一個 `settings.rbac:admin` 角色
2. 不可讓系統失去最後一位具 `settings.rbac:admin` 的 active 員工

## 15. Settings Manager 重構落地（已完成）

本次針對 `SettingsManagerPage.jsx` 進行「不改 API、只改前端結構與 UI」的落地重構。

### 15.1 重構目標

1. 降低單檔過長造成的維護風險
2. 讓 Profile / Roles / Employees / Security / Audit 可獨立維護
3. 保留既有 API 與行為，不引入後端變更風險

### 15.2 組件拆分結果

原本單一頁面承載所有子頁內容，現已拆為 section 元件：

1. `src/components/pages/settings/sections/SettingsProfileSection.jsx`
2. `src/components/pages/settings/sections/SettingsRolesSection.jsx`
3. `src/components/pages/settings/sections/SettingsEmployeesSection.jsx`
4. `src/components/pages/settings/sections/SettingsSecuritySection.jsx`
5. `src/components/pages/settings/sections/SettingsAuditSection.jsx`

容器頁 `src/components/pages/settings/SettingsManagerPage.jsx` 現在主要負責：

1. 資料載入與保存流程（load/save）
2. 共用狀態管理（status/message/dialog）
3. 路由 section 切換與 props 傳遞

### 15.3 Security UI 新樣式（已落地）

1. Security 區塊改為 Password Policy 視覺
2. 輸入欄位改為浮動標籤（floating label）互動
3. 保留既有 Update API，新增前端 Reset 與 Reset To Default 互動
4. `Reset` 回到最近一次載入/儲存值；`Reset To Default` 回前端預設值

### 15.4 通用元件化（已落地）

新增共用輸入組件：

1. `src/components/common/FloatingLabelInput.jsx`

目前已先套用於 Security Policy 的數字欄位，後續其他頁可直接 import 重用，達成視覺與互動一致。

### 15.5 兼容性與驗證策略

1. 每個 section 拆分後立即進行 build 驗證
2. 重構期間不調整 API payload 與後端契約
3. 以「逐段拆分、逐段驗證」確保不破壞既有功能
