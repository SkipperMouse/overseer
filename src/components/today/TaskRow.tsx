import type { DraggableAttributes } from '@dnd-kit/core'
import type { TaskItem } from '../../types'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'

interface Props {
  item: TaskItem
  hasDesc?: boolean
  editMode?: boolean
  isDragging?: boolean
  dragProps?: {
    attributes: DraggableAttributes
    listeners: Record<string, unknown> | undefined
  }
  wrapperRef?: (node: HTMLDivElement | null) => void
  wrapperStyle?: React.CSSProperties
  onToggle: () => void
  onDelete?: () => void
  onDescClick?: () => void
}

export default function TaskRow({
  item, hasDesc, editMode, isDragging, dragProps,
  wrapperRef, wrapperStyle,
  onToggle, onDelete, onDescClick,
}: Props) {
  const isTouch = useIsTouchDevice()

  return (
    <div
      ref={wrapperRef}
      className={`task-row${item.checked ? ' done' : ''}${isDragging ? ' dragging' : ''}${editMode ? ' edit-mode' : ''}`}
      style={wrapperStyle}
      {...(editMode && dragProps ? dragProps.attributes : {})}
      {...(editMode && dragProps && !isTouch ? dragProps.listeners : {})}
    >
      {editMode && dragProps && isTouch && (
        <div className="drag-handle" {...dragProps.listeners}>⠿</div>
      )}
      <div
        className="task-check-area"
        onClick={e => { e.stopPropagation(); if (!editMode) onToggle() }}
      >
        <input
          type="checkbox"
          className="checkbox"
          checked={item.checked}
          onChange={editMode ? () => {} : onToggle}
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        />
      </div>

      {item.icon && (
        <span className="task-icon pip-emoji">{item.icon}</span>
      )}

      <span className="task-title">{item.title}</span>

      {item.duration && (
        <span className="task-duration">{item.duration}m</span>
      )}

      {item.task_id && hasDesc && (
        <span
          className="task-desc-indicator"
          onClick={e => { e.stopPropagation(); onDescClick?.() }}
        >¶</span>
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
