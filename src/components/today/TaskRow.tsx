import type { TaskItem } from '../../types'

interface Props {
  item: TaskItem
  canMoveUp: boolean
  canMoveDown: boolean
  hasDesc?: boolean
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export default function TaskRow({ item, canMoveUp, canMoveDown, hasDesc, onToggle, onMoveUp, onMoveDown }: Props) {
  return (
    <div
      className={`task-row${item.checked ? ' done' : ''}`}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        className="checkbox"
        checked={item.checked}
        onChange={onToggle}
        onClick={e => e.stopPropagation()}
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

      <div className="task-move-btns" onClick={e => e.stopPropagation()}>
        <button
          className="move-btn"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          aria-label="переместить вверх"
        >↑</button>
        <button
          className="move-btn"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          aria-label="переместить вниз"
        >↓</button>
      </div>
    </div>
  )
}
