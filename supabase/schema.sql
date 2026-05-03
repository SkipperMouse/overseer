-- OVERSEER — full database schema
-- Run in Supabase SQL Editor to initialize from scratch
-- Schema: overseer

-- ─── Schema ─────────────────────────────────────────────────────
create schema if not exists overseer;

-- ─── tasks — global task pool ───────────────────────────────────
create table if not exists overseer.tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  duration   text,
  icon       text,
  created_at timestamptz default now()
);

-- ─── task_descriptions — extended content for a task ────────────
create table if not exists overseer.task_descriptions (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null unique references overseer.tasks(id) on delete cascade,
  content    text not null default '',
  updated_at timestamptz default now()
);

-- ─── templates — named day presets ──────────────────────────────
create table if not exists overseer.templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- ─── template_items — tasks/separators inside a template ────────
create table if not exists overseer.template_items (
  id              uuid primary key default gen_random_uuid(),
  template_id     uuid references overseer.templates(id) on delete cascade,
  task_id         uuid references overseer.tasks(id) on delete set null,
  type            text not null check (type in ('task', 'separator')),
  separator_label text,
  block           text not null check (block in ('morning', 'day', 'evening')),
  position        integer not null
);

-- ─── day_plans — denormalized plan for a specific date ──────────
-- items jsonb structure:
-- [
--   { "id": "uuid", "type": "separator", "label": "[ утро ]", "block": "morning" },
--   { "id": "uuid", "type": "task", "title": "...", "duration": "...",
--     "icon": "...", "block": "morning", "time": null, "checked": false, "position": 1 }
-- ]
create table if not exists overseer.day_plans (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique,
  items      jsonb not null default '[]',
  note       text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── update_updated_at trigger function ─────────────────────────
create or replace function overseer.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── Triggers ────────────────────────────────────────────────────
drop trigger if exists day_plans_updated_at on overseer.day_plans;
create trigger day_plans_updated_at
  before update on overseer.day_plans
  for each row execute function overseer.update_updated_at();

drop trigger if exists task_descriptions_updated_at on overseer.task_descriptions;
create trigger task_descriptions_updated_at
  before update on overseer.task_descriptions
  for each row execute function overseer.update_updated_at();

-- ─── device_settings — per-device display preferences ───────────
create table if not exists overseer.device_settings (
  device_id  text primary key,
  settings   jsonb not null default '{}',
  updated_at timestamptz default now()
);

drop trigger if exists device_settings_updated_at on overseer.device_settings;
create trigger device_settings_updated_at
  before update on overseer.device_settings
  for each row execute function overseer.update_updated_at();
