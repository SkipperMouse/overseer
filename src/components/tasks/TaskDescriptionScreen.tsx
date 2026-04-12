import type { Task } from '../../types'

interface Props {
  task: Task
  onSave: (content: string) => void
  onBack: () => void
}

export default function TaskDescriptionScreen({ task, onSave, onBack }: Props) {
  return (
    <div className="desc-screen">
      <header className="desc-header">
        <button className="desc-back" onClick={onBack}>
          ← back
        </button>
        <span className="desc-title">
          {task.icon && <span className="desc-title-icon pip-emoji">{task.icon}</span>}
          {task.title}
        </span>
      </header>

      <div className="desc-body">
        <div className="prompt-line">{'>'} description</div>
        <textarea
          key={task.id}
          className="desc-textarea"
          defaultValue={task.description?.content ?? ''}
          placeholder="// описание задачи..."
          onBlur={e => onSave(e.target.value)}
          autoFocus
        />
      </div>
    </div>
  )
}
