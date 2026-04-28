import { useState, useCallback, useEffect, useRef } from 'react'
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useDayPlanByDate } from '../../hooks/useDayPlanByDate'
import { useTasks } from '../../hooks/useTasks'
import type { Task, TaskItem, SeparatorItem, Block } from '../../types'
import { BLOCKS, BLOCK_LABELS } from '../../lib/blocks'
import { todayDate, formatDate } from '../../lib/date'
import SectionHeader from '../today/SectionHeader'
import MiniSeparator from '../today/MiniSeparator'
import TaskRow from '../today/TaskRow'
import SortableTaskRow from '../today/SortableTaskRow'
import SortableSeparator from '../today/SortableSeparator'
import EmojiPicker from '../tasks/EmojiPicker'
import TaskDescriptionScreen from '../tasks/TaskDescriptionScreen'
import OverseerLogo from '../ui/OverseerLogo'
import AsciiProgressBar from '../ui/AsciiProgressBar'
import NoPlanScreen from '../ui/NoPlanScreen'

type PendingAdd =
  | { kind: 'pool'; task: Task }
  | { kind: 'onetime'; title: string; duration?: string; icon?: string }

interface NoteAreaProps {
  initialValue: string
  onSave: (value: string) => void
}

function NoteArea({ initialValue, onSave }: NoteAreaProps) {
  const [value, setValue] = useState(initialValue)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = useRef(value)
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    valueRef.current = value
    onSaveRef.current = onSave
  })

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
      onSaveRef.current(valueRef.current)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setValue(v)
    valueRef.current = v
    if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSaveRef.current(v)
    }, 500)
  }, [])

  return (
    <div className="note-area">
      <div className="prompt-line">{'>'} note</div>
      <div className="note-input-wrap">
        {value === '' && !focused && (
          <span className="blink-cursor note-blink-cursor" />
        )}
        <textarea
          className="note-input"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={e => { setFocused(false); onSaveRef.current(e.target.value) }}
        />
      </div>
    </div>
  )
}

interface Props {
  date: string
  onNewDay?: () => void
  onBack?: () => void
}

