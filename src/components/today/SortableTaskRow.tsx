import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskRow from './TaskRow'
import type { TaskItem } from '../../types'

interface Props {
  item: TaskItem
  hasDesc: boolean
  onToggle: () => void
  onDelete: () => void
  onDescClick?: () => void
}

export default function SortableTaskRow({ item, hasDesc, onToggle, onDelete, onDescClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <TaskRow
      item={item}
      hasDesc={hasDesc}
      editMode={true}
      isDragging={isDragging}
      dragProps={{ attributes, listeners }}
      wrapperRef={setNodeRef}
      wrapperStyle={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      onToggle={onToggle}
      onDelete={onDelete}
      onDescClick={onDescClick}
    />
  )
}
