# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

`App.tsx` holds a `Screen` union (`today | new-day | templates | pool | history`) and renders one top-level screen at a time. `BottomNav` is hidden on `new-day`. Three screens manage their own sub-navigation internally via local state:

- **TodayScreen** — shows `NewDayScreen` flow via `onNewDay` prop when no plan exists
- **TaskPoolScreen** — renders `TaskDescriptionScreen` in place when `descTask !== null`
- **TemplatesScreen** — renders `TemplateEditScreen` in place when `editing !== null`

### New Day flow

`NewDayScreen` (3 steps):
1. **pick-template** — list templates or "без шаблона"
2. **build-plan** — three block sections prefilled from template; task pool below (pool tasks + one-off task form); block-picker overlay on task click
3. **save** — denormalizes title/duration/icon/task_id into JSONB, inserts `day_plans` row, redirects to Today

One-off tasks have `task_id: null` in the saved JSONB — they never touch the `tasks` table.

### Hooks

Each hook owns its slice of state and exposes optimistic-update mutations:

- `useDayPlan` — today's plan + `taskDescIds: Set<string>` (task_ids with descriptions); `startEmpty`, `toggleItem`, `moveItem`, `saveNote`
- `useTasks` — task pool; `createTask`, `updateTask`, `deleteTask`, `createDescription`, `updateDescription`
- `useTemplates` — template list; `createTemplate`, `deleteTemplate`
- `useTemplateItems(templateId)` — items + full task pool for a template; `addTaskItem`, `addSeparator`, `deleteItem`, `moveItem`

### Optimistic updates pattern

Every mutation: update local state first → fire Supabase query → revert on error (or replace temp UUID with real one on insert).

Temp IDs use `crypto.randomUUID()` and are replaced once the DB returns the real row.

## Принципы разработки

- Один экран / одна фича за раз — не забегать вперёд
- TypeScript strict — никаких `any`, никаких `as unknown`
- Оптимистичные апдейты: сначала обновляем локальный state, потом Supabase
- Дата всегда локальная: `new Date().toLocaleDateString('en-CA')` → `YYYY-MM-DD`

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

Существующие CSS-классы для повторного использования: `.pool-add-btn`, `.pool-del-btn`, `.pool-del-confirm`, `.pool-input`, `.pool-save-btn`, `.move-btn`, `.task-move-btns`, `.task-icon`, `.task-duration`, `.desc-back`, `.label-section`, `.text-muted`, `.prompt-line`, `.blink-cursor`, `.section-header`, `.pip-emoji`, `.task-desc-indicator`.

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
