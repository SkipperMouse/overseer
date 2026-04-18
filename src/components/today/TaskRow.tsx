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
  return (
    <div
      className={`task-row${item.checked ? ' done' : ''}${isDragging ? ' dragging' : ''}${editMode ? ' edit-mode' : ''}`}
    >
      <div
        className="task-check-area"
        onClick={e => {
          e.stopPropagation()
          // In edit mode, the main toggle is disabled, but we want to check/uncheck
          if (editMode) onToggle()
          if (!editMode) onToggle()
        }}
      >
        <input
          type="checkbox"
          className="checkbox"
          checked={item.checked}
          readOnly={editMode} // Prevent direct interaction in edit mode, use wrapper click
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        />
      </div>

      {editMode && (
        <span
          className="drag-handle"
          {...dragProps?.attributes}
          {...dragProps?.listeners}
          aria-label="перетащить задачу"
        >
          ⠿
        </span>
      )}

      {item.icon && (
        <span className="task-icon pip-emoji">{item.icon}</span>
      )}

      <span className="task-title" onClick={e => { e.stopPropagation(); onDescClick?.() }}>{item.title}</span>

      {item.duration && (
        <span className="task-duration">{item.duration}m</span>
      )}

      {item.task_id && hasDesc && (
        <span
          className="task-desc-indicator"
          onClick={e => { e.stopPropagation(); onDescClick?.() }}
        >¶</span>
      )}

      {editMode && onDelete && (
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
