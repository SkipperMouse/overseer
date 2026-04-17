import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TaskItem } from '../../types'

interface Props {
  item: TaskItem
  hasDesc: boolean
  onDelete: () => void
}

export default function SortableTaskRow({ item, hasDesc, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      className={`task-row edit-mode${item.checked ? ' done' : ''}${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      {...attributes}
      {...listeners}
    >
      <div className="task-check-area">
        <input
          type="checkbox"
          className="checkbox"
          checked={item.checked}
          onChange={() => {}}
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
        <span className="task-desc-indicator">¶</span>
      )}

      <button
        className="pool-del-btn"
        onClick={e => { e.stopPropagation(); onDelete() }}
        onPointerDown={e => e.stopPropagation()}
        aria-label="удалить задачу"
      >×</button>
    </div>
  )
}
