import { useState } from 'react'
import type { Template } from '../../types'
import TemplateListScreen from './TemplateListScreen'
import TemplateEditScreen from './TemplateEditScreen'

export default function TemplatesScreen() {
  const [editing, setEditing] = useState<Template | null>(null)

  if (editing) {
    return (
      <TemplateEditScreen
        template={editing}
        onBack={() => setEditing(null)}
      />
    )
  }

  return <TemplateListScreen onOpen={setEditing} />
}