export default function DayView({ date, onNewDay, onBack }: Props) {
  const isToday = date === todayDate()

  const {
    plan, loading, taskDescIds, writeConflict,
    toggleItem, reorderItems, saveNote, removeItem, addTaskItem, addOneOffTask,
  } = useDayPlanByDate(date)
  const { tasks: allTasks, updateDescription } = useTasks()

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null)
  const [showAddPool, setShowAddPool] = useState(false)
  const [showOnetimeForm, setShowOnetimeForm] = useState(false)
  const [onetimeTitle, setOnetimeTitle] = useState('')
  const [onetimeDuration, setOnetimeDuration] = useState('')
  const [onetimeIcon, setOnetimeIcon] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [descTask, setDescTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (loading) {
    return (
      <div className="day-view-screen">
        <div className="today-loading">
          <span className="text-muted">loading</span>
          <span className="blink-cursor" />
        </div>
      </div>
    )
  }

  if (descTask) {
    const latest = allTasks.find(t => t.id === descTask.id) ?? descTask
    return (
      <TaskDescriptionScreen
        task={latest}
        onSave={async content => { await updateDescription(latest.id, content) }}
        onBack={() => setDescTask(null)}
      />
    )
  }

  if (!plan) {
    if (isToday && onNewDay) {
      return <NoPlanScreen onNewDay={onNewDay} />
    }
    return (
      <div className="day-view-screen">
        <div className="today-loading">
          <span className="text-muted">// no data found</span>
        </div>
      </div>
    )
  }

  const tasks = plan.items.filter((i): i is TaskItem => i.type === 'task')
  const done = tasks.filter(i => i.checked).length
  const total = tasks.length

  const usedTaskIds = new Set(
    tasks
      .filter(t => t.task_id !== null && t.task_id !== undefined)
      .map(t => t.task_id as string)
  )
  const poolAvailable = allTasks.filter(t => !usedTaskIds.has(t.id))

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

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null)
    const { active, over } = event
    if (!over || active.id === over.id || !plan) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const allIds = plan.items.map(i => i.id)
    const oldIdx = allIds.indexOf(activeId)
    const newIdx = allIds.indexOf(overId)
    if (oldIdx === -1 || newIdx === -1) return
    reorderItems(arrayMove(allIds, oldIdx, newIdx))
  }

  function handleDescClick(item: TaskItem) {
    if (!item.task_id) return
    const task = allTasks.find(t => t.id === item.task_id)
    if (task) setDescTask(task)
  }

  const draggingItem = draggingId ? plan.items.find(i => i.id === draggingId) : null

  return (
    <div className="day-view-screen">
      {writeConflict && (
        <div className="day-view-conflict-banner">
          data updated from another device — plan reloaded
        </div>
      )}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={em => { setOnetimeIcon(em); setShowEmojiPicker(false) }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      <header className="day-view-header">
        <div className="day-view-header-row">
          {onBack ? (
            <button className="desc-back" onClick={onBack}>← back</button>
          ) : (
            <OverseerLogo />
          )}
          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'var(--text-section)', pointerEvents: 'none' }}>
            {formatDate(date)}
          </span>
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
          <AsciiProgressBar value={done} total={total} />
        </div>
      </header>

      <div className="today-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={plan.items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {plan.items.map(item => {
              if (item.type === 'separator') {
                const sep = item as SeparatorItem
                const label = sep.label || BLOCK_LABELS[sep.block]
                const mini = label !== BLOCK_LABELS[sep.block]
                return mode === 'edit'
                  ? <SortableSeparator key={sep.id} id={sep.id} label={label} draggable={true} mini={mini} />
                  : mini
                    ? <MiniSeparator key={sep.id} label={label} />
                    : <SectionHeader key={sep.id} label={label} />
              }
              const taskItem = item as TaskItem
              return mode === 'edit'
                ? (
                  <SortableTaskRow
                    key={taskItem.id}
                    item={taskItem}
                    hasDesc={taskItem.task_id ? taskDescIds.has(taskItem.task_id) : false}
                    onToggle={() => toggleItem(taskItem.id)}
                    onDelete={() => removeItem(taskItem.id)}
                    onDescClick={() => handleDescClick(taskItem)}
                  />
                )
                : (
                  <TaskRow
                    key={taskItem.id}
                    item={taskItem}
                    hasDesc={taskItem.task_id ? taskDescIds.has(taskItem.task_id) : false}
                    onToggle={() => toggleItem(taskItem.id)}
                    onDescClick={() => handleDescClick(taskItem)}
                  />
                )
            })}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {draggingItem && (
              <div className="drag-overlay-pulse">
                {draggingItem.type === 'task' ? (
                  <TaskRow
                    item={draggingItem as TaskItem}
                    hasDesc={(draggingItem as TaskItem).task_id ? taskDescIds.has((draggingItem as TaskItem).task_id!) : false}
                    editMode={true}
                    onToggle={() => {}}
                  />
                ) : (() => {
                  const sep = draggingItem as SeparatorItem
                  const label = sep.label || BLOCK_LABELS[sep.block]
                  return label !== BLOCK_LABELS[sep.block]
                    ? <MiniSeparator label={label} />
                    : <SectionHeader label={label} />
                })()}
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {tasks.length === 0 && (
          <div className="today-empty">
            <span className="text-muted">// no tasks added</span>
          </div>
        )}

        {mode === 'edit' && (
          <div className="day-view-edit-section">
            <div className="day-view-edit-label prompt-line">{'>'} add task</div>

            <button
              className="day-view-pool-toggle"
              onClick={() => { setShowAddPool(v => !v); setShowOnetimeForm(false) }}
            >
              {showAddPool ? '// hide pool' : '// + from task pool'}
            </button>

            {showAddPool && (
              <div className="day-view-pool-list">
                {poolAvailable.length === 0 ? (
                  <div className="text-muted day-view-pool-empty">// all tasks already in plan</div>
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
                      {task.duration && <span className="task-duration">{task.duration}m</span>}
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
              {showOnetimeForm ? '// hide form' : '// + one-off task'}
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
                    placeholder="task name"
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

        <NoteArea initialValue={plan.note ?? ''} onSave={saveNote} />
      </div>

      {pendingAdd && (
        <div className="nd-picker-overlay" onClick={() => setPendingAdd(null)}>
          <div className="nd-picker" onClick={e => e.stopPropagation()}>
            <div className="nd-picker-label prompt-line">{'>'} add to block:</div>
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
            <button className="nd-picker-cancel" onClick={() => setPendingAdd(null)}>cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
