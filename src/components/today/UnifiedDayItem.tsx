import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { MouseEvent } from 'react'
import type { DayItem, TaskItem } from '../../types'
import TaskRow from './TaskRow'
import SectionHeader from './SectionHeader'

interface Props {
  item: DayItem
  mode: 'view' | 'edit'
  label: string // For separators
  hasDesc: boolean // For tasks
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onDescClick: () => void
}

export default function UnifiedDayItem({ item, mode, label, hasDesc, onDelete, onToggle, onDescClick }: Props) {
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

  const viewWrapperStyle = {
    transform: 'none',
    transition: 'none',
  }

  // == SEPARATOR ==
  if (item.type === 'separator') {
    if (mode !== 'edit') {
      return (
        <div ref={setNodeRef} style={viewWrapperStyle}>
          <SectionHeader label={label} />
        </div>
      )
    }
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`section-header-drag${isDragging ? ' dragging' : ''}`}
        {...attributes}
        {...listeners}
      >
        <SectionHeader label={label} />
      </div>
    )
  }

  // == TASK ==
  const taskItem = item as TaskItem
  if (mode !== 'edit') {
    return (
      <div ref={setNodeRef} style={viewWrapperStyle}>
        <TaskRow item={taskItem} onToggle={() => onToggle(taskItem.id)} onDescClick={onDescClick} hasDesc={hasDesc} />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-row edit-mode${taskItem.checked ? ' done' : ''}${isDragging ? ' dragging' : ''}`}
    >
      <div
        className="task-check-area"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation()
          onToggle(taskItem.id)
        }}
      >
        <input
          type="checkbox"
          className="checkbox"
          readOnly
          checked={taskItem.checked}
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

      {taskItem.icon && (
        <span className="task-icon pip-emoji">{taskItem.icon}</span>
      )}

      <span className="task-title" onClick={onDescClick}>{taskItem.title}</span>

      {taskItem.duration && (
        <span className="task-duration">{taskItem.duration}m</span>
      )}

      {taskItem.task_id && hasDesc && (
        <span className="task-desc-indicator" onClick={onDescClick}>¶</span>
      )}

      <button
        className="pool-del-btn"
        onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDelete(taskItem.id) }}
        onPointerDown={e => e.stopPropagation()}
        aria-label="удалить задачу"
      >×</button>
    </div>
  )
}
