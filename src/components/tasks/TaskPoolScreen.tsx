import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import type { Task } from '../../types'
import EmojiPicker from './EmojiPicker'
import TaskDescriptionScreen from './TaskDescriptionScreen'

export default function TaskPoolScreen() {
  const { tasks, loading, createTask, updateTask, deleteTask, createDescription, updateDescription } =
    useTasks()

  // New task form
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newIcon, setNewIcon] = useState('')

  // Which emoji picker is open: 'new' | task.id | null
  const [pickerFor, setPickerFor] = useState<string | null>(null)

  // Inline editing
  const [editTitleId, setEditTitleId] = useState<string | null>(null)
  const [editDurId, setEditDurId] = useState<string | null>(null)

  // Delete confirm
  const [delConfirmId, setDelConfirmId] = useState<string | null>(null)

  // Description screen
  const [descTask, setDescTask] = useState<Task | null>(null)

  function resetForm() {
    setNewTitle('')
    setNewDuration('')
    setNewIcon('')
    setShowForm(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    await createTask(
      newTitle.trim(),
      newDuration.trim() || undefined,
      newIcon || undefined,
    )
    resetForm()
  }

  async function handleAddDesc(task: Task) {
    const desc = await createDescription(task.id)
    if (desc) setDescTask({ ...task, description: desc })
  }

  function handleOpenDesc(task: Task) {
    // use latest version from tasks list
    const latest = tasks.find(t => t.id === task.id) ?? task
    setDescTask(latest)
  }

  async function handleDescSave(content: string) {
    if (!descTask) return
    await updateDescription(descTask.id, content)
  }

  if (loading) {
    return (
      <div className="pool-screen">
        <div className="pool-loading">
          <span className="text-muted">загрузка</span>
          <span className="blink-cursor" />
        </div>
      </div>
    )
  }

  if (descTask) {
    const latest = tasks.find(t => t.id === descTask.id) ?? descTask
    return (
      <TaskDescriptionScreen
        task={latest}
        onSave={handleDescSave}
        onBack={() => setDescTask(null)}
      />
    )
  }

  return (
    <div className="pool-screen">
      {pickerFor !== null && (
        <EmojiPicker
          onSelect={em => {
            if (pickerFor === 'new') {
              setNewIcon(em)
            } else {
              updateTask(pickerFor, { icon: em })
            }
          }}
          onClose={() => setPickerFor(null)}
        />
      )}

      <header className="pool-header">
        <span className="label-section">[ pool ]</span>
        <button
          className="pool-add-btn"
          onClick={() => { setShowForm(v => !v); setPickerFor(null) }}
        >
          {showForm ? '× отмена' : '+ задача'}
        </button>
      </header>

      {showForm && (
        <form className="pool-new-form" onSubmit={handleCreate}>
          <div className="pool-new-row">
            <button
              type="button"
              className="pool-icon-field"
              onClick={() => setPickerFor(pickerFor === 'new' ? null : 'new')}
              title="выбрать иконку"
            >
              {newIcon ? newIcon : <span className="text-dim">∅</span>}
            </button>
            <input
              className="pool-input pool-input-title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="название задачи"
              autoFocus
            />
            <input
              className="pool-input pool-input-dur"
              value={newDuration}
              onChange={e => setNewDuration(e.target.value)}
              placeholder="30m"
            />
            <button type="submit" className="pool-save-btn" disabled={!newTitle.trim()}>
              +
            </button>
          </div>
        </form>
      )}

      <div className="pool-list">
        {tasks.length === 0 && (
          <div className="pool-empty">
            <span className="text-muted">// пул пуст</span>
          </div>
        )}

        {tasks.map(task => (
          <div key={task.id} className="pool-item">
            {/* Icon */}
            <button
              className="pool-item-icon"
              onClick={() => setPickerFor(pickerFor === task.id ? null : task.id)}
              title="изменить иконку"
            >
              {task.icon || <span className="text-dim">∅</span>}
            </button>

            {/* Title — inline edit */}
            {editTitleId === task.id ? (
              <input
                className="pool-input pool-input-title"
                defaultValue={task.title}
                autoFocus
                onBlur={e => {
                  const val = e.target.value.trim()
                  if (val && val !== task.title) updateTask(task.id, { title: val })
                  setEditTitleId(null)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditTitleId(null)
                }}
              />
            ) : (
              <span
                className="pool-item-title"
                onClick={() => { setEditTitleId(task.id); setEditDurId(null) }}
                title="редактировать"
              >
                {task.title}
              </span>
            )}

            {/* Duration — inline edit */}
            {editDurId === task.id ? (
              <input
                className="pool-input pool-input-dur"
                defaultValue={task.duration ?? ''}
                autoFocus
                onBlur={e => {
                  const val = e.target.value.trim()
                  updateTask(task.id, { duration: val || undefined })
                  setEditDurId(null)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditDurId(null)
                }}
              />
            ) : (
              <span
                className="pool-item-dur"
                onClick={() => { setEditDurId(task.id); setEditTitleId(null) }}
                title="редактировать"
              >
                {task.duration || <span className="text-dim">--</span>}
              </span>
            )}

            {/* Description indicator */}
            {task.description ? (
              <button
                className="pool-desc-btn has-desc"
                onClick={() => handleOpenDesc(task)}
                title="открыть описание"
              >
                ¶
              </button>
            ) : (
              <button
                className="pool-desc-btn no-desc"
                onClick={() => handleAddDesc(task)}
                title="добавить описание"
              >
                +doc
              </button>
            )}

            {/* Delete */}
            {delConfirmId === task.id ? (
              <button
                className="pool-del-btn pool-del-confirm"
                autoFocus
                onClick={() => { deleteTask(task.id); setDelConfirmId(null) }}
                onBlur={() => setDelConfirmId(null)}
              >
                sure?
              </button>
            ) : (
              <button
                className="pool-del-btn"
                onClick={() => setDelConfirmId(task.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
