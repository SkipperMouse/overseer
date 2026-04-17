import type { TaskItem } from '../../types'

interface Props {
  item: TaskItem
  hasDesc?: boolean
  onToggle: () => void
  onDescClick?: () => void
}

export default function TaskRow({ item, hasDesc, onToggle, onDescClick }: Props) {
  return (
    <div className={`task-row${item.checked ? ' done' : ''}`}>
      <div
        className="task-check-area"
        onClick={e => { e.stopPropagation(); onToggle() }}
      >
        <input
          type="checkbox"
          className="checkbox"
          checked={item.checked}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
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
    </div>
  )
}
