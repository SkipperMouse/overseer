import { useState } from 'react'
import { useHistory } from '../../hooks/useHistory'
import TodayScreen from '../today/TodayScreen'
import type { DayPlan, TaskItem } from '../../types'
import { formatDate } from '../../lib/date'
import OverseerLogo from '../ui/OverseerLogo'
import AsciiProgressBar from '../ui/AsciiProgressBar'

function getProgress(plan: DayPlan): { done: number; total: number } {
  const tasks = plan.items.filter((i): i is TaskItem => i.type === 'task')
  return { done: tasks.filter(t => t.checked).length, total: tasks.length }
}

export default function HistoryScreen() {
  const { plans, loading, loadingMore, hasMore, loadMore, deletePlan } = useHistory()
  const [viewingDate, setViewingDate] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  if (viewingDate) {
    return <TodayScreen date={viewingDate} onBack={() => setViewingDate(null)} />
  }

  if (loading) {
    return (
      <div className="history-screen">
        <header className="history-header">
          <OverseerLogo />
          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-section)', pointerEvents: 'none' }}>HIST</span>
        </header>
        <div className="history-loading">
          <span className="text-muted">loading</span>
          <span className="blink-cursor" />
        </div>
      </div>
    )
  }

  return (
    <div className="history-screen">
      <header className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <OverseerLogo />
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-section)', pointerEvents: 'none' }}>HIST</span>
      </header>

      {plans.length === 0 ? (
        <div className="history-empty">
          <span className="text-muted">// history empty</span>
        </div>
      ) : (
        <div className="history-list">
          {plans.map(plan => {
            const { done, total } = getProgress(plan)
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
                    {isConfirming ? (
                      <>
                        <button
                          className="pool-del-confirm"
                          onClick={() => { deletePlan(plan.id); setConfirmingDelete(null) }}
                        >
                          delete
                        </button>
                        <button
                          className="pool-tag"
                          onClick={() => setConfirmingDelete(null)}
                        >
                          cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="pool-del-btn"
                        onClick={() => setConfirmingDelete(plan.id)}
                        aria-label="delete record"
                      >×</button>
                    )}
                  </div>
                </div>
                <AsciiProgressBar value={done} total={total} />
                {plan.note && (
                  <div className="history-item-note text-muted">{plan.note}</div>
                )}
              </div>
            )
          })}
          {hasMore && (
            <button
              className="history-load-more"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? 'loading...' : '// load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
