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

### Data model (`supabase/schema.sql`)

- **tasks** — global reusable task definitions (title, duration, icon)
- **templates** — named day presets
- **template_items** — ordered tasks/separators within a template (block: morning/day/evening)
- **day_plans** — denormalized daily schedule per date, stored as JSONB; each item is either a task (`{id, type, title, duration, icon, block, time, checked, position}`) or a separator (`{id, type, label, block}`); also has a `note` field

### Frontend

- `src/lib/supabase.ts` — initializes the Supabase client
- `src/App.tsx` — root component (early-stage)
- `src/index.css` — global design system: retro terminal aesthetic, JetBrains Mono, neon green accent `#00ff41`, dark background `#060d06`

### Key dependencies

- `@dnd-kit` — drag-and-drop for task reordering
- `@supabase/supabase-js` — database client
- `vite-plugin-pwa` — service worker / offline support

## Принципы разработки

- Один экран / одна фича за раз — не забегать вперёд
- TypeScript strict — никаких `any`, никаких `as unknown`
- После каждого шага — краткое summary файлов и что изменилось
- Оптимистичные апдейты: сначала обновляем локальный state, потом Supabase
- Дата всегда локальная: `new Date().toLocaleDateString('en-CA')` → `YYYY-MM-DD`

## Дизайн-система — ОБЯЗАТЕЛЬНО

Все визуальные решения строго из `overseer-spec.md`. Не отклоняться без явного запроса.

Ключевые константы:
- Фон: `#060d06`, поверхности: `#040b04`
- Акцент: `#00ff41`, свечение: `0 0 6px #00ff4188`
- Шрифт: JetBrains Mono везде
- Скругления: 0px (максимум 2px для чекбоксов)
- Бордеры: 1px solid (не 0.5px)
- Заголовки секций всегда в формате `[ утро ]`, `[ работа ]`, `[ вечер ]`
- Scanlines через `::before` на `.app-root`

## Структура компонентов (целевая)

```
src/
  components/
    today/        — Today экран
    templates/    — Templates экран  
    tasks/        — Task Pool экран
    history/      — History экран
    ui/           — общие: Checkbox, TaskRow, SectionHeader, BottomNav
  lib/
    supabase.ts
  types/
    index.ts      — все TypeScript типы
  hooks/
    useDayPlan.ts
    useTasks.ts
    useTemplates.ts
```

## TypeScript типы (добавить в src/types/index.ts)

```typescript
export type Block = 'morning' | 'day' | 'evening';

export interface TaskItem {
  id: string;
  type: 'task';
  title: string;
  duration?: string;
  icon?: string;
  block: Block;
  time?: string | null;
  checked: boolean;
  position: number;
}

export interface SeparatorItem {
  id: string;
  type: 'separator';
  label: string;
  block: Block;
}

export type DayItem = TaskItem | SeparatorItem;

export interface DayPlan {
  id: string;
  date: string;
  items: DayItem[];
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  duration?: string;
  icon?: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  created_at: string;
}

export interface TemplateItem {
  id: string;
  template_id: string;
  task_id?: string;
  type: 'task' | 'separator';
  separator_label?: string;
  block: Block;
  position: number;
  task?: Task;
}
```
