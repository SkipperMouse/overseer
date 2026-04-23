# Tech Debt & Audit Findings

Аудит проведён 2026-04-23. Задачи упорядочены по приоритету.

---

## Статус

- `[ ]` — не начато
- `[~]` — в работе
- `[x]` — готово

---

## Блок 1 — Критические (безопасность + потеря данных)

- `[x]` **1.1 Нет RLS** — ~~`supabase/schema.sql` не содержит ни одной политики. Anon key из JS-бандла даёт полный CRUD к БД напрямую через REST, минуя Netlify Edge Function.~~ Решено через ограничение scope Basic Auth в `netlify/edge-functions/auth.ts` (ветка `fix/20260423-basic-auth-scope`): JS-бандл больше не отдаётся без авторизации, поэтому anon key не утекает наружу. RLS как defense-in-depth не добавляли — single-user приложение, достаточно одного слоя.

- `[x]` **1.2 Полная перезапись JSONB без CAS** — `persistItems` использует `updated_at` (тригер в БД) для CAS: каждый write включает `.eq('updated_at', lastKnown)`. При mismatch (0 rows) — план перезагружается из БД, показывается баннер. `updatedAtRef` обновляется после каждого успешного write.

- `[x]` **1.3 Debounce-таймер не флашится при unmount** — cleanup-эффект по `[date]` явно вызывает pending-операцию + `clearTimeout`.

- `[x]` **1.4 NewDayScreen: тихий discard при 23505** — при коде `23505` показывается явное сообщение «план уже создан с другого устройства — твои данные не сохранены».

- `[x]` **1.5 moveCrossBlock/reorderBlock без транзакции** — `Promise.allSettled` вместо `Promise.all`; при любой ошибке состояние откатывается к `prevItems`.

- `[x]` **1.6 Async side-effect внутри setState callback** — Supabase-вызовы вынесены за пределы `setItems` в `moveCrossBlock`; `dbUpdates` собирается синхронно внутри updater, вызов идёт снаружи.

- `[x]` **1.7 createDescription ловит любую ошибку как «дубль»** — проверяется `error.code === '23505'`; остальные ошибки прокидываются без fallback-select.

---

## Блок 2 — Качество кода / расширяемость

- `[x]` **2.1 Мёртвый код (удалён)**
  - `src/components/today/UnifiedDayItem.tsx`
  - `src/components/templates/TemplatesScreen.tsx`
  - `src/components/templates/TemplateListScreen.tsx`
  - `src/hooks/useIsTouchDevice.ts`
  - `src/assets/react.svg`, `vite.svg`, `hero.png`
  - `public/icons.svg`
  - `src/App.css`
  - `GEMINI.md`

- `[x]` **2.2 CLAUDE.md рассинхронизирован** — исправлены: путь apple-touch-icon (`public/icons/`), globPatterns, удалена ссылка на несуществующий `scripts/generate-icons.mjs`, удалена ссылка на удалённые TemplatesScreen/TemplateListScreen.

- `[x]` **2.3 Дублирование хелперов** — извлечены:
  - `src/lib/date.ts`: `todayDate()`, `formatDate()`, `tomorrowDate()`
  - `src/lib/blocks.ts`: `BLOCKS`, `BLOCK_LABELS`, `BLOCK_DEFS`
  - Все потребители обновлены.

- `[ ]` **2.4 Смешанные паттерны загрузки** — NewDayScreen напрямую дёргает `supabase` вместо хуков; при каждой смене экрана задачи перезагружаются с нуля. Рефактор: общий хук или хотя бы useCallback в NewDayScreen.

- `[ ]` **2.5 Unchecked cast вместо runtime-валидации** — `as RawTaskRow[]`, `as DayPlan` и т.п. обходят TypeScript. При несоответствии Supabase-ответа — runtime crash без диагностики. Решение: zod или narrow-функции.

- `[x]` **2.6 Hard-coded блоки в 6 местах** — решено через `src/lib/blocks.ts`: единый `BLOCK_DEFS` с порядком и лейблами, из него выводятся `BLOCKS` и `BLOCK_LABELS`.

- `[x]` **2.7 PoolTaskRow — 13 пропсов** — состояния `isEditingTitle`, `isEditingDur`, `isConfirmingDelete` перенесены в локальный state PoolTaskRow. Пропсов стало 7.

- `[x]` **2.8 Нет ErrorBoundary** — добавлен `src/components/ui/ErrorBoundary.tsx`, оборачивает `<App />` в `main.tsx`.

- `[ ]` **2.9 JSONB без версионирования схемы** — изменение shape `TaskItem` сломает старые данные молча. Добавить `schema_version` в запись или поле JSONB.

- `[ ]` **2.10 Нет тестов на критичных хуках** — `normalizeItems`, `canMove`, `moveItem` — кандидаты на vitest unit-тесты.

---

## Блок 3 — Мелкие баги / UX

- `[x]` **3.1 EmojiPicker обрезает ZWJ-последовательности** — заменено `codepoints.slice(0,2)` на `Intl.Segmenter` — корректно обрабатывает флаги, семейные и профессиональные эмодзи.

- `[x]` **3.2 Несогласованный delete-confirm в TaskPoolScreen** — в search-ветке добавлены `autoFocus` и `onBlur`-cancel, идентично основному виду.

- `[x]` **3.3 Нет пути «создать план на завтра»** — NewDayScreen получил `targetDate` state. При наличии плана на сегодня показывается кнопка «создать план на завтра».

- `[x]` **3.4 onetimeIcon/Title/Duration не сбрасываются при cancel через overlay** — кнопка «← назад» сбрасывает все состояния onetime-формы и `pendingForBlock`.

- `[x]` **3.5 Edit-mode чекбокс: код и документация расходятся** — добавлено CSS-правило `.task-row.edit-mode .task-check-area { pointer-events: none }`.

- `[x]` **3.6 HistoryScreen — лимит 30 записей без пагинации** — `useHistory` теперь возвращает `loadMore`/`hasMore`/`loadingMore`; в HistoryScreen показывается кнопка «// загрузить ещё».

---

## Блок 4 — PWA-иконки (iOS) ✅

- `[x]` **4.1 apple-touch-icon содержит неверный контент**
- `[x]` **4.2 apple-touch-icon не в корне public/**
- `[x]` **4.3 Bump `?v=3` в index.html**
- `[x]` **4.4 Лишняя запись в vite.config manifest**
- `[x]` **4.5 Нет generate-icons скрипта**
