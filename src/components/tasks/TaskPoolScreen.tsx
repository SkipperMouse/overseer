import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useTemplates } from '../../hooks/useTemplates'
import type { Task, Template } from '../../types'
import EmojiPicker from './EmojiPicker'
import TaskDescriptionScreen from './TaskDescriptionScreen'
import TemplateEditScreen from '../templates/TemplateEditScreen'

function roundDuration(val: string): string {
  const n = Number(val)
  if (!isFinite(n) || n < 0) return '0'
  return String(Math.round(n / 10) * 10)
}

export default function TaskPoolScreen() {
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, createDescription, updateDescription } =
    useTasks()
  const { templates, loading: templatesLoading, createTemplate, deleteTemplate } = useTemplates()

  // ── Template state ──────────────────────────────────────────────────────────
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showTmplForm, setShowTmplForm] = useState(false)
  const [newTmplName, setNewTmplName] = useState('')
  const [tmplDelConfirmId, setTmplDelConfirmId] = useState<string | null>(null)

  // ── Pool state ──────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDuration, setNewDuration] = useState('0')
  const [newIcon, setNewIcon] = useState('')
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [editTitleId, setEditTitleId] = useState<string | null>(null)
  const [editDurId, setEditDurId] = useState<string | null>(null)
  const [delConfirmId, setDelConfirmId] = useState<string | null>(null)
  const [descTask, setDescTask] = useState<Task | null>(null)

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')

  // ── Template editing: full-screen ───────────────────────────────────────────
  if (editingTemplate) {
    return <TemplateEditScreen template={editingTemplate} onBack={() => setEditingTemplate(null)} />
  }

  // ── Description screen ──────────────────────────────────────────────────────
  function resetForm() {
    setNewTitle('')
    setNewDuration('0')
    setNewIcon('')
    setShowForm(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const dur = roundDuration(newDuration)
    await createTask(
      newTitle.trim(),
      dur !== '0' ? dur : undefined,
      newIcon || undefined,
    )
    resetForm()
  }

  async function handleAddDesc(task: Task) {
    const desc = await createDescription(task.id)
    if (desc) setDescTask({ ...task, description: desc })
  }

  function handleOpenDesc(task: Task) {
    const latest = tasks.find(t => t.id === task.id) ?? task
    setDescTask(latest)
  }

  async function handleDescSave(content: string) {
    if (!descTask) return
    await updateDescription(descTask.id, content)
  }

  if (tasksLoading && templatesLoading) {
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

  // ── Search filtering ─────────────────────────────────────────────────────────
  const isSearching = searchQuery.trim().length > 0
  const filteredTemplates = isSearching
    ? templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : templates
  const filteredTasks = isSearching
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks

  async function handleCreateTemplate() {
    const name = newTmplName.trim()
    if (!name) return
    const result = await createTemplate(name)
    if (result) {
      setNewTmplName('')
      setShowTmplForm(false)
    }
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

      {/* Global search */}
      <div className="pool-search-row">
        <input
          className="pool-input pool-search"
          placeholder="search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {isSearching && (
          <button className="pool-search-clear" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      {isSearching ? (
        /* ── Search results view ── */
        <div className="pool-list">
          <div className="section-header">
            <span className="label-section">[ templates ]</span>
          </div>
          {filteredTemplates.length === 0 ? (
            <div className="pool-empty"><span className="text-muted">// нет совпадений</span></div>
          ) : filteredTemplates.map(tmpl => (
            <div key={tmpl.id} className="tmpl-item">
              <button className="tmpl-item-name" onClick={() => { setSearchQuery(''); setEditingTemplate(tmpl) }}>
                {tmpl.name}
              </button>
              {tmplDelConfirmId === tmpl.id ? (
                <button
                  className="pool-del-btn pool-del-confirm"
                  autoFocus
                  onClick={() => { deleteTemplate(tmpl.id); setTmplDelConfirmId(null) }}
                  onBlur={() => setTmplDelConfirmId(null)}
                >удалить?</button>
              ) : (
                <button className="pool-del-btn" onClick={() => setTmplDelConfirmId(tmpl.id)}>×</button>
              )}
            </div>
          ))}

          <div className="section-header">
            <span className="label-section">[ task pool ]</span>
          </div>
          {filteredTasks.length === 0 ? (
            <div className="pool-empty"><span className="text-muted">// нет совпадений</span></div>
          ) : filteredTasks.map(task => (
            <PoolTaskRow
              key={task.id}
              task={task}
              editTitleId={editTitleId}
              editDurId={editDurId}
              delConfirmId={delConfirmId}
              pickerFor={pickerFor}
              setEditTitleId={setEditTitleId}
              setEditDurId={setEditDurId}
              setDelConfirmId={setDelConfirmId}
              setPickerFor={setPickerFor}
              updateTask={updateTask}
              deleteTask={deleteTask}
              handleOpenDesc={handleOpenDesc}
              handleAddDesc={handleAddDesc}
            />
          ))}
        </div>
      ) : (
        /* ── Normal view ── */
        <div className="pool-list">
          {/* Templates section */}
          <div className="pool-section-header">
            <span className="label-section">[ templates ]</span>
            <button
              className="pool-add-btn"
              onClick={() => { setShowTmplForm(v => !v) }}
            >
              {showTmplForm ? '× отмена' : '+ шаблон'}
            </button>
          </div>

          {showTmplForm && (
            <div className="pool-new-form">
              <div className="pool-new-row">
                <input
                  className="pool-input pool-input-title"
                  autoFocus
                  placeholder="название шаблона..."
                  value={newTmplName}
                  onChange={e => setNewTmplName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateTemplate()
                    if (e.key === 'Escape') { setShowTmplForm(false); setNewTmplName('') }
                  }}
                />
                <button
                  className="pool-save-btn"
                  disabled={!newTmplName.trim()}
                  onClick={handleCreateTemplate}
                >↵</button>
              </div>
            </div>
          )}

          {templatesLoading ? (
            <div className="pool-loading">
              <span className="text-muted">загрузка</span>
              <span className="blink-cursor" />
            </div>
          ) : templates.length === 0 && !showTmplForm ? (
            <div className="pool-empty">
              <span className="text-muted">// шаблонов нет</span>
            </div>
          ) : templates.map(tmpl => (
            <div key={tmpl.id} className="tmpl-item">
              <button className="tmpl-item-name" onClick={() => setEditingTemplate(tmpl)}>
                {tmpl.name}
              </button>
              {tmplDelConfirmId === tmpl.id ? (
                <button
                  className="pool-del-btn pool-del-confirm"
                  autoFocus
                  onClick={() => { deleteTemplate(tmpl.id); setTmplDelConfirmId(null) }}
                  onBlur={() => setTmplDelConfirmId(null)}
                >удалить?</button>
              ) : (
                <button className="pool-del-btn" onClick={() => setTmplDelConfirmId(tmpl.id)}>×</button>
              )}
            </div>
          ))}

          {/* Task pool section */}
          <div className="pool-section-header">
            <span className="label-section">[ task pool ]</span>
            <button
              className="pool-add-btn"
              onClick={() => { setShowForm(v => !v); setPickerFor(null) }}
            >
              {showForm ? '× отмена' : '+ задача'}
            </button>
          </div>

          {showForm && (
            <form className="pool-new-form" onSubmit={handleCreate}>
              <div className="pool-new-row">
                <button
                  type="button"
                  className="pool-icon-field"
                  onClick={() => setPickerFor(pickerFor === 'new' ? null : 'new')}
                  title="выбрать иконку"
                >
                  {newIcon ? <span className="pip-emoji">{newIcon}</span> : <span className="text-dim">∅</span>}
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
                  type="number"
                  min="0"
                  step="10"
                  value={newDuration}
                  onChange={e => setNewDuration(e.target.value)}
                  onBlur={e => setNewDuration(roundDuration(e.target.value))}
                  placeholder="0"
                />
                <button type="submit" className="pool-save-btn" disabled={!newTitle.trim()}>
                  +
                </button>
              </div>
            </form>
          )}

          {tasksLoading ? (
            <div className="pool-loading">
              <span className="text-muted">загрузка</span>
              <span className="blink-cursor" />
            </div>
          ) : tasks.length === 0 && !showForm ? (
            <div className="pool-empty">
              <span className="text-muted">// пул пуст</span>
            </div>
          ) : null}

          {filteredTasks.map(task => (
            <PoolTaskRow
              key={task.id}
              task={task}
              editTitleId={editTitleId}
              editDurId={editDurId}
              delConfirmId={delConfirmId}
              pickerFor={pickerFor}
              setEditTitleId={setEditTitleId}
              setEditDurId={setEditDurId}
              setDelConfirmId={setDelConfirmId}
              setPickerFor={setPickerFor}
              updateTask={updateTask}
              deleteTask={deleteTask}
              handleOpenDesc={handleOpenDesc}
              handleAddDesc={handleAddDesc}
            />
          ))}
        </div>
      )}
      <div className="pool-version">[ v{__APP_VERSION__} ]</div>
    </div>
  )
}

