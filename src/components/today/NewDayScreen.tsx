import { useState, useEffect } from 'react'
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'
import { supabase } from '../../lib/supabase'
import type { Template, Task, Block } from '../../types'
import SectionHeader from './SectionHeader'
import EmojiPicker from '../tasks/EmojiPicker'

function todayDate() {
  return new Date().toLocaleDateString('en-CA')
}

const BLOCKS: Block[] = ['morning', 'day', 'evening']

const BLOCK_LABELS: Record<Block, string> = {
  morning: '[ утро ]',
  day: '[ работа ]',
  evening: '[ вечер ]',
}

interface DraftTaskItem {
  id: string
  type: 'task'
  taskId: string | null  // null = разовая задача
  title: string
  duration?: string
  icon?: string
  block: Block
}

interface DraftSepItem {
  id: string
  type: 'separator'
  label: string
  block: Block
}

type DraftItem = DraftTaskItem | DraftSepItem

type PendingForBlock =
  | { kind: 'pool'; task: Task }
  | { kind: 'onetime'; title: string; duration?: string; icon?: string }

function defaultSeparators(): DraftSepItem[] {
  return BLOCKS.map(block => ({
    id: crypto.randomUUID(),
    type: 'separator' as const,
    label: BLOCK_LABELS[block],
    block,
  }))
}

interface RawTaskRow {
  id: string
  title: string
  duration: string | null
  icon: string | null
  created_at: string
}

interface RawTemplateItemRow {
  id: string
  template_id: string
  task_id: string | null
  type: 'task' | 'separator'
  separator_label: string | null
  block: Block
  position: number
}

interface Props {
  onDone: () => void
}

type Step = 'loading' | 'exists' | 'pick-template' | 'build-plan'

function SortableDraftRow({ item, onDelete }: { item: DraftTaskItem; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`task-row${isDragging ? ' dragging' : ''}`}
    >
      <span
        className="drag-grip"
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
      >
        ⠿
      </span>
      {item.icon
        ? <span className="task-icon pip-emoji">{item.icon}</span>
        : <span className="task-icon" />
      }
      <span className="task-title">{item.title}</span>
      {item.duration && <span className="task-duration">{item.duration}</span>}
      {item.taskId === null && <span className="nd-onetime-badge">разовая</span>}
      <button className="pool-del-btn" onClick={() => onDelete()}>×</button>
    </div>
  )
}

