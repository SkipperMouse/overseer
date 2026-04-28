import { useState, useCallback } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useTemplates, useTemplateItems } from '../../hooks/useTemplates'
import type { Task, Block } from '../../types'
import { BLOCK_DEFS } from '../../lib/blocks'
import EmojiPicker from './EmojiPicker'
import TaskDescriptionScreen from './TaskDescriptionScreen'
import OverseerLogo from '../ui/OverseerLogo'

function roundDuration(val: string): string {
  const n = Number(val)
  if (!isFinite(n) || n < 0) return '0'
  return String(Math.round(n / 10) * 10)
}

// ── Expanded template: mounts useTemplateItems only when open ─────

function ExpandedTemplate({ templateId, allTasks }: { templateId: string; allTasks: Task[] }) {
  const { items, addTaskItem, deleteItem } = useTemplateItems(templateId)
  const [pickerBlock, setPickerBlock] = useState<Block | null>(null)

  const blockTasks = (block: Block) =>
    items.filter(i => i.type === 'task' && i.block === block).sort((a, b) => a.position - b.position)

  const addedIds = new Set(items.filter(i => i.task_id).map(i => i.task_id as string))
  const available = allTasks.filter(t => !addedIds.has(t.id))

  return (
    <>
      {BLOCK_DEFS.map(({ key, label }) => (
        <div key={key} style={{ background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px 4px 28px', borderTop: '1px solid var(--border-dim)' }}>
            <span style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-section)' }}>{label}</span>
            <button
              onClick={() => setPickerBlock(key)}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontFamily: 'var(--font)', fontSize: 10, letterSpacing: '1px', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)' }}
            >+ add</button>
          </div>

          {blockTasks(key).length === 0 ? (
            <div style={{ padding: '3px 16px 6px 28px', fontSize: 11, color: 'var(--text-dim)' }}>—</div>
          ) : blockTasks(key).map(tItem => (
            <div key={tItem.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 16px 5px 28px', borderTop: '1px solid var(--border-dim)' }}>
              {tItem.task?.icon && (
                <span className="pip-emoji" style={{ fontSize: 12, flexShrink: 0, width: 18, textAlign: 'center', opacity: 0.5 }}>{tItem.task.icon}</span>
              )}
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tItem.task?.title ?? '?'}
              </span>
              {tItem.task?.duration && (
                <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{tItem.task.duration}m</span>
              )}
              <button
                onClick={() => deleteItem(tItem.id)}
                style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--text-dim)', cursor: 'pointer', padding: '0 2px', fontFamily: 'var(--font)', lineHeight: 1 }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)' }}
              >×</button>
            </div>
          ))}
        </div>
      ))}

      {/* Bottom-sheet task picker */}
      {pickerBlock !== null && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setPickerBlock(null)}
        >
          <div
            style={{ width: '100%', maxWidth: 520, margin: '0 auto', maxHeight: '60vh', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-bright)', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border-dim)' }}>
              <span style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-section)' }}>
                add to {pickerBlock}
              </span>
              <button onClick={() => setPickerBlock(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {available.length === 0 ? (
                <div style={{ padding: 16, fontSize: 11, color: 'var(--text-muted)' }}>// all tasks added</div>
              ) : available.map(task => {
                const block = pickerBlock
                return (
                  <button
                    key={task.id}
                    onClick={() => { addTaskItem(block, task.id); setPickerBlock(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-dim)', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  >
                    {task.icon && <span className="pip-emoji" style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{task.icon}</span>}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    {task.duration && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{task.duration}m</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main screen ───────────────────────────────────────────────────

export default function TaskPoolScreen() {
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, createDescription, updateDescription } = useTasks()
  const { templates, loading: templatesLoading, createTemplate, deleteTemplate } = useTemplates()

  const [tab, setTab] = useState<'tasks' | 'templates'>('tasks')
  const [adding, setAdding] = useState(false)

  // Tasks
  const [searchQuery, setSearchQuery] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDuration, setNewDuration] = useState('0')
  const [newIcon, setNewIcon] = useState('')
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [descTask, setDescTask] = useState<Task | null>(null)

  // Templates
  const [newTmplName, setNewTmplName] = useState('')
  const [expandedTpl, setExpandedTpl] = useState<string | null>(null)
  const [tmplDelConfirmId, setTmplDelConfirmId] = useState<string | null>(null)

  function switchTab(t: 'tasks' | 'templates') {
    setTab(t)
    setAdding(false)
    setSearchQuery('')
    setExpandedTpl(null)
    setTmplDelConfirmId(null)
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const dur = roundDuration(newDuration)
    await createTask(newTitle.trim(), dur !== '0' ? dur : undefined, newIcon || undefined)
    setNewTitle(''); setNewDuration('0'); setNewIcon(''); setAdding(false)
  }

  async function handleCreateTemplate() {
    const name = newTmplName.trim()
    if (!name) return
    const result = await createTemplate(name)
    if (result) { setNewTmplName(''); setAdding(false) }
  }

  async function handleAddDesc(task: Task) {
    const desc = await createDescription(task.id)
    if (desc) setDescTask({ ...task, description: desc })
  }

  function handleOpenDesc(task: Task) {
    setDescTask(tasks.find(t => t.id === task.id) ?? task)
  }

  async function handleDescSave(content: string) {
    if (!descTask) return
    await updateDescription(descTask.id, content)
  }

  if (descTask) {
    const latest = tasks.find(t => t.id === descTask.id) ?? descTask
    return <TaskDescriptionScreen task={latest} onSave={handleDescSave} onBack={() => setDescTask(null)} />
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, background: 'transparent', border: 'none',
    borderBottom: `1px solid ${active ? 'var(--accent)' : 'var(--border-dim)'}`,
    color: active ? 'var(--accent)' : 'var(--text-dim)',
    fontFamily: 'var(--font)', fontSize: 9, letterSpacing: '2px',
    textTransform: 'uppercase', padding: '7px 0', cursor: 'pointer',
    textShadow: active ? '0 0 6px #00ff4166' : 'none',
  })

  const filtered = searchQuery.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks

  return (
    <div className="pool-screen">
      {pickerFor !== null && (
        <EmojiPicker
          onSelect={em => {
            if (pickerFor === 'new') setNewIcon(em)
            else updateTask(pickerFor, { icon: em })
          }}
          onClose={() => setPickerFor(null)}
        />
      )}

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '16px 16px 0', borderBottom: '1px solid var(--border-dim)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, position: 'relative' }}>
          <OverseerLogo />
          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-section)', pointerEvents: 'none' }}>POOL</span>
          <button
            onClick={() => setAdding(a => !a)}
            style={{ background: 'transparent', border: '1px solid var(--border-bright)', color: 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 10, letterSpacing: '1px', padding: '3px 8px', cursor: 'pointer', borderRadius: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-bright)' }}
          >
            {adding ? '× cancel' : '+ add'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          <button style={tabStyle(tab === 'tasks')} onClick={() => switchTab('tasks')}>Tasks</button>
          <button style={tabStyle(tab === 'templates')} onClick={() => switchTab('templates')}>Templates</button>
        </div>
      </div>

      {/* ── Tasks tab ── */}
      {tab === 'tasks' && (
        <>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderBottom: '1px solid var(--border-dim)' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>&gt;</span>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-mid)', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 12, padding: '3px 2px', outline: 'none' }}
              placeholder="search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 14, cursor: 'pointer', padding: '0 4px' }}>×</button>
            )}
          </div>

          {adding && (
            <form onSubmit={handleCreateTask} style={{ flexShrink: 0, borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
                <button
                  type="button"
                  className="pool-icon-field"
                  onClick={() => setPickerFor(pickerFor === 'new' ? null : 'new')}
                  title="pick icon"
                >
                  {newIcon ? <span className="pip-emoji">{newIcon}</span> : <span className="text-dim">∅</span>}
                </button>
                <input
                  className="pool-input pool-input-title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="task title"
                  autoFocus
                />
                <input
                  className="pool-input pool-input-dur"
                  type="number" min="0" step="10"
                  value={newDuration}
                  onChange={e => setNewDuration(e.target.value)}
                  onBlur={e => setNewDuration(roundDuration(e.target.value))}
                  placeholder="0"
                />
                <button
                  type="submit"
                  style={{ background: 'none', border: 'none', color: newTitle ? 'var(--accent)' : 'var(--text-dim)', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: '0 2px', fontFamily: 'var(--font)' }}
                >+</button>
              </div>
            </form>
          )}

          <div className="pool-list">
            {tasksLoading ? (
              <div className="pool-loading"><span className="text-muted">loading</span><span className="blink-cursor" /></div>
            ) : filtered.length === 0 ? (
              <div className="pool-empty"><span className="text-muted">// {searchQuery ? 'no matches' : 'pool empty'}</span></div>
            ) : filtered.map(task => (
              <PoolTaskRow
                key={task.id}
                task={task}
                pickerFor={pickerFor}
                setPickerFor={setPickerFor}
                updateTask={updateTask}
                deleteTask={deleteTask}
                handleOpenDesc={handleOpenDesc}
                handleAddDesc={handleAddDesc}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Templates tab ── */}
      {tab === 'templates' && (
        <>
          {adding && (
            <div style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  className="pool-input pool-input-title"
                  value={newTmplName}
                  onChange={e => setNewTmplName(e.target.value)}
                  placeholder="template name"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateTemplate()
                    if (e.key === 'Escape') { setAdding(false); setNewTmplName('') }
                  }}
                />
                <button
                  onClick={handleCreateTemplate}
                  style={{ background: 'none', border: 'none', color: newTmplName ? 'var(--accent)' : 'var(--text-dim)', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: '0 2px', fontFamily: 'var(--font)' }}
                >+</button>
              </div>
            </div>
          )}

          <div className="pool-list">
            {templatesLoading ? (
              <div className="pool-loading"><span className="text-muted">loading</span><span className="blink-cursor" /></div>
            ) : templates.length === 0 ? (
              <div className="pool-empty"><span className="text-muted">// no templates</span></div>
            ) : templates.map(tpl => {
              const isOpen = expandedTpl === tpl.id
              const isConfirming = tmplDelConfirmId === tpl.id
              return (
                <div key={tpl.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    onClick={() => setExpandedTpl(isOpen ? null : tpl.id)}
                  >
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', flexShrink: 0, width: 10 }}>{isOpen ? '▾' : '▸'}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{tpl.name}</span>
                    {isConfirming ? (
                      <button
                        className="pool-del-btn pool-del-confirm"
                        autoFocus
                        onClick={e => { e.stopPropagation(); deleteTemplate(tpl.id); setTmplDelConfirmId(null) }}
                        onBlur={() => setTmplDelConfirmId(null)}
                      >delete?</button>
                    ) : (
                      <button
                        className="pool-del-btn"
                        onClick={e => { e.stopPropagation(); setTmplDelConfirmId(tpl.id) }}
                      >×</button>
                    )}
                  </div>
                  {isOpen && <ExpandedTemplate templateId={tpl.id} allTasks={tasks} />}
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="pool-version">[ v{__APP_VERSION__} ]</div>
    </div>
  )
}

// ── Pool task row (inline edit) ───────────────────────────────────

interface PoolTaskRowProps {
  task: Task
  pickerFor: string | null
  setPickerFor: (id: string | null) => void
  updateTask: (id: string, fields: Partial<{ title: string; duration: string | undefined; icon: string | undefined }>) => void
  deleteTask: (id: string) => void
  handleOpenDesc: (task: Task) => void
  handleAddDesc: (task: Task) => void
}

function PoolTaskRow({ task, pickerFor, setPickerFor, updateTask, deleteTask, handleOpenDesc, handleAddDesc }: PoolTaskRowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDur, setIsEditingDur] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const openTitle = useCallback(() => { setIsEditingTitle(true); setIsEditingDur(false) }, [])
  const openDur = useCallback(() => { setIsEditingDur(true); setIsEditingTitle(false) }, [])

  return (
    <div className="pool-item">
      <button
        className="pool-item-icon"
        onClick={() => setPickerFor(pickerFor === task.id ? null : task.id)}
        title="change icon"
      >
        {task.icon ? <span className="pip-emoji">{task.icon}</span> : <span className="text-dim">∅</span>}
      </button>

      {isEditingTitle ? (
        <input
          className="pool-input pool-input-title"
          defaultValue={task.title}
          autoFocus
          onBlur={e => {
            const val = e.target.value.trim()
            if (val && val !== task.title) updateTask(task.id, { title: val })
            setIsEditingTitle(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setIsEditingTitle(false)
          }}
        />
      ) : (
        <span className="pool-item-title" onClick={openTitle} title="edit">{task.title}</span>
      )}

      {isEditingDur ? (
        <input
          className="pool-input pool-input-dur"
          type="number" min="0" step="10"
          defaultValue={task.duration ?? '0'}
          autoFocus
          onBlur={e => {
            const rounded = String(Math.round(Number(e.target.value || '0') / 10) * 10)
            updateTask(task.id, { duration: rounded !== '0' ? rounded : undefined })
            setIsEditingDur(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') setIsEditingDur(false)
          }}
        />
      ) : (
        <span className="pool-item-dur" onClick={openDur} title="edit">
          {task.duration ? task.duration + 'm' : <span className="text-dim">--</span>}
        </span>
      )}

      {task.description ? (
        <button className="pool-desc-btn has-desc" onClick={() => handleOpenDesc(task)} title="open description">¶</button>
      ) : (
        <button className="pool-desc-btn no-desc" onClick={() => handleAddDesc(task)} title="add description">+doc</button>
      )}

      {isConfirmingDelete ? (
        <button
          className="pool-del-btn pool-del-confirm"
          autoFocus
          onClick={() => { deleteTask(task.id); setIsConfirmingDelete(false) }}
          onBlur={() => setIsConfirmingDelete(false)}
        >sure?</button>
      ) : (
        <button className="pool-del-btn" onClick={() => setIsConfirmingDelete(true)}>×</button>
      )}
    </div>
  )
}
