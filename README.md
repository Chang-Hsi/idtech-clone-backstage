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
