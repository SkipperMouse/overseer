import { useState } from 'react'
import { useHistory } from '../../hooks/useHistory'
import TodayScreen from '../today/TodayScreen'
import type { DayPlan, TaskItem } from '../../types'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: 'short' })
}

function getProgress(plan: DayPlan): { done: number; total: number } {
  const tasks = plan.items.filter((i): i is TaskItem => i.type === 'task')
  return { done: tasks.filter(t => t.checked).length, total: tasks.length }
}

export default function HistoryScreen() {
  const { plans, loading, deletePlan } = useHistory()
  const [viewingDate, setViewingDate] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  if (viewingDate) {
    return <TodayScreen date={viewingDate} onBack={() => setViewingDate(null)} />
  }

  if (loading) {
    return (
      <div className="history-screen">
        <header className="history-header">
          <span className="label-section">[ история ]</span>
        </header>
        <div className="history-loading">
          <span className="text-muted">загрузка</span>
          <span className="blink-cursor" />
        </div>
      </div>
    )
  }

  return (
    <div className="history-screen">
      <header className="history-header">
        <span className="label-section">[ история ]</span>
      </header>

      {plans.length === 0 ? (
        <div className="history-empty">
          <span className="text-muted">// история пуста</span>
        </div>
      ) : (
        <div className="history-list">
          {plans.map(plan => {
            const { done, total } = getProgress(plan)
            const pct = total > 0 ? (done / total) * 100 : 0
            const isConfirming = confirmingDelete === plan.id

            return (
              <div
                key={plan.id}
                className="history-item"
                onClick={() => { if (!isConfirming) setViewingDate(plan.date) }}
              >
                <div className="history-item-top">
                  <span className="history-item-date">{formatDate(plan.date)}</span>
                  <div className="history-item-actions" onClick={e => e.stopPropagation()}>
                    <span className="history-item-count">{done} / {total}</span>
                    {isConfirming ? (
                      <>
                        <button
                          className="pool-del-confirm"
                          onClick={() => { deletePlan(plan.id); setConfirmingDelete(null) }}
                        >
                          удалить
                        </button>
                        <button
                          className="pool-tag"
                          onClick={() => setConfirmingDelete(null)}
                        >
                          отмена
                        </button>
                      </>
                    ) : (
                      <button
                        className="pool-del-btn"
                        onClick={() => setConfirmingDelete(plan.id)}
                        aria-label="удалить запись"
                      >×</button>
                    )}
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                {plan.note && (
                  <div className="history-item-note text-muted">{plan.note}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