interface PoolTaskRowProps {
  task: Task
  editTitleId: string | null
  editDurId: string | null
  delConfirmId: string | null
  pickerFor: string | null
  setEditTitleId: (id: string | null) => void
  setEditDurId: (id: string | null) => void
  setDelConfirmId: (id: string | null) => void
  setPickerFor: (id: string | null) => void
  updateTask: (id: string, fields: Partial<{ title: string; duration: string | undefined; icon: string | undefined }>) => void
  deleteTask: (id: string) => void
  handleOpenDesc: (task: Task) => void
  handleAddDesc: (task: Task) => void
}

function PoolTaskRow({
  task, editTitleId, editDurId, delConfirmId, pickerFor,
  setEditTitleId, setEditDurId, setDelConfirmId, setPickerFor,
  updateTask, deleteTask, handleOpenDesc, handleAddDesc,
}: PoolTaskRowProps) {
  return (
    <div className="pool-item">
      {/* Icon */}
      <button
        className="pool-item-icon"
        onClick={() => setPickerFor(pickerFor === task.id ? null : task.id)}
        title="изменить иконку"
      >
        {task.icon ? <span className="pip-emoji">{task.icon}</span> : <span className="text-dim">∅</span>}
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
          type="number"
          min="0"
          step="10"
          defaultValue={task.duration ?? '0'}
          autoFocus
          onBlur={e => {
            const rounded = String(Math.round(Number(e.target.value || '0') / 10) * 10)
            updateTask(task.id, { duration: rounded !== '0' ? rounded : undefined })
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
          {task.duration ? task.duration + 'm' : <span className="text-dim">--</span>}
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
  )
}
