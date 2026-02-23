# idtech-clone-backstage

`idtech-clone-backstage` is the CMS/admin console for `idtech-clone`.

## Project Goal

- Manage frontend content from a backstage UI instead of editing raw source files.
- Manage SEO fields in the same workflow.
- Keep data synced with `idtech-clone-api`.

## Product Direction

This project will be delivered in phases.

- Phase 1: CMS MVP (minimum viable product)
- Phase 2: workflow and permission hardening
- Phase 3: advanced editorial capabilities

## MVP Scope (Phase 1)

### In Scope

- Admin login (single admin account)
- Dashboard page
- Page list (load from API)
- Page editor
- SEO editor fields:
  - `title`
  - `description`
  - `canonicalPath`
  - `ogImageUrl`
  - `robots`
  - `type`
- Save/Publish action (direct update for MVP)

### Out of Scope

- Multi-role RBAC
- Media library
- Version history / content approval flow
- Multi-language CMS UX

## Milestones

### M1: Foundation

- Router + layout + auth skeleton
- Shared API client
- Global error/status handling baseline

### M2: Content Read

- Page list from backend API
- Detail page load and basic preview

### M3: Content Write

- Editor form
- Save to backend API
- Validation and error handling

### M4: SEO Management

- SEO form section in editor
- Field validation + API save

### M5: Hardening

- Access guard on routes
- Better UX states (loading/empty/error)
- Test baseline for key flows

## Proposed Project Structure

```txt
src/
  app/
    store.js

  routes/
    router.jsx

  layout/
    AppShell.jsx

  pages/
    DashboardPage.jsx
    LoginPage.jsx
    PagesListPage.jsx
    PageEditorPage.jsx

  features/
    auth/
    pages/
    seo/

  api/
    request.js
    backstageApi.js

  components/
    common/
    forms/

  styles/
```

## Backend Integration Plan

Primary backend: `idtech-clone-api`

Initial endpoints (planned):

- `POST /api/admin/login`
- `GET /api/admin/pages`
- `GET /api/admin/pages/:pageKey`
- `PUT /api/admin/pages/:pageKey`

> Exact API contract will be finalized before implementation starts.

## Engineering Rules

- Keep frontend architecture consistent with `idtech-clone`.
- Keep dependencies version-aligned with `idtech-clone` when possible.
- Prioritize stable, testable flows before adding extra features.

## Form Validation Mechanism

This project now uses a schema-driven validation system (Element Plus style UX with React implementation).

### Layered design

- `src/utils/formValidation.js`
  - Pure predicate helpers (`isRequired`, `isEmail`, `isPhoneLoose`, `isUrlLike`, etc.)
- `src/utils/validation/rules.js`
  - Reusable rule factories with messages (`requiredRule`, `emailRule`, `enumRule`, `customRule`, etc.)
- `src/utils/validation/engine.js`
  - Schema execution engine (`validateSchema`, `validateSchemaField`, path-based value access)
- `src/hooks/useFormValidation.js`
  - UI state handling (`touched`, `errors`, `validateField`, `validateMany`, `clearAll`)
- `src/components/common/FormField.jsx`
  - Shared field wrapper: required star (`*`) + inline error text
- Page-local schema file (example):
  - `src/components/pages/contact/ContactPageEditor.schema.js`
  - Keeps page-specific rules and error messages near the page itself

### UX behavior

- Required fields show a red `*`.
- Field-level validation starts after focus/blur (`touched`).
- Save action runs full schema validation and renders an error summary.
- Cross-field or list-level rules are supported via `customRule` in schema.

### How to add validation for a new page

1. Create a page schema file near the page (e.g. `ProductEditorPage.schema.js`).
2. Define each field as `{ name, valuePath?, rules: [...] }`.
3. Import `validateSchemaField` for blur validation and `validateSchema` for save validation.
4. Reuse `FormField` and `useFormValidation` for consistent UI behavior.

### Notes

- Keep common/primitive checks in `formValidation.js`.
- Keep reusable message-aware rules in `rules.js`.
- Keep page business constraints (especially cross-field) in page schema.
- Frontend validation improves UX; backend validation remains mandatory.

## Next Action

Start M1 implementation:

1. Auth route skeleton
2. Protected layout
3. Dashboard + pages list placeholders

## Vitest Plan (Backstage): Payload Normalizer Tests

Goal: prevent frontend-backend contract mismatch before save APIs are called.

### Scope for this phase

- Add `Vitest` runner scripts for backstage unit tests.
- Focus only on frontend payload normalization logic (pure functions).
- Do not test UI rendering in this phase.

### Why this matters

- Backend validates request body strictly (`zod` on API side).
- Frontend often has draft/form states with `null`, empty strings, mixed types.
- A stable normalizer layer guarantees API payload shape before `request()`.

