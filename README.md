# OVERSEER

> Personal day planner with a Pip-Boy / Fallout terminal aesthetic.

![License: MIT](https://img.shields.io/badge/License-MIT-00ff41.svg)

A single-user daily planning tool built for people who want full control over their schedule — without subscriptions, ads, or bloat. Plan your day across three time blocks, track progress, manage reusable tasks and day templates, and keep notes. All your data, synced across devices.

## Features

- **Day planning** — three blocks (morning / work / evening) with tasks, separators, and optional time markers
- **Task pool** — global reusable task library with optional descriptions
- **Templates** — named day presets (weekdays, weekends, etc.) to quickly scaffold a new day
- **Progress tracking** — live progress bar and daily completion history
- **Task descriptions** — expandable notes per task (exercises, checklists, references)
- **Drag-and-drop** — reorder tasks within and across blocks
- **PWA** — installable on mobile home screen, works like a native app
- **Cross-device sync** — data stored in Supabase, available on phone and desktop simultaneously
- **CRT terminal aesthetic** — JetBrains Mono, scanlines, neon green `#00ff41`, Pip-Boy vibes

## Stack

- **Vite + React 19 + TypeScript** (strict)
- **Supabase** — PostgreSQL with custom `overseer` schema
- **@dnd-kit** — drag-and-drop reordering
- **vite-plugin-pwa** — PWA manifest and service worker
- **JetBrains Mono** — the only font

No UI libraries. No CSS frameworks. No unnecessary dependencies.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
git clone https://github.com/your-username/overseer.git
cd overseer
npm install
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Initialize the database — run `supabase/schema.sql` in your Supabase SQL editor.

```bash
npm run dev
```

### Deploy

The app is designed to deploy on [Netlify](https://netlify.com):

1. Connect your GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify → Site settings → Environment variables
5. Enable **Password Protection** in Netlify → Site settings → Access control

## Project Structure

```
src/
  components/
    today/        — Today screen (main view)
    templates/    — Templates management
    tasks/        — Task pool CRUD
    history/      — Last 30 days
    ui/           — Shared components (BottomNav, TaskRow, etc.)
  hooks/          — useDayPlan, useTasks, useTemplates
  lib/
    supabase.ts   — Supabase client singleton
  types/
    index.ts      — All TypeScript types
supabase/
  schema.sql      — Full database schema (overseer schema)
```

## License

MIT — do whatever you want, just keep it good.

