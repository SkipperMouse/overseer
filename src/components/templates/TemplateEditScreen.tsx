import { useState } from 'react'
import { useTemplateItems } from '../../hooks/useTemplates'
import type { Template, TemplateItem, Block, Task } from '../../types'

interface Props {
  template: Template
  onBack: () => void
}

const BLOCKS: { key: Block; label: string }[] = [
  { key: 'morning', label: '[ утро ]' },
  { key: 'day',     label: '[ работа ]' },
  { key: 'evening', label: '[ вечер ]' },
]

interface TaskPickerProps {
  tasks: Task[]
  onSelect: (taskId: string) => void
  onClose: () => void
}

function TaskPicker({ tasks, onSelect, onClose }: TaskPickerProps) {
  const [query, setQuery] = useState('')

  if (tasks.length === 0) {
    return (
      <div className="tmpl-picker-overlay" onClick={onClose}>
        <div className="tmpl-picker" onClick={e => e.stopPropagation()}>
          <div className="tmpl-picker-empty text-muted">// все задачи добавлены</div>
        </div>
      </div>
    )
  }

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="tmpl-picker-overlay" onClick={onClose}>
      <div className="tmpl-picker" onClick={e => e.stopPropagation()}>
        <div className="tmpl-picker-search">
          <span className="prompt-line">{'>'}</span>
          <input
            className="tmpl-picker-input"
            autoFocus
            placeholder="поиск задачи..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
        </div>
        <div className="tmpl-picker-list">
          {filtered.length === 0 && (
            <div className="tmpl-picker-empty text-muted">// нет совпадений</div>
          )}
          {filtered.map(task => (
            <button
              key={task.id}
              className="tmpl-picker-item"
              onClick={() => { onSelect(task.id); onClose() }}
            >
              {task.icon && <span className="task-icon pip-emoji">{task.icon}</span>}
              <span className="tmpl-picker-title">{task.title}</span>
              {task.duration && (
                <span className="task-duration">{task.duration}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface SepInputProps {
  onConfirm: (label: string) => void
  onCancel: () => void
}

function SepInput({ onConfirm, onCancel }: SepInputProps) {
  const [label, setLabel] = useState('')
  return (
    <div className="tmpl-sep-input-row">
      <span className="prompt-line">{'>'}</span>
      <input
        className="pool-input pool-input-title"
        autoFocus
        placeholder="название разделителя..."
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && label.trim()) onConfirm(label.trim())
          if (e.key === 'Escape') onCancel()
        }}
      />
      <button
        className="pool-save-btn"
        disabled={!label.trim()}
        onClick={() => label.trim() && onConfirm(label.trim())}
      >
        ↵
      </button>
    </div>
  )
}

interface BlockSectionProps {
  blockKey: Block
  label: string
  items: TemplateItem[]
  tasks: Task[]
  onAddTask: (block: Block, taskId: string) => void
  onAddSeparator: (block: Block, label: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, dir: 'up' | 'down') => void
}

function BlockSection({
  blockKey, label, items, tasks, onAddTask, onAddSeparator, onDelete, onMove,
}: BlockSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sepInputOpen, setSepInputOpen] = useState(false)

  const blockItems = items
    .filter(i => i.block === blockKey)
    .sort((a, b) => a.position - b.position)

  const addedTaskIds = new Set(
    items.filter(i => i.type === 'task' && i.task_id).map(i => i.task_id as string)
  )
  const availableTasks = tasks.filter(t => !addedTaskIds.has(t.id))

  return (
    <div className="tmpl-block">
      <div className="section-header">
        <span className="label-section">{label}</span>
      </div>

      <div className="tmpl-block-items">
        {blockItems.map((item, idx) => (
          <div key={item.id} className="tmpl-item-row">
            {item.type === 'separator' ? (
              <span className="tmpl-item-sep-label text-muted">
                — {item.separator_label}
              </span>
            ) : (
              <>
                {item.task?.icon && (
                  <span className="task-icon pip-emoji">{item.task.icon}</span>
                )}
                <span className="tmpl-item-title">{item.task?.title ?? '?'}</span>
                {item.task?.duration && (
                  <span className="task-duration">{item.task.duration}</span>
                )}
              </>
            )}
            <div className="task-move-btns">
              <button
                className="move-btn"
                disabled={idx === 0}
                onClick={() => onMove(item.id, 'up')}
              >
                ↑
              </button>
              <button
                className="move-btn"
                disabled={idx === blockItems.length - 1}
                onClick={() => onMove(item.id, 'down')}
              >
                ↓
              </button>
            </div>
            <button
              className="pool-del-btn"
              onClick={() => onDelete(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {sepInputOpen && (
        <SepInput
          onConfirm={l => { onAddSeparator(blockKey, l); setSepInputOpen(false) }}
          onCancel={() => setSepInputOpen(false)}
        />
      )}

      <div className="tmpl-block-actions">
        <button
          className="pool-add-btn"
          onClick={() => setPickerOpen(true)}
        >
          + задача
        </button>
        <button
          className="pool-add-btn"
          onClick={() => setSepInputOpen(s => !s)}
        >
          + разделитель
        </button>
      </div>

      {pickerOpen && (
        <TaskPicker
          tasks={availableTasks}
          onSelect={taskId => onAddTask(blockKey, taskId)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

export default function TemplateEditScreen({ template, onBack }: Props) {
  const { items, tasks, loading, addTaskItem, addSeparator, deleteItem, moveItem } =
    useTemplateItems(template.id)

  return (
    <div className="tmpl-screen">
      <header className="tmpl-header">
        <button className="desc-back" onClick={onBack}>← назад</button>
        <span className="tmpl-edit-title">{template.name}</span>
      </header>

      <div className="tmpl-edit-content">
        {loading ? (
          <div className="pool-loading">
            <span className="text-muted">загрузка</span>
            <span className="blink-cursor" />
          </div>
        ) : (
          BLOCKS.map(({ key, label }) => (
            <BlockSection
              key={key}
              blockKey={key}
              label={label}
              items={items}
              tasks={tasks}
              onAddTask={addTaskItem}
              onAddSeparator={addSeparator}
              onDelete={deleteItem}
              onMove={moveItem}
            />
          ))
        )}
      </div>
    </div>
  )
}
