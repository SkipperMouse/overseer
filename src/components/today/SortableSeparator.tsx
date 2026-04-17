import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SectionHeader from './SectionHeader'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'

interface Props {
  id: string
  label: string
  draggable: boolean
}

export default function SortableSeparator({ id, label, draggable }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const isTouch = useIsTouchDevice()

  if (!draggable) {
    return <SectionHeader label={label} />
  }

  return (
    <div
      ref={setNodeRef}
      className={`section-header-drag${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      {...attributes}
      {...(!isTouch ? listeners : {})}
    >
      {isTouch && (
        <div className="drag-handle" {...listeners}>⠿</div>
      )}
      <SectionHeader label={label} />
    </div>
  )
}