export default function NewDayScreen({ onDone }: Props) {
  const [step, setStep] = useState<Step>('loading')
  const [templates, setTemplates] = useState<Template[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [pendingForBlock, setPendingForBlock] = useState<PendingForBlock | null>(null)
  const [saving, setSaving] = useState(false)

  // One-off task form
  const [showOnetimeForm, setShowOnetimeForm] = useState(false)
  const [onetimeTitle, setOnetimeTitle] = useState('')
  const [onetimeDuration, setOnetimeDuration] = useState('')
  const [onetimeIcon, setOnetimeIcon] = useState('')
  const [showOnetimePicker, setShowOnetimePicker] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    Promise.all([
      supabase.from('day_plans').select('id').eq('date', todayDate()).maybeSingle(),
      supabase.from('templates').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
    ]).then(([planRes, tmplRes, tasksRes]) => {
      if (planRes.data) {
        setStep('exists')
        return
      }
      setTemplates((tmplRes.data ?? []) as Template[])
      setAllTasks(
        ((tasksRes.data ?? []) as RawTaskRow[]).map(r => ({
          id: r.id,
          title: r.title,
          duration: r.duration ?? undefined,
          icon: r.icon ?? undefined,
          created_at: r.created_at,
        }))
      )
      setStep('pick-template')
    })
  }, [])

  async function selectTemplate(tmplId: string | null) {
    if (tmplId === null) {
      setDraftItems(defaultSeparators())
      setStep('build-plan')
      return
    }

    const { data } = await supabase
      .from('template_items')
      .select('*')
      .eq('template_id', tmplId)
      .order('position', { ascending: true })

    const rows = (data ?? []) as RawTemplateItemRow[]
    const taskMap = new Map(allTasks.map(t => [t.id, t]))
    const items: DraftItem[] = []

    for (const block of BLOCKS) {
      items.push({
        id: crypto.randomUUID(),
        type: 'separator',
        label: BLOCK_LABELS[block],
        block,
      })
      const blockTasks = rows
        .filter(r => r.block === block && r.type === 'task' && r.task_id)
        .sort((a, b) => a.position - b.position)
      for (const row of blockTasks) {
        const task = taskMap.get(row.task_id!)
        if (!task) continue
        items.push({
          id: crypto.randomUUID(),
          type: 'task',
          taskId: task.id,
          title: task.title,
          duration: task.duration,
          icon: task.icon,
          block,
        })
      }
    }

    setDraftItems(items)
    setStep('build-plan')
  }

  function addToBlock(block: Block) {
    if (!pendingForBlock) return
    const newItem: DraftTaskItem = pendingForBlock.kind === 'pool'
      ? {
          id: crypto.randomUUID(),
          type: 'task',
          taskId: pendingForBlock.task.id,
          title: pendingForBlock.task.title,
          duration: pendingForBlock.task.duration,
          icon: pendingForBlock.task.icon,
          block,
        }
      : {
          id: crypto.randomUUID(),
          type: 'task',
          taskId: null,
          title: pendingForBlock.title,
          duration: pendingForBlock.duration,
          icon: pendingForBlock.icon,
          block,
        }
    setDraftItems(prev => {
      let insertIdx = prev.length
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].block === block) { insertIdx = i + 1; break }
      }
      const items = [...prev]
      items.splice(insertIdx, 0, newItem)
      return items
    })
    setPendingForBlock(null)
  }

  function submitOnetimeForm() {
    if (!onetimeTitle.trim()) return
    setPendingForBlock({
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

  function removeFromDraft(id: string) {
    setDraftItems(prev => prev.filter(i => i.id !== id))
  }

  function handleDraftDragEnd(block: Block, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const blockTasks = draftItems.filter((i): i is DraftTaskItem => i.type === 'task' && i.block === block)
    const oldIdx = blockTasks.findIndex(i => i.id === active.id)
    const newIdx = blockTasks.findIndex(i => i.id === over.id)
    const reordered = arrayMove(blockTasks, oldIdx, newIdx)
    setDraftItems(prev => {
      let taskIdx = 0
      return prev.map(item =>
        item.type === 'task' && item.block === block ? reordered[taskIdx++] : item
      )
    })
  }

  async function save() {
    setSaving(true)
    const posCounters: Record<Block, number> = { morning: 0, day: 0, evening: 0 }
    const finalItems = draftItems.map(item => {
      if (item.type === 'separator') {
        return { id: crypto.randomUUID(), type: 'separator' as const, label: item.label, block: item.block }
      }
      const position = posCounters[item.block]++
      return {
        id: crypto.randomUUID(),
        type: 'task' as const,
        task_id: item.taskId ?? null,
        title: item.title,
        duration: item.duration,
        icon: item.icon,
        block: item.block,
        time: null,
        checked: false,
        position,
      }
    })

    const { error } = await supabase
      .from('day_plans')
      .insert({ date: todayDate(), items: finalItems, note: '' })

    setSaving(false)
    if (error) { console.error(error); return }
    onDone()
  }

  const usedTaskIds = new Set(
    draftItems
      .filter((i): i is DraftTaskItem => i.type === 'task' && i.taskId !== null)
      .map(i => i.taskId as string)
  )
  const poolTasks = allTasks.filter(t => !usedTaskIds.has(t.id))

  if (step === 'loading') {
    return (
      <div className="new-day-screen">
        <div className="nd-loading">
          <span className="text-muted">загрузка</span>
          <span className="blink-cursor" />
        </div>
      </div>
    )
  }

  if (step === 'exists') {
    return (
      <div className="new-day-screen">
        <div className="nd-exists">
          <span className="label-section">план на сегодня уже создан</span>
          <button className="pool-tag nd-goto-btn" onClick={onDone}>
            перейти на сегодня
          </button>
        </div>
      </div>
    )
  }

  if (step === 'pick-template') {
    return (
      <div className="new-day-screen">
        <header className="nd-header">
          <span className="label-section nd-header-title">новый день</span>
        </header>
        <div className="nd-template-list">
          <div className="prompt-line nd-pick-prompt">{'>'} выбери шаблон</div>
          <button className="nd-tmpl-item nd-tmpl-no-tmpl" onClick={() => selectTemplate(null)}>
            <span className="nd-tmpl-name">без шаблона</span>
            <span className="text-muted">// только разделители блоков</span>
          </button>
          {templates.map(tmpl => (
            <button key={tmpl.id} className="nd-tmpl-item" onClick={() => selectTemplate(tmpl.id)}>
              <span className="nd-tmpl-name">{tmpl.name}</span>
            </button>
          ))}
          {templates.length === 0 && (
            <div className="nd-tmpl-none text-muted">// нет сохранённых шаблонов</div>
          )}
        </div>
      </div>
    )
  }

  // step === 'build-plan'
  return (
    <div className="new-day-screen">
      {showOnetimePicker && (
        <EmojiPicker
          onSelect={em => { setOnetimeIcon(em); setShowOnetimePicker(false) }}
          onClose={() => setShowOnetimePicker(false)}
        />
      )}

      <header className="nd-header">
        <button className="desc-back" onClick={() => setStep('pick-template')}>← назад</button>
        <span className="label-section nd-header-title">компоновка плана</span>
      </header>

      <div className="nd-build-content">
        {BLOCKS.map(block => {
          const blockTasks = draftItems.filter((i): i is DraftTaskItem => i.type === 'task' && i.block === block)
          return (
            <div key={block} className="nd-block">
              <SectionHeader label={BLOCK_LABELS[block]} />
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={e => handleDraftDragEnd(block, e)}
              >
                <SortableContext items={blockTasks.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {blockTasks.map(item => (
                    <SortableDraftRow
                      key={item.id}
                      item={item}
                      onDelete={() => removeFromDraft(item.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {blockTasks.length === 0 && (
                <div className="nd-block-empty text-muted">// пусто</div>
              )}
            </div>
          )
        })}

        <div className="nd-pool-section">
          <div className="nd-pool-label">{'// task pool'}</div>

          {poolTasks.map(task => (
            <button
              key={task.id}
              className="nd-pool-item"
              onClick={() => setPendingForBlock({ kind: 'pool', task })}
            >
              {task.icon
                ? <span className="task-icon pip-emoji">{task.icon}</span>
                : <span className="task-icon" />
              }
              <span className="nd-pool-title">{task.title}</span>
              {task.duration && <span className="task-duration">{task.duration}</span>}
              <span className="nd-pool-plus">+</span>
            </button>
          ))}

          {poolTasks.length === 0 && !showOnetimeForm && (
            <div className="nd-pool-empty text-muted">// все задачи из пула уже в плане</div>
          )}

          {showOnetimeForm ? (
            <div className="nd-onetime-form">
              <div className="nd-onetime-row">
                <button
                  type="button"
                  className="pool-icon-field"
                  onClick={() => setShowOnetimePicker(v => !v)}
                  title="выбрать иконку"
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
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <button
              className="nd-onetime-btn"
              onClick={() => setShowOnetimeForm(true)}
            >
              {'// + разовая задача'}
            </button>
          )}
        </div>

        <div className="nd-save-area">
          <button className="nd-start-btn" disabled={saving} onClick={save}>
            {saving ? 'сохранение...' : 'начать день'}
          </button>
        </div>
      </div>

      {pendingForBlock && (
        <div className="nd-picker-overlay" onClick={() => setPendingForBlock(null)}>
          <div className="nd-picker" onClick={e => e.stopPropagation()}>
            <div className="nd-picker-label prompt-line">
              {'>'} добавить в блок:
            </div>
            <div className="nd-picker-task-name">
              {pendingForBlock.kind === 'pool'
                ? <>{pendingForBlock.task.icon && <span className="pip-emoji">{pendingForBlock.task.icon}</span>} {pendingForBlock.task.title}</>
                : <>{pendingForBlock.icon && <span className="pip-emoji">{pendingForBlock.icon}</span>} {pendingForBlock.title}</>
              }
            </div>
            {BLOCKS.map(block => (
              <button
                key={block}
                className="nd-picker-btn"
                onClick={() => addToBlock(block)}
              >
                {BLOCK_LABELS[block]}
              </button>
            ))}
            <button className="nd-picker-cancel" onClick={() => setPendingForBlock(null)}>
              отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