### Test targets

1. Settings employees payload normalizer

- Normalize `id/email/displayName/avatarUrl` to trimmed strings.
- Normalize `status` to `active|archived`.
- Normalize `roleIds` to string array without empty items.
- Convert `forcePasswordReset` to boolean.
- Remove `lastLoginAt` when it is `null/empty`; keep only non-empty string.

2. Careers payload normalizer/update payload builder

- `normalizeCareersPayload`:
  - ensure `tabs` includes `all` fallback
  - normalize tab key to lowercase
  - normalize job fields to trimmed strings
  - convert legacy arrays (`jobDuties`, `qualifications`) to markdown list
- `buildCareersUpdatePayload`:
  - generate API write payload with trimmed markdown fields
  - keep only backend-supported fields

### File plan

- `src/utils/payloadNormalizers.js` (new)
  - shared pure normalizers for API writes
- `src/components/pages/company/careers/careersFormUtils.js` (existing)
  - keep as careers normalizer source
- `test/utils/payloadNormalizers.test.js` (new)
- `test/components/pages/company/careers/careersFormUtils.test.js` (new)

### Definition of Done

- `npm run test` passes in `idtech-clone-backstage`.
- Critical normalizer rules above are covered by unit tests.
- Settings employee save flow uses shared normalizer utility (not inline per-page duplicate logic).

## Vitest Plan (Backstage): All Write API Contract Tests

Goal: ensure every frontend write API helper sends the correct request contract.

### Scope for this phase

- Cover all `POST/PUT` helpers under `src/api/*`.
- Assert request path, HTTP method, and serialized request body.
- Validate helper-level payload shaping where helper intentionally selects fields.

### Test strategy

1. Single mocked request layer

- Mock `request` from `src/lib/request`.
- Treat each API helper as a contract function that maps input to transport payload.

2. Contract assertions per helper

- Correct endpoint path.
- Correct HTTP method.
- Correct JSON payload shape.
- Important default behavior (example: reset-password with empty payload object).

3. Risk-oriented focus

- Include settings/auth/SEO plus all content and page write routes.
- Catch regressions when endpoint path or payload keys change during refactors.

### File plan

- `test/api/*.writeApi.test.js`
  - one test file per API module
  - examples:
    - `test/api/settings.writeApi.test.js`
    - `test/api/seo.writeApi.test.js`
    - `test/api/contentProducts.writeApi.test.js`

### Definition of Done

- All write helpers in `src/api` have at least one contract assertion.
- `npm run test` passes locally.
- Existing payload normalizer tests continue to pass.

## Vitest + Shared Contract (Implemented POC)

Goal: move high-risk write payload validation to a single contract source shared by backend and backstage.

### Current implementation scope

- Shared package: `@chang-hsi/idtech-shared-contracts` (GitHub Packages)
- Shared schemas currently applied:
  - `settingsEmployeeSchema`
  - `settingsEmployeesWriteSchema`
- Backstage integration:
  - `src/utils/payloadNormalizers.js`
  - `buildSettingsEmployeesWritePayload()` validates with shared zod schema before API call

### Why this improves Vitest strategy

- Payload normalizer tests now verify against the same schema used by backend.
- Contract mismatch risk (`null`/type drift) is caught before request send.
- Backend keeps route-level integration tests; backstage keeps transport/normalizer unit tests.

### CI requirement for package install

- `.npmrc` uses scoped registry:
  - `@chang-hsi:registry=https://npm.pkg.github.com`
- CI must provide auth token for GitHub Packages (read package):
  - set `NODE_AUTH_TOKEN` (or run npm config for `//npm.pkg.github.com/:_authToken`)

## SEO Score Records Page（已落地）

### 建置目的

- 將前台 Lighthouse CI 的結果在後台可視化。
- 讓性能/SEO 不是一次性檢查，而是可持續監控。

### 資訊架構

入口：
- `AppSeoSidebar.jsx` 新增 `Score Records` 導航
- 路由：`/seo/score-records`

頁面：
1. 上區塊：分數卡片（Performance、LCP、CLS、FID-like 等）
2. 中區塊：Recharts 趨勢圖（按時間）
3. 下區塊：紀錄表格（來源、分支、commit、run 連結、時間）

### 資料來源

- API：`GET /api/backstage/seo/score-records`
- 前端 API module：`src/api/backstageSeoApi.js`
- 頁面管理器：`src/pages/seo/SeoScoreRecordsPageManager.jsx`
- 視覺元件：`src/components/pages/seo/SeoScoreRecordsPage.jsx`

### 設計原則

- 以「可追蹤」優先：同時提供 summary、trend、raw records。
- 卡片與圖表使用同一批 API 資料，避免數字不一致。
- 保留 run 連結，方便追到 GitHub Actions 原始執行紀錄。
