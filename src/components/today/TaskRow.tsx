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
  onDescClick?: () => void
}

export default function TaskRow({
  item, hasDesc, editMode, isDragging, dragProps, onToggle, onDelete, onDescClick,
}: Props) {
  const done = item.checked

  return (
    <div
      className={`task-row${done ? ' done' : ''}${isDragging ? ' dragging' : ''}${editMode ? ' edit-mode' : ''}`}
    >
      {/* Check tap zone — 48px wide for easy mobile tap */}
      <div
        className="task-check-area"
        onClick={editMode ? undefined : (e => { e.stopPropagation(); onToggle() })}
      >
        <span className={`ascii-checkbox${done ? ' ascii-checkbox-checked' : ''}`}>
          {done ? '[x]' : '[ ]'}
        </span>
      </div>

      {item.icon && (
        <span className="task-icon pip-emoji">{item.icon}</span>
      )}

      <span className="task-title">{item.title}</span>

      {item.duration && (
        <span className="task-duration">{item.duration}m</span>
      )}

      {item.task_id && hasDesc && !editMode && (
        <span
          className="task-desc-indicator"
          onClick={e => { e.stopPropagation(); onDescClick?.() }}
        >¶</span>
      )}

      {/* Delete button (edit mode) */}
      {editMode && onDelete && (
        <div
          className="task-delete-zone"
          onClick={e => { e.stopPropagation(); onDelete() }}
          onPointerDown={e => e.stopPropagation()}
        >
          <span className="task-delete-icon">×</span>
        </div>
      )}

      {/* Drag handle — rightmost, thumb reach, only in edit mode */}
      {editMode && (
        <div
          className="drag-handle"
          {...dragProps?.attributes}
          {...dragProps?.listeners}
        >
          <span className="drag-handle-icon">╎╎</span>
        </div>
      )}
    </div>
  )
}
