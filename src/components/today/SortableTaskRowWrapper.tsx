import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskRow from './TaskRow'
import type { TaskItem } from '../../types'
import type { MouseEvent } from 'react'

interface WrapperProps {
  item: TaskItem
  mode: 'view' | 'edit'
  hasDesc: boolean
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onDescClick: () => void
}

export default function SortableTaskRowWrapper({ item, mode, hasDesc, onDelete, onToggle, onDescClick }: WrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: mode !== 'edit',
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // In view mode, render the non-interactive TaskRow but still provide the ref to dnd-kit.
  // Reset transform and transition so disabled items don't move.
  if (mode !== 'edit') {
    return (
      <div ref={setNodeRef} style={{ transform: 'none', transition: 'none' }}>
        <TaskRow item={item} onToggle={() => onToggle(item.id)} onDescClick={onDescClick} hasDesc={hasDesc} />
      </div>
    )
  }

  // In edit mode, render the full sortable row with a drag handle.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-row edit-mode${item.checked ? ' done' : ''}${isDragging ? ' dragging' : ''}`}
    >
      <div
        className="task-check-area"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation()
          onToggle(item.id)
        }}
      >
        <input
          type="checkbox"
          className="checkbox"
          readOnly
          checked={item.checked}
        />
      </div>

      <span
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="перетащить задачу"
      >
        ⠿
      </span>

      {item.icon && (
        <span className="task-icon pip-emoji">{item.icon}</span>
      )}

      <span className="task-title" onClick={onDescClick}>{item.title}</span>

      {item.duration && (
        <span className="task-duration">{item.duration}m</span>
      )}

      {item.task_id && hasDesc && (
        <span className="task-desc-indicator" onClick={onDescClick}>¶</span>
      )}

      <button
        className="pool-del-btn"
        onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDelete(item.id) }}
        onPointerDown={e => e.stopPropagation()}
        aria-label="удалить задачу"
      >×</button>
    </div>
  )
}
