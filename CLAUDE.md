# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Technical debt and audit tasks** — see [`TECHDEBT.md`](./TECHDEBT.md).

## Git Workflow

At the start of each session, unless a specific branch is already specified, create a new branch from the current local `main`.

### Branch naming
- New feature or general task: `feat/YYYYMMDD-<slug>`
- Bug fix: `fix/YYYYMMDD-<slug>`

`<slug>` — 2-4 words in kebab-case, derived from the task description. English only.

Examples: `feat/20260412-user-auth-flow`, `fix/20260412-null-pointer-login`

### Procedure
```bash
git checkout main
git checkout -b <branch-name>
```

If the branch name already exists, generate a different slug — do not add numeric suffixes like `-2`.

### Constraints
- No `git fetch`, no `git pull` — repository state is managed manually
- Ask before commit and push
- If no branch has been created yet in the session and a task begins, create the branch before making any changes

## Commands

```bash
npm run dev       # Dev server with HMR
npm run build     # Type-check (tsc -b) then Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test runner is configured.

## Environment

Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Architecture

**Overseer** is a PWA day planner built with React 19 + TypeScript + Vite, backed by Supabase (PostgreSQL).

### Supabase client

`src/lib/supabase.ts` initializes the client with `schema: 'overseer'` — all table queries hit the `overseer` schema automatically. Schema definition is in `supabase/schema.sql`.

### Data model

| Table | Purpose |
|---|---|
| `tasks` | Global reusable task definitions (title, duration, icon) |
| `task_descriptions` | 1-to-1 extended content per task (lazy-created) |
| `templates` | Named day presets |
| `template_items` | Ordered tasks/separators in a template; columns: type, block, position, task_id (nullable), separator_label |
| `day_plans` | Denormalized daily schedule per date; `items` is JSONB array |

`day_plans.items` JSONB shape — each element is either:
- Task: `{id, type:'task', task_id?, title, duration?, icon?, block, time?, checked, position}`
- Separator: `{id, type:'separator', label, block}`

`task_id` in a day plan item is nullable — `null` means a one-off task created only for that day, not backed by `tasks` table.

`block` values everywhere: `'morning' | 'day' | 'evening'`

### Navigation model

`App.tsx` holds a `Screen` union (`'today' | 'new-day' | 'pool' | 'history' | 'stat' | 'settings'`) and renders one top-level screen at a time. `BottomNav` uses a narrower union `'today' | 'pool' | 'stat' | 'history'` — nav is hidden on `'new-day'` and `'settings'`. Screens manage their own sub-navigation internally via local state:

- **TodayScreen** — accepts optional `date?: string` (defaults to today), `onBack?: () => void`, `onNewDay?: () => void`. Thin wrapper around `<DayView>`.
- **TaskPoolScreen** — tab-based: **Tasks** tab (search + inline-edit task list) | **Templates** tab (accordion list). Expanding a template mounts `ExpandedTemplate` which calls `useTemplateItems(templateId)` lazily. Adding a task to a template block opens a bottom-sheet picker (`position: fixed` overlay). `TaskDescriptionScreen` renders in place when `descTask !== null`. No `TemplateEditScreen` — template editing is handled inline within the tab.
- **HistoryScreen** — renders `TodayScreen` (with `date` + `onBack` props) in place when `viewingDate !== null`.
- **StatScreen** — placeholder screen with "MODULE OFFLINE" state; has a SETTINGS button → navigates to `'settings'`.
- **SettingsScreen** — CRT display toggles; `onBack` returns to `'stat'`.

**Adding a new top-level screen** requires four changes: new hook + component under `src/components/<name>/`, CSS section in `src/index.css`, import + render in `App.tsx`, and adding the id to `NAV_ITEMS` in `BottomNav.tsx` (also update the `Screen` type).

**BottomNav** has 4 items: PLAN (`today`) | POOL (`pool`) | STAT (`stat`) | HIST (`history`). The active item receives `phosphor-glow` class in addition to `active`.

### Authentication

The app uses cookie-based auth managed by Netlify Edge Functions, replacing the browser Basic Auth dialog.

**Edge functions** (`netlify/edge-functions/`):
- `auth.ts` — intercepts all `/*` requests. Checks `overseer_session` cookie (base64 `user:pass`) against `AUTH_USERNAME`/`AUTH_PASSWORD` env vars. Falls back to `Authorization: Basic` header for backward compat. Unauthenticated requests redirect `302 /`. `PUBLIC_PATHS` regex allows `/`, `/index.html`, `/assets/*`, `/api/login`, and static assets to pass without auth so the React SPA always bootstraps.
- `login.ts` — handles `POST /api/login` with `{username, password}`. On success sets two cookies: `overseer_session` (HttpOnly, 7 days) and `overseer_ui=1` (non-HttpOnly — readable by React).

**React side** (`App.tsx`):
```typescript
function isAuthenticated(): boolean {
  if (import.meta.env.DEV) return true   // auth bypass in dev
  return document.cookie.includes('overseer_ui=1')
}
```
If `!isAuthenticated()`, renders `<LoginScreen onLogin={() => { setAuthed(true); window.location.reload() }} />` instead of the app. On successful login the page reloads so the edge function sees the new cookie on all subsequent requests.

**Critical invariant** — `PUBLIC_PATHS` in `auth.ts` must include the empty alternation `(|...)` to match bare `/`, otherwise unauthenticated requests to `/` redirect to `/` creating an infinite loop.

### CRT effects / AppRoot

`src/components/ui/AppRoot.tsx` wraps the entire app with Pip-Boy terminal visual effects:
- **Scanlines** — CSS `repeating-linear-gradient` 2px-pitch overlay, controlled by `settings.scanlines`
- **Interlace** — green-tinted line overlay, controlled by `settings.interlace`
- **Bloom** — SVG `feGaussianBlur + feBlend mode=screen` filter, controlled by `settings.bloom`
- **Phosphor smear** — `filter: blur(0.45px)` on the container, controlled by `settings.smear`
- **Glass reflection** — diagonal gradient overlay, controlled by `settings.reflection`
- **Vignette** — always-on `::after` radial-gradient (dark edges)
- **Rolling bar** — `RollingBar` React component, fires on random 9–28s interval, CSS `@keyframes rolling-bar` defined in `index.html`; controlled by `settings.rollingBar`

All settings persist in localStorage via `useDisplaySettings` hook. Three settings inject `<style>` tags dynamically:
- **Phosphor glow** — `<style id="phosphor-style">` defines `.phosphor-glow { text-shadow: ... }`. Applied to active nav items and the `OVERSEER` wordmark.
- **Pip-Boy icons** — `<style id="pip-emoji-style">` defines `.pip-emoji { filter: saturate(0) ... }`. When disabled, `.pip-emoji` renders as raw emoji.

`AppContainer` (inline in `App.tsx`) adds bezel corner marks (┌ ┐ └ ┘), permanent left/right borders, and optional **curvature** (`settings.curvature`): `border-radius: 10px` + 4 inset `box-shadow` sides + glass sheen overlay div.

**Boot screen** — pure JS animation in `index.html` runs before React mounts: `#boot` div overlays `#root`, displays sequential terminal lines (RobCo Industries → OVERSEER → checking... → ready █), fades out at 2000ms, removed from DOM at 2420ms.

### Hooks

Each hook owns its slice of state and exposes optimistic-update mutations:

- `useDayPlanByDate(date)` — plan for any date + `taskDescIds: Set<string>`; mutations: `toggleItem`, `reorderItems` (single flat `orderedIds` for all blocks), `moveItem` (up/down arrow-key movement, crosses block boundaries), `saveNote`, `removeItem`, `addTaskItem`, `addOneOffTask`. Block field is re-derived from position relative to separators via internal `normalizeItems`. Reset loading/plan on date change. `persistItems` is debounced 300 ms.
- `canMove(items, id, direction)` — standalone named export from `useDayPlanByDate.ts` (not a hook return value); checks whether an item can move up/down given block boundaries.
- `useDayPlan` — thin wrapper: `useDayPlanByDate(todayDate())`; re-exports `canMove` from the same module.
- `useTasks` — task pool; `createTask`, `updateTask`, `deleteTask`, `createDescription`, `updateDescription`
- `useTemplates` — template list; `createTemplate`, `deleteTemplate`
- `useTemplateItems(templateId)` — items + full task pool for a template; `addTaskItem`, `addSeparator`, `deleteItem`, `reorderBlock`, `moveCrossBlockLocal`, `moveCrossBlock` (per-block `position` integers, explicit block field)
- `useHistory` — last 30 `day_plans` rows ordered by `date desc`; `deletePlan` with optimistic removal
- `useDisplaySettings` — reads/writes `overseer_display_settings` in localStorage; `toggleSetting(key)` flips one boolean; side-effects inject/remove `<style>` tags on `phosphorGlow` and `pipEmoji` changes. Defaults: `{ phosphorGlow: true, pipEmoji: true, bloom: false, smear: false, scanlines: true, interlace: true, reflection: true, curvature: true, rollingBar: true }`.

### DayView component

`src/components/dayview/DayView.tsx` is the universal day display/edit component used by both TodayScreen and HistoryScreen.

Props: `{ date: string, onNewDay?: () => void, onBack?: () => void }`

Two modes:
- **View mode** — for today: checkbox toggles on click of `task-check-area` (left 48px of row), description indicator (¶) navigates to `TaskDescriptionScreen`. For historical days: everything readonly. Header has `[ edit ]` button.
- **Edit mode** — add task from pool, add one-off task (both via block-picker overlay), delete tasks, drag-and-drop reorder within and across blocks. Drag is initiated only from the dedicated `╎╎` handle (`.drag-handle` on the **right side** of the row). Rest of the row remains tappable. Header has `[ done ]` button.

When `plan === null` after loading (no `day_plans` row for today), renders `<NoPlanScreen onNewDay={onNewDay} />`.

Header: `<OverseerLogo />` left, date centered (absolute), edit/done button right. Below header: `<AsciiProgressBar value={checkedCount} total={taskCount} />`.

Rendering is flat (all `plan.items` in order): separators and tasks interleaved. **Separator types**: block separators have `label === BLOCK_LABELS[sep.block]` (e.g. `'[ morning ]'`) → render as `SectionHeader`; user-added separators (any other label) → render as `MiniSeparator` (`— label`, italic, `var(--text-muted)`). `SortableSeparator` accepts a `mini` prop to select the correct component. `SortableTaskRow` wraps `TaskRow` with `useSortable`; `opacity: 0` when `isDragging` (placeholder stays, clone shown via `DragOverlay`).

### New Day flow

`NewDayScreen` (3 steps):
1. **pick-template** — list templates or "no template"
2. **build-plan** — three block sections prefilled from template; task pool below (pool tasks + one-off task form); block-picker overlay on task click
3. **save** — denormalizes title/duration/icon/task_id into JSONB, inserts `day_plans` row, redirects to Today

One-off tasks have `task_id: null` in the saved JSONB — they never touch the `tasks` table.

### Drag-and-drop

`@dnd-kit/core` + `@dnd-kit/sortable`. All screens use `PointerSensor { distance: 8 }` + `KeyboardSensor`.

iOS scroll-vs-drag is handled by a **dedicated drag handle**, not by sensor delay. `TaskRow` (edit mode) renders a `.drag-handle` div on the **right** side of the row (symbol `╎╎`, `width: 40px`, `border-left: 1px solid var(--border-dim)`). The div receives `attributes`/`listeners` via the `dragProps` prop passed from `SortableTaskRow`. `.drag-handle` has `touch-action: none`. The rest of the row has no drag listeners → native scroll works normally. Do not move the drag listeners back onto the whole row — it reintroduces the scroll-blocks-on-swipe bug.

TemplateEditScreen still uses whole-row-as-handle (`.tmpl-item-row`). Template lists are short, so the scroll issue is less severe there.

Both DayView and TemplateEditScreen wrap everything in a single `DndContext` with one `SortableContext` covering all IDs in block order (`morning → day → evening`). `DragOverlay` renders a visible clone via portal while the original is `opacity: 0` during drag — this prevents visual jumps when the item's DOM node moves between block sections.

**Two different cross-block patterns — do not confuse them:**

- **DayView** (flat JSONB `items` array): no `onDragOver`. `onDragEnd` calls `reorderItems(arrayMove(allIds, oldIdx, newIdx))`; the hook's internal `normalizeItems` re-derives each task's `block` field from its position relative to the nearest separator above. Simpler — works because items + separators live in one ordered array.
- **TemplateEditScreen** (per-block `position` integer): uses `onDragOver` + `moveCrossBlockLocal` + `dragActiveBlockRef` to update block field and visual order live during drag. `onDragEnd` calls `reorderBlock` for same-block or `moveCrossBlock` for cross-block (fast-drag fallback). Needed because template_items has explicit `block` + `position` columns.

**NewDayScreen** build-plan step uses one `DndContext` per block (`SortableDraftRow` local component) — cross-block drag not supported in draft mode.

In `TemplateEditScreen`, the entire `.tmpl-item-row` is the drag handle. Delete button uses `onPointerDown={e => e.stopPropagation()}` to prevent drag activation. Same pattern applies to checkboxes in DayView edit mode (`.task-row.edit-mode .task-check-area { pointer-events: none }` disables toggle entirely in edit mode).

### Optimistic updates pattern

Every mutation: update local state first → fire Supabase query → revert on error (or replace temp UUID with real one on insert).

Temp IDs use `crypto.randomUUID()` and are replaced once the DB returns the real row.

### Write model warning — destructive full-array overwrite

**Critical invariant.** Mutations on `day_plans.items` (and template items to a lesser degree) all build a new full array and send `update({ items })` to Supabase — no optimistic locking, no `updated_at` compare-and-swap, no patch/merge. Any **stale read** on the client → the client writes its stale array back → newer server state (from another device/session) is silently lost.

This is why Supabase requests are `NetworkOnly` in the SW. **Do not switch to NetworkFirst / StaleWhileRevalidate / CacheFirst for `*.supabase.co`** — even a short cache TTL creates a data-loss window. If offline reads become a real requirement, the fix is write-side (add optimistic-lock column + CAS in `persistItems`, or pull-before-write in each mutation), not read-side caching.

## Deploy and Caching

Deployed on Netlify. Caching strategy:

- `dist/assets/*` — filenames contain hash (Rollup `[name]-[hash]`), cached 1 year (`immutable`)
- `index.html`, `sw.js`, `manifest.webmanifest` — `no-cache, no-store` (always fresh)
- Service Worker: `registerType: 'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`
- `globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff2}']` — explicit list for workbox precache
- Supabase requests go `NetworkOnly` through SW — not cached (see Write model warning above)

Configs: `vite.config.ts` (build output + PWA workbox), `netlify.toml` (Cache-Control headers + edge function bindings).

## iOS PWA — icons and meta tags

iOS Safari **completely ignores** `manifest.webmanifest` icons when adding to home screen. Only `<link rel="apple-touch-icon">` in `index.html` works.

Requirements:
- `public/icons/apple-touch-icon.png` — 180×180, **PNG without alpha channel** (iOS fills transparent areas with black).
- Icon background is opaque, color `#060d06` (matches `--bg-base`).
- When updating the icon — bump `?v=N` in `index.html`, Safari caches apple-touch-icon aggressively.
- Required meta tags in `index.html`:
  ```html
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png?v=N">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="OVERSEER">
  ```

## Development Principles

- One screen / one feature at a time — don't get ahead
- TypeScript strict — no `any`, no `as unknown`
- Optimistic updates: update local state first, then Supabase
- Date is always local: `new Date().toLocaleDateString('en-CA')` → `YYYY-MM-DD`
- Duration stored as numeric string (`"30"`, `"0"`), displayed with `m` suffix (`"30m"`) — never save `m` to DB. Inputs use `type="number"`, `step="10"`, rounded to nearest 10 on blur.

## Design System — REQUIRED

All visual decisions strictly follow styles in `src/index.css`. Do not deviate without explicit request.

Key constants (`src/index.css` CSS variables):
- Background: `#060d06` (`--bg-base`), surfaces: `#040b04` (`--bg-surface`)
- Accent: `#00ff41` (`--accent`), glow: `0 0 6px #00ff4188` (`--accent-glow`)
- Font: JetBrains Mono everywhere
- Border radius: 0px (max 2px for checkboxes)
- Borders: 1px solid (not 0.5px)
- Section headers always in format `[ morning ]`, `[ day ]`, `[ evening ]`
- Scanlines and other CRT effects are managed by `AppRoot` using classes/inline styles driven by `useDisplaySettings` — not hardcoded in CSS
- All styles in `src/index.css`. No CSS modules, no Tailwind.

Emoji task icons are always rendered with class `pip-emoji`. The Pip-Boy filter (`saturate(0) brightness(0.6) sepia(1) hue-rotate(55deg) saturate(4)`) is dynamically injected by `useDisplaySettings` via `<style id="pip-emoji-style">` — toggled by the PIP-BOY ICONS setting. Apply `.pip-emoji` everywhere a task icon is displayed — in plan, pool, templates, picker. Do not apply to nav or system elements.

`.phosphor-glow` is defined dynamically by `useDisplaySettings` via injected `<style>` — the class itself does nothing until the hook runs. Applied to active nav items and the OVERSEER wordmark.

Existing CSS classes for reuse: `.pool-add-btn`, `.pool-del-btn`, `.pool-del-confirm`, `.pool-input`, `.pool-save-btn`, `.pool-section-header`, `.task-icon`, `.task-duration`, `.task-check-area`, `.desc-back`, `.label-section`, `.text-muted`, `.prompt-line`, `.blink-cursor`, `.section-header`, `.pip-emoji`, `.task-desc-indicator`, `.history-item`, `.nd-picker-overlay`, `.nd-picker`, `.nd-pool-item`, `.day-view-action-btn`, `.task-row.dragging`, `.tmpl-item-row`, `.ascii-checkbox`, `.ascii-checkbox-checked`, `.ascii-progress`, `.ascii-progress-filled`, `.ascii-progress-empty`, `.ascii-progress-label`, `.drag-handle`, `.drag-handle-icon`, `.task-delete-zone`, `.overseer-logo`, `.overseer-logo-version`, `.phosphor-glow`.

Scrollbar: `scrollbar-width: none` globally, 2px webkit scrollbar hidden by default; `.scrolling` class (added/removed by a JS scroll listener in `index.html`) makes the thumb visible with accent color glow.

## TypeScript Types

All types in `src/types/index.ts`. Key ones:

```typescript
export type Block = 'morning' | 'day' | 'evening'

export interface Task { id, title, duration?, icon?, created_at, description? }
export interface TaskItem { id, type:'task', task_id?: string | null, title, duration?, icon?, block, time?, checked, position }
export interface SeparatorItem { id, type:'separator', label, block }
export type DayItem = TaskItem | SeparatorItem
export interface DayPlan { id, date, items: DayItem[], note?, created_at, updated_at }
export interface Template { id, name, created_at }
export interface TemplateItem { id, template_id, task_id?, type, separator_label?, block, position, task? }
```

## Comments and Documentation
- Comments in code only when the solution is non-obvious or there are important caveats. Do not comment obvious things.
- Language for comments and documentation: English.
- Russian text anywhere in the codebase (including comments) is an error that must be fixed: translate to English and remove the Russian.
