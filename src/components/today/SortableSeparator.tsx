import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SectionHeader from './SectionHeader'
import MiniSeparator from './MiniSeparator'

interface Props {
  id: string
  label: string
  draggable: boolean
  mini?: boolean
}

export default function SortableSeparator({ id, label, draggable, mini }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const content = mini ? <MiniSeparator label={label} /> : <SectionHeader label={label} />

  if (!draggable) {
    return content
  }

  return (
    <div
      ref={setNodeRef}
      className={mini ? `mini-separator-drag${isDragging ? ' dragging' : ''}` : `section-header-drag${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      {...attributes}
      {...listeners}
    >
      {content}
    </div>
  )
}
