import { useState } from 'react'
import { useTemplates } from '../../hooks/useTemplates'
import type { Template } from '../../types'

interface Props {
  onOpen: (template: Template) => void
}

export default function TemplateListScreen({ onOpen }: Props) {
  const { templates, loading, createTemplate, deleteTemplate } = useTemplates()
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const result = await createTemplate(name)
    if (result) {
      setNewName('')
      setShowForm(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') { setShowForm(false); setNewName('') }
  }

  return (
    <div className="tmpl-screen">
      <header className="tmpl-header">
        <span className="tmpl-brand label-section">templates</span>
        <button
          className="pool-add-btn"
          onClick={() => setShowForm(true)}
        >
          + new
        </button>
      </header>

      {showForm && (
        <div className="tmpl-new-form">
          <div className="pool-new-row">
            <input
              className="pool-input pool-input-title"
              autoFocus
              placeholder="название шаблона..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="pool-save-btn"
              disabled={!newName.trim()}
              onClick={handleCreate}
            >
              ↵
            </button>
          </div>
        </div>
      )}

      <div className="tmpl-list">
        {loading && (
          <div className="pool-loading">
            <span className="text-muted">загрузка</span>
            <span className="blink-cursor" />
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="pool-empty">
            <span className="text-muted">// шаблонов нет</span>
          </div>
        )}

        {templates.map(tmpl => (
          <div key={tmpl.id} className="tmpl-item">
            <button
              className="tmpl-item-name"
              onClick={() => onOpen(tmpl)}
            >
              {tmpl.name}
            </button>

            {confirmDelete === tmpl.id ? (
              <button
                className="pool-del-btn pool-del-confirm"
                onClick={() => { deleteTemplate(tmpl.id); setConfirmDelete(null) }}
              >
                удалить?
              </button>
            ) : (
              <button
                className="pool-del-btn"
                onClick={() => setConfirmDelete(tmpl.id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
