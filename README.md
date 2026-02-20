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

## Next Action

Start M1 implementation:

1. Auth route skeleton
2. Protected layout
3. Dashboard + pages list placeholders
