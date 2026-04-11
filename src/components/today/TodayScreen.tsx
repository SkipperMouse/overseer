import { useRef } from 'react'
import { useDayPlan, canMove } from '../../hooks/useDayPlan'
import type { TaskItem } from '../../types'
import SectionHeader from './SectionHeader'
import TaskRow from './TaskRow'

function formatDate() {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).replace(/\.$/, '')
}

export default function TodayScreen() {
  const { plan, loading, startEmpty, toggleItem, moveItem, saveNote } = useDayPlan()
  const noteRef = useRef<HTMLTextAreaElement>(null)

  if (loading) {
    return (
      <div className="today-screen">
        <div className="today-loading">
          <span className="text-muted">загрузка</span>
          <span className="blink-cursor" />
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="today-screen">
        <div className="no-plan-screen">
          <div className="no-plan-date">{formatDate()}</div>
          <div className="no-plan-message label-section">нет плана на сегодня</div>
          <button className="pool-tag no-plan-btn" onClick={startEmpty}>
            начать без шаблона
          </button>
        </div>
      </div>
    )
  }

  const tasks = plan.items.filter((i): i is TaskItem => i.type === 'task')
  const done = tasks.filter(i => i.checked).length
  const total = tasks.length
  const pct = total > 0 ? (done / total) * 100 : 0

  return (
    <div className="today-screen">
      <header className="today-header">
        <div className="today-header-top">
          <span className="today-brand">overseer</span>
          <span className="today-date text-muted">{formatDate()}</span>
        </div>
        <div className="today-progress-row">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="today-progress-label text-muted">{done}/{total}</span>
        </div>
      </header>

      <div className="today-content">
        {plan.items.map(item =>
          item.type === 'separator' ? (
            <SectionHeader key={item.id} label={item.label} />
          ) : (
            <TaskRow
              key={item.id}
              item={item}
              canMoveUp={canMove(plan.items, item.id, 'up')}
              canMoveDown={canMove(plan.items, item.id, 'down')}
              onToggle={() => toggleItem(item.id)}
              onMoveUp={() => moveItem(item.id, 'up')}
              onMoveDown={() => moveItem(item.id, 'down')}
            />
          )
        )}

        {tasks.length === 0 && (
          <div className="today-empty">
            <span className="text-muted">// задачи не добавлены</span>
          </div>
        )}

        <div className="note-area">
          <div className="prompt-line">{'>'} note</div>
          <textarea
            ref={noteRef}
            key={plan.id}
            className="note-input"
            defaultValue={plan.note ?? ''}
            placeholder="// заметки на день..."
            onBlur={e => saveNote(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
