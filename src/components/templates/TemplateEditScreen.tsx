import { useState, useRef } from 'react'
import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { useTemplateItems } from '../../hooks/useTemplates'
import type { Template, TemplateItem, Block, Task } from '../../types'
import { BLOCK_DEFS as BLOCKS } from '../../lib/blocks'

interface Props {
  template: Template
  onBack: () => void
}

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
          <div className="tmpl-picker-empty text-muted">// all tasks added</div>
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
            placeholder="search task..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
        </div>
        <div className="tmpl-picker-list">
          {filtered.length === 0 && (
            <div className="tmpl-picker-empty text-muted">// no matches</div>
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
                <span className="task-duration">{task.duration}m</span>
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
        placeholder="separator label..."
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

function SortableTmplRow({ item, onDelete }: { item: TemplateItem; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      className={`tmpl-item-row${isDragging ? ' dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
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
            <span className="task-duration">{item.task.duration}m</span>
          )}
        </>
      )}
      <button
        className="pool-del-btn"
        onClick={e => { e.stopPropagation(); onDelete() }}
        onPointerDown={e => e.stopPropagation()}
      >
        ×
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
}

function BlockSection({
  blockKey, label, items, tasks, onAddTask, onAddSeparator, onDelete,
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
        {blockItems.map(item => (
          <SortableTmplRow
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
          />
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
          + task
        </button>
        <button
          className="pool-add-btn"
          onClick={() => setSepInputOpen(s => !s)}
        >
          + separator
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
  const { items, tasks, loading, addTaskItem, addSeparator, deleteItem, reorderBlock, moveCrossBlockLocal, moveCrossBlock } =
    useTemplateItems(template.id)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragActiveIdRef = useRef<string | null>(null)
  const dragActiveBlockRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const allSortedIds = BLOCKS.flatMap(({ key }) =>
    items.filter(i => i.block === key).sort((a, b) => a.position - b.position).map(i => i.id)
  )

  function handleDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (dragActiveIdRef.current !== activeId) {
      dragActiveIdRef.current = activeId
      const item = items.find(i => i.id === activeId)
      dragActiveBlockRef.current = item?.block ?? null
    }
    const overItem = items.find(i => i.id === overId)
    if (!overItem || dragActiveBlockRef.current === overItem.block) return
    dragActiveBlockRef.current = overItem.block
    moveCrossBlockLocal(activeId, overId)
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null)
    dragActiveIdRef.current = null
    dragActiveBlockRef.current = null
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const activeItem = items.find(i => i.id === activeId)
    const overItem = items.find(i => i.id === overId)
    if (!activeItem || !overItem) return
    if (activeItem.block === overItem.block) {
      const blockItems = items.filter(i => i.block === activeItem.block).sort((a, b) => a.position - b.position)
      const oldIdx = blockItems.findIndex(i => i.id === activeId)
      const newIdx = blockItems.findIndex(i => i.id === overId)
      reorderBlock(activeItem.block, arrayMove(blockItems, oldIdx, newIdx).map(i => i.id))
    } else {
      moveCrossBlock(activeId, overId)
    }
  }

  return (
    <div className="tmpl-screen">
      <header className="tmpl-header">
        <button className="desc-back" onClick={onBack}>← back</button>
        <span className="tmpl-edit-title">{template.name}</span>
      </header>

      <div className="tmpl-edit-content">
        {loading ? (
          <div className="pool-loading">
            <span className="text-muted">loading</span>
            <span className="blink-cursor" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allSortedIds} strategy={verticalListSortingStrategy}>
              {BLOCKS.map(({ key, label }) => (
                <BlockSection
                  key={key}
                  blockKey={key}
                  label={label}
                  items={items}
                  tasks={tasks}
                  onAddTask={addTaskItem}
                  onAddSeparator={addSeparator}
                  onDelete={deleteItem}
                />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {(() => {
                if (!draggingId) return null
                const item = items.find(i => i.id === draggingId)
                if (!item) return null
                return (
                  <div className="drag-overlay-pulse">
                    <div className="tmpl-item-row">
                      {item.type === 'separator' ? (
                        <span className="tmpl-item-sep-label text-muted">— {item.separator_label}</span>
                      ) : (
                        <>
                          {item.task?.icon && <span className="task-icon pip-emoji">{item.task.icon}</span>}
                          <span className="tmpl-item-title">{item.task?.title ?? '?'}</span>
                          {item.task?.duration && <span className="task-duration">{item.task.duration}m</span>}
                        </>
                      )}
                    </div>
                  </div>
                )
              })()}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}
