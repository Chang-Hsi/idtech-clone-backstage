# Dashboard Plan

## Lighthouse Snapshot Strategy

### Goal
- Show Lighthouse quality trend directly in Dashboard without operational controls.
- Keep `/score-records` as the operational/detail page.

### Scope
- Add a new Dashboard card section under Testing Health:
  - Four KPI cards: `Performance`, `LCP`, `CLS`, `FID-like`
  - Trend chart (same metric family as Score Records)
  - Clickable card that routes to `/score-records`
- Do not add `Run CI` trigger button in Dashboard.

### Data Source
- Extend `GET /api/backstage/dashboard/summary` response with:
  - `lighthouse.summary`
  - `lighthouse.history`
  - `lighthouse.repository`
  - `lighthouse.to` (link target)
- Source records from `LighthouseScoreRecord` in backend DB.

### UX Rules
- Dashboard only displays saved DB results.
- If no Lighthouse records exist, render a friendly empty state:
  - `No lighthouse records yet.`
- Card click jumps to `/score-records` for full drill-down and CI run operations.

### Environment/Runner Notes
- Local route uses self-hosted runner only when backend callback is localhost.
- Production route uses GitHub-hosted runner with Render callback.
- Runner indicator remains in `/score-records` (dev-only), not in Dashboard.

