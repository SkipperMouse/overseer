import { useState, useEffect } from 'react'
import OverseerLogo from './OverseerLogo'

interface Props {
  onNewDay: () => void
}

export default function NoPlanScreen({ onNewDay }: Props) {
  const [tick, setTick] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setTick(t => !t), 900)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
  }).toUpperCase()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flexShrink: 0, padding: '16px 16px 14px',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <OverseerLogo />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{today}</span>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px', gap: 0,
      }}>
        <div style={{ width: '100%', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--border-bright)', lineHeight: 1.6, letterSpacing: '1px', textAlign: 'center' }}>
            <div>┌────────────────────────┐</div>
            <div style={{ display: 'flex' }}>
              <span style={{ color: 'var(--border-bright)' }}>│</span>
              <span style={{ flex: 1, textAlign: 'center', color: 'var(--text-dim)', fontSize: 9, letterSpacing: '3px', padding: '2px 0' }}>NO ACTIVE PLAN</span>
              <span style={{ color: 'var(--border-bright)' }}>│</span>
            </div>
            <div>└────────────────────────┘</div>
          </div>
        </div>

        <div style={{ marginBottom: 12, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', textAlign: 'center', lineHeight: 1.8 }}>
          <div>&gt; no day plan initialized</div>
          <div style={{ color: 'var(--text-dim)' }}>&gt; task queue empty</div>
          <div style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            &gt; awaiting input
            <span style={{
              opacity: tick ? 1 : 0,
              color: 'var(--accent)',
              display: 'inline-block', width: 7, height: 11,
              background: 'var(--accent)',
              boxShadow: '0 0 6px var(--accent)',
              verticalAlign: 'text-bottom',
            }} />
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            onClick={onNewDay}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              fontFamily: 'var(--font)', fontSize: 11,
              letterSpacing: '4px', textTransform: 'uppercase',
              padding: '9px 28px', cursor: 'pointer', borderRadius: 0,
              textShadow: '0 0 6px #00ff4155',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00ff4108' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            INIT DAY PLAN
          </button>
        </div>
      </div>
    </div>
  )
}
