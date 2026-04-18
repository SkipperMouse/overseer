import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SectionHeader from './SectionHeader'
import type { SeparatorItem } from '../../types'

interface WrapperProps {
  item: SeparatorItem
  mode: 'view' | 'edit'
  label: string
}

export default function SortableSeparatorWrapper({ item, mode, label }: WrapperProps) {
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

  if (mode !== 'edit') {
    return (
      <div ref={setNodeRef} style={{ transform: 'none', transition: 'none' }}>
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
