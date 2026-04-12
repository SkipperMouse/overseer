import type { DraggableAttributes } from '@dnd-kit/core'
import type { TaskItem } from '../../types'

interface Props {
  item: TaskItem
  hasDesc?: boolean
  editMode?: boolean
  isDragging?: boolean
  dragProps?: {
    attributes: DraggableAttributes
    listeners: Record<string, unknown> | undefined
  }
  onToggle: () => void
  onDelete?: () => void
}

export default function TaskRow({
  item, hasDesc, editMode, isDragging, dragProps, onToggle, onDelete,
}: Props) {
  return (
    <div
      className={`task-row${item.checked ? ' done' : ''}${isDragging ? ' dragging' : ''}${editMode ? ' edit-mode' : ''}`}
      onClick={editMode ? undefined : onToggle}
      {...(editMode && dragProps ? dragProps.attributes : {})}
      {...(editMode && dragProps ? dragProps.listeners : {})}
    >
      <input
        type="checkbox"
        className="checkbox"
        checked={item.checked}
        onChange={onToggle}
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      />

      {item.icon && (
        <span className="task-icon pip-emoji">{item.icon}</span>
      )}

      <span className="task-title">{item.title}</span>

      {item.duration && (
        <span className="task-duration">{item.duration}</span>
      )}

      {item.task_id && hasDesc && (
        <span className="task-desc-indicator">¶</span>
      )}

      {onDelete && (
        <button
          className="pool-del-btn"
          onClick={e => { e.stopPropagation(); onDelete() }}
          onPointerDown={e => e.stopPropagation()}
          aria-label="удалить задачу"
        >×</button>
      )}
    </div>
  )
}
