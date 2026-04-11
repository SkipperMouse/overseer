import { useState, useRef } from 'react'
import { useDayPlanByDate, canMove } from '../../hooks/useDayPlanByDate'
import { useTasks } from '../../hooks/useTasks'
import type { Task, TaskItem, Block } from '../../types'
import SectionHeader from '../today/SectionHeader'
import TaskRow from '../today/TaskRow'
import EmojiPicker from '../tasks/EmojiPicker'

type PendingAdd =
  | { kind: 'pool'; task: Task }
  | { kind: 'onetime'; title: string; duration?: string; icon?: string }

const BLOCKS: Block[] = ['morning', 'day', 'evening']
const BLOCK_LABELS: Record<Block, string> = {
  morning: '[ утро ]',
  day: '[ работа ]',
  evening: '[ вечер ]',
}

function todayDate() {
  return new Date().toLocaleDateString('en-CA')
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\.$/, '')
}

interface Props {
  date: string
  onNewDay?: () => void
  onBack?: () => void
}

export default function DayView({ date, onNewDay, onBack }: Props) {
  const isToday = date === todayDate()

  const {
    plan, loading, taskDescIds,
    toggleItem, moveItem, saveNote, removeItem, addTaskItem, addOneOffTask,
  } = useDayPlanByDate(date)
  const { tasks: allTasks } = useTasks()

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null)
  const [showAddPool, setShowAddPool] = useState(false)
  const [showOnetimeForm, setShowOnetimeForm] = useState(false)
  const [onetimeTitle, setOnetimeTitle] = useState('')
  const [onetimeDuration, setOnetimeDuration] = useState('')
  const [onetimeIcon, setOnetimeIcon] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const noteRef = useRef<HTMLTextAreaElement>(null)

  if (loading) {
    return (
      <div className="day-view-screen">
        <div className="today-loading">
          <span className="text-muted">загрузка</span>
          <span className="blink-cursor" />
        </div>
      </div>
    )
  }

  if (!plan) {
    if (isToday && onNewDay) {
      return (
        <div className="day-view-screen">
          <div className="no-plan-screen">
            <div className="no-plan-date">{formatDate(date)}</div>
            <div className="no-plan-message label-section">нет плана на сегодня</div>
            <button className="pool-tag no-plan-btn" onClick={onNewDay}>
              создать план
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="day-view-screen">
        <div className="today-loading">
          <span className="text-muted">// данные не найдены</span>
        </div>
      </div>
    )
  }

  const tasks = plan.items.filter((i): i is TaskItem => i.type === 'task')
  const done = tasks.filter(i => i.checked).length
  const total = tasks.length
  const pct = total > 0 ? (done / total) * 100 : 0

  const usedTaskIds = new Set(
    tasks
      .filter(t => t.task_id !== null && t.task_id !== undefined)
      .map(t => t.task_id as string)
  )
  const poolAvailable = allTasks.filter(t => !usedTaskIds.has(t.id))

  const isReadonly = !isToday && mode === 'view'

  function handleDone() {
    setMode('view')
    setShowAddPool(false)
    setShowOnetimeForm(false)
  }

  function submitOnetimeForm() {
    if (!onetimeTitle.trim()) return
    setPendingAdd({
      kind: 'onetime',
      title: onetimeTitle.trim(),
      duration: onetimeDuration.trim() || undefined,
      icon: onetimeIcon || undefined,
    })
    setShowOnetimeForm(false)
    setOnetimeTitle('')
    setOnetimeDuration('')
    setOnetimeIcon('')
  }

  function confirmAdd(block: Block) {
    if (!pendingAdd) return
    if (pendingAdd.kind === 'pool') {
      addTaskItem(pendingAdd.task, block)
    } else {
      addOneOffTask(pendingAdd.title, block, pendingAdd.duration, pendingAdd.icon)
    }
    setPendingAdd(null)
  }

  return (
    <div className="day-view-screen">
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={em => { setOnetimeIcon(em); setShowEmojiPicker(false) }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      <header className="day-view-header">
        <div className="day-view-header-row">
          {onBack ? (
            <button className="desc-back" onClick={onBack}>← назад</button>
          ) : (
            <span className="today-brand">overseer</span>
          )}
          <span className="day-view-date text-muted">{formatDate(date)}</span>
          {mode === 'view' ? (
            <button className="day-view-action-btn" onClick={() => setMode('edit')}>
              [ edit ]
            </button>
          ) : (
            <button className="day-view-action-btn day-view-action-done" onClick={handleDone}>
              [ done ]
            </button>
          )}
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
              hasDesc={item.task_id ? taskDescIds.has(item.task_id) : false}
              readonly={isReadonly}
              onToggle={() => toggleItem(item.id)}
              onMoveUp={() => moveItem(item.id, 'up')}
              onMoveDown={() => moveItem(item.id, 'down')}
              onDelete={mode === 'edit' ? () => removeItem(item.id) : undefined}
            />
          )
        )}

        {tasks.length === 0 && (
          <div className="today-empty">
            <span className="text-muted">// задачи не добавлены</span>
          </div>
        )}

        {mode === 'edit' && (
          <div className="day-view-edit-section">
            <div className="day-view-edit-label prompt-line">{'>'} добавить задачу</div>

            <button
              className="day-view-pool-toggle"
              onClick={() => { setShowAddPool(v => !v); setShowOnetimeForm(false) }}
            >
              {showAddPool ? '// скрыть пул' : '// + из пула задач'}
            </button>

            {showAddPool && (
              <div className="day-view-pool-list">
                {poolAvailable.length === 0 ? (
                  <div className="text-muted day-view-pool-empty">// все задачи уже в плане</div>
                ) : (
                  poolAvailable.map(task => (
                    <button
                      key={task.id}
                      className="nd-pool-item"
                      onClick={() => { setPendingAdd({ kind: 'pool', task }); setShowAddPool(false) }}
                    >
                      {task.icon
                        ? <span className="task-icon pip-emoji">{task.icon}</span>
                        : <span className="task-icon" />
                      }
                      <span className="nd-pool-title">{task.title}</span>
                      {task.duration && <span className="task-duration">{task.duration}</span>}
                      <span className="nd-pool-plus">+</span>
                    </button>
                  ))
                )}
              </div>
            )}

            <button
              className="day-view-pool-toggle"
              onClick={() => { setShowOnetimeForm(v => !v); setShowAddPool(false) }}
            >
              {showOnetimeForm ? '// скрыть форму' : '// + разовая задача'}
            </button>

            {showOnetimeForm && (
              <div className="nd-onetime-form">
                <div className="nd-onetime-row">
                  <button
                    type="button"
                    className="pool-icon-field"
                    onClick={() => setShowEmojiPicker(true)}
                  >
                    {onetimeIcon
                      ? <span className="pip-emoji">{onetimeIcon}</span>
                      : <span className="text-dim">∅</span>
                    }
                  </button>
                  <input
                    className="pool-input pool-input-title"
                    value={onetimeTitle}
                    onChange={e => setOnetimeTitle(e.target.value)}
                    placeholder="название задачи"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitOnetimeForm()
                      if (e.key === 'Escape') { setShowOnetimeForm(false); setOnetimeTitle(''); setOnetimeDuration(''); setOnetimeIcon('') }
                    }}
                  />
                  <input
                    className="pool-input pool-input-dur"
                    value={onetimeDuration}
                    onChange={e => setOnetimeDuration(e.target.value)}
                    placeholder="30m"
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitOnetimeForm()
                      if (e.key === 'Escape') { setShowOnetimeForm(false); setOnetimeTitle(''); setOnetimeDuration(''); setOnetimeIcon('') }
                    }}
                  />
                  <button
                    className="pool-save-btn"
                    disabled={!onetimeTitle.trim()}
                    onClick={submitOnetimeForm}
                  >+</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="note-area">
          <div className="prompt-line">{'>'} note</div>
          {isReadonly ? (
            <div className="note-readonly text-muted">
              {plan.note || <span className="text-dim">// нет заметок</span>}
            </div>
          ) : (
            <textarea
              ref={noteRef}
              key={plan.id}
              className="note-input"
              defaultValue={plan.note ?? ''}
              placeholder="// заметки на день..."
              onBlur={e => saveNote(e.target.value)}
            />
          )}
        </div>
      </div>

      {pendingAdd && (
        <div className="nd-picker-overlay" onClick={() => setPendingAdd(null)}>
          <div className="nd-picker" onClick={e => e.stopPropagation()}>
            <div className="nd-picker-label prompt-line">{'>'} добавить в блок:</div>
            <div className="nd-picker-task-name">
              {pendingAdd.kind === 'pool'
                ? <>{pendingAdd.task.icon && <span className="pip-emoji">{pendingAdd.task.icon}</span>} {pendingAdd.task.title}</>
                : <>{pendingAdd.icon && <span className="pip-emoji">{pendingAdd.icon}</span>} {pendingAdd.title}</>
              }
            </div>
            {BLOCKS.map(block => (
              <button key={block} className="nd-picker-btn" onClick={() => confirmAdd(block)}>
                {BLOCK_LABELS[block]}
              </button>
            ))}
            <button className="nd-picker-cancel" onClick={() => setPendingAdd(null)}>отмена</button>
          </div>
        </div>
      )}
    </div>
  )
}
