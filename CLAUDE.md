# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

At the start of each session, unless a specific branch is already specified, create a new branch from the current local `feature-[Latest Number]`.

### Branch naming
- New feature or general task: `feat/YYYYMMDD-<slug>`
- Bug fix: `fix/YYYYMMDD-<slug>`

`<slug>` — 2-4 words in kebab-case, derived from the task description. English only.

Examples: `feat/20260412-user-auth-flow`, `fix/20260412-null-pointer-login`

### Procedure
```bash
git checkout feature-1 
git checkout -b <branch-name>
```

If the branch name already exists, generate a different slug — do not add numeric suffixes like `-2`.

### Constraints
- No `git fetch`, no `git pull` — repository state is managed manually
- No commits, no pushes — only branch creation and file changes
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

`App.tsx` holds a `Screen` union (`today | new-day | pool | history`) and renders one top-level screen at a time. `BottomNav` uses a narrower union that excludes `new-day` (it's hidden on that screen). Screens manage their own sub-navigation internally via local state:

- **TodayScreen** — accepts optional `date?: string` (defaults to today), `onBack?: () => void`, `onNewDay?: () => void`. Thin wrapper around `<DayView>`.
- **TaskPoolScreen** — renders `TemplateEditScreen` in place when `editingTemplate !== null`; renders `TaskDescriptionScreen` in place when `descTask !== null`. Contains both the Templates section (top) and Task Pool section (bottom) with global search across both.
- **HistoryScreen** — renders `TodayScreen` (with `date` + `onBack` props) in place when `viewingDate !== null`.

**Adding a new top-level screen** requires four changes: new hook + component under `src/components/<name>/`, CSS section in `src/index.css`, import + render in `App.tsx`, and adding the id to `NAV_ITEMS` in `BottomNav.tsx` (also update the `Screen` type there).

`src/components/templates/TemplatesScreen.tsx` and `TemplateListScreen.tsx` are not wired into `App.tsx` — they are dead code (replaced by `TaskPoolScreen` hosting templates inline).

### DayView component

`src/components/dayview/DayView.tsx` is the universal day display/edit component used by both TodayScreen and HistoryScreen.

Props: `{ date: string, onNewDay?: () => void, onBack?: () => void }`

Two modes:
- **View mode** — for today: checkbox toggles on click of `task-check-area` (left ~32px of row), description indicator (¶) navigates to `TaskDescriptionScreen`. For historical days: everything readonly. Header has `[ edit ]` button.
- **Edit mode** — add task from pool, add one-off task (both via block-picker overlay), delete tasks, drag-and-drop reorder within and across blocks. Drag is initiated only from the dedicated `⠿` handle (`.drag-handle` span rendered by `TaskRow` in edit mode) — rest of the row remains tappable: checkbox still toggles, title click opens description. Header has `[ done ]` button.

Rendering is block-based (BLOCKS.map): each block renders its separator then its tasks inside a single shared `SortableContext` (edit mode) or plain `TaskRow` list (view mode). `SortableTaskRow` (in `src/components/today/`) wraps `TaskRow` with `useSortable` from @dnd-kit/sortable; `opacity: 0` when `isDragging` (placeholder stays, clone shown via `DragOverlay`).

### New Day flow

`NewDayScreen` (3 steps):
1. **pick-template** — list templates or "без шаблона"
2. **build-plan** — three block sections prefilled from template; task pool below (pool tasks + one-off task form); block-picker overlay on task click
3. **save** — denormalizes title/duration/icon/task_id into JSONB, inserts `day_plans` row, redirects to Today

One-off tasks have `task_id: null` in the saved JSONB — they never touch the `tasks` table.

### Hooks

Each hook owns its slice of state and exposes optimistic-update mutations:

- `useDayPlanByDate(date)` — plan for any date + `taskDescIds: Set<string>`; mutations: `toggleItem`, `reorderItems` (single flat `orderedIds` for all blocks), `moveItem` (up/down arrow-key movement, crosses block boundaries), `saveNote`, `removeItem`, `addTaskItem`, `addOneOffTask`. Block field is re-derived from position relative to separators via internal `normalizeItems`. Reset loading/plan on date change. `persistItems` is debounced 300 ms.
- `canMove(items, id, direction)` — standalone named export from `useDayPlanByDate.ts` (not a hook return value); checks whether an item can move up/down given block boundaries.
- `useDayPlan` — thin wrapper: `useDayPlanByDate(todayDate())`; re-exports `canMove` from the same module.
- `useTasks` — task pool; `createTask`, `updateTask`, `deleteTask`, `createDescription`, `updateDescription`
- `useTemplates` — template list; `createTemplate`, `deleteTemplate`
- `useTemplateItems(templateId)` — items + full task pool for a template; `addTaskItem`, `addSeparator`, `deleteItem`, `reorderBlock`, `moveCrossBlockLocal`, `moveCrossBlock` (per-block `position` integers, explicit block field)
- `useHistory` — last 30 `day_plans` rows ordered by `date desc`; `deletePlan` with optimistic removal

### Drag-and-drop

`@dnd-kit/core` + `@dnd-kit/sortable`. All screens use `PointerSensor { distance: 8 }` + `KeyboardSensor`.

iOS scroll-vs-drag is handled by a **dedicated drag handle**, not by sensor delay. `TaskRow` (edit mode) renders `<span className="drag-handle">⠿</span>` which receives `attributes`/`listeners` from `useSortable`. `.drag-handle` has `touch-action: none` (browser can't pan from it). The rest of the row has no drag listeners → native scroll works normally within long lists. Do not move the drag listeners back onto the whole row — it reintroduces the scroll-blocks-on-swipe bug.

TemplateEditScreen still uses whole-row-as-handle (`.tmpl-item-row`). Template lists are short, so the scroll issue is less severe there. If template lists grow, refactor to match the dedicated-handle pattern.

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

## Деплой и кэширование

Проект деплоится на Netlify. Стратегия кэширования:

- `dist/assets/*` — содержат хэш в имени файла (Rollup `[name]-[hash]`), кэшируются 1 год (`immutable`)
- `index.html`, `sw.js`, `manifest.webmanifest` — `no-cache, no-store` (всегда свежие)
- Service Worker: `registerType: 'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`
- `globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}']` — явный список для workbox precache
- Supabase запросы идут `NetworkOnly` через SW — не кэшируются (см. «Write model warning» выше)

Конфиги: `vite.config.ts` (build output + PWA workbox), `netlify.toml` (Cache-Control заголовки).

## iOS PWA — иконки и мета-теги

iOS Safari **полностью игнорирует** `manifest.webmanifest` иконки при добавлении на home screen. Работает только `<link rel="apple-touch-icon">` в `index.html`.

Требования:
- `public/apple-touch-icon.png` — **в корне public/**, не в `/icons/`. 180×180, **PNG без альфа-канала** (прозрачные области iOS заливает чёрным — отсюда чёрный квадрат с единственной буквой).
- Фон иконки непрозрачный, цвет `#060d06` (совпадает с `--bg-base`).
- При обновлении иконки — поднимать `?v=N` в `index.html`, т.к. Safari кэширует apple-touch-icon крайне упорно.
- Обязательный набор мета-тегов в `index.html`:
  ```html
  <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=N">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="OVERSEER">
  ```

Перегенерация иконки — `node scripts/generate-icons.mjs` (использует `sharp`, devDep). Скрипт flatten'ит существующий `public/icons/apple-touch-icon.png` против `#060d06` и кладёт результат в `public/apple-touch-icon.png`. Если нужна новая база — замени файл в `public/icons/`, потом перезапусти скрипт.

## Принципы разработки

- Один экран / одна фича за раз — не забегать вперёд
- TypeScript strict — никаких `any`, никаких `as unknown`
- Оптимистичные апдейты: сначала обновляем локальный state, потом Supabase
- Дата всегда локальная: `new Date().toLocaleDateString('en-CA')` → `YYYY-MM-DD`
- Duration хранится как числовая строка (`"30"`, `"0"`), отображается с суффиксом `M` (`"30M"`) — никогда не сохранять `M` в БД. В инпутах `type="number"`, `step="10"`, округление до кратного 10 при blur.

## Дизайн-система — ОБЯЗАТЕЛЬНО

Все визуальные решения строго соответствуют стилям в `src/index.css`. Не отклоняться без явного запроса.

Ключевые константы (`src/index.css` CSS-переменные):
- Фон: `#060d06` (`--bg-base`), поверхности: `#040b04` (`--bg-surface`)
- Акцент: `#00ff41` (`--accent`), свечение: `0 0 6px #00ff4188` (`--accent-glow`)
- Шрифт: JetBrains Mono везде
- Скругления: 0px (максимум 2px для чекбоксов)
- Бордеры: 1px solid (не 0.5px)
- Заголовки секций всегда в формате `[ утро ]`, `[ работа ]`, `[ вечер ]`
- Scanlines через `::before` на `.app-root`
- Все стили — в `src/index.css`. Нет CSS-модулей, нет Tailwind.

Emoji иконки задач всегда рендерятся с классом `pip-emoji` (Pip-Boy фильтр: `filter: saturate(0) brightness(0.6) sepia(1) hue-rotate(55deg) saturate(4)`). Применяется везде где отображается иконка задачи — в плане, пуле, шаблонах, пикере. Не применять к навигации и системным элементам.

Существующие CSS-классы для повторного использования: `.pool-add-btn`, `.pool-del-btn`, `.pool-del-confirm`, `.pool-input`, `.pool-save-btn`, `.pool-section-header`, `.task-icon`, `.task-duration`, `.task-check-area`, `.desc-back`, `.label-section`, `.text-muted`, `.prompt-line`, `.blink-cursor`, `.section-header`, `.pip-emoji`, `.task-desc-indicator`, `.progress-track`, `.progress-fill`, `.history-item`, `.nd-picker-overlay`, `.nd-picker`, `.nd-pool-item`, `.day-view-action-btn`, `.task-row.dragging`, `.tmpl-item-row`.

## TypeScript типы

Все типы в `src/types/index.ts`. Ключевые:

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
