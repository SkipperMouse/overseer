import OverseerLogo from '../ui/OverseerLogo'

interface Props {
  onSettings: () => void
}

export default function StatScreen({ onSettings }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        flexShrink: 0,
        padding: '18px 16px 12px',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <OverseerLogo />
        <button
          onClick={onSettings}
          className="stat-settings-btn"
          style={{
            background: 'none', border: '1px solid var(--border-dim)',
            color: 'var(--text-dim)', fontFamily: 'var(--font)',
            fontSize: 9, letterSpacing: '2px',
            padding: '5px 10px', cursor: 'pointer', borderRadius: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--accent)'
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.textShadow = '0 0 6px #00ff4155'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-dim)'
            e.currentTarget.style.borderColor = 'var(--border-dim)'
            e.currentTarget.style.textShadow = 'none'
          }}
        >
          SETTINGS
        </button>
      </div>

      <div style={{
        flexShrink: 0,
        padding: '10px 16px 8px',
        borderBottom: '1px solid var(--border-dim)',
        fontSize: 9, letterSpacing: '3px', color: 'var(--text-section)',
      }}>
        STAT / STATISTICS
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: 32,
      }}>
        <div style={{
          fontSize: 11, letterSpacing: '2px', color: 'var(--border-bright)',
          fontFamily: 'var(--font)',
          lineHeight: 1.8,
          textAlign: 'center',
        }}>
          {[
            '┌─────────────────────┐',
            '│                     │',
            '│   ⚠  MODULE OFFLINE  │',
            '│                     │',
            '└─────────────────────┘',
          ].map((line, i) => <div key={i}>{line}</div>)}
        </div>

        <div style={{ textAlign: 'center', lineHeight: 2.2 }}>
          <div style={{ fontSize: 10, letterSpacing: '3px', color: 'var(--text-dim)' }}>
            STATISTICS MODULE
          </div>
          <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--border-dim)', marginTop: 4 }}>
            STATUS: PENDING DEPLOYMENT
          </div>
          <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--border-dim)' }}>
            CLEARANCE: INSUFFICIENT
          </div>
        </div>

        <div style={{
          marginTop: 16,
          fontSize: 9, letterSpacing: '2px',
          color: 'var(--border-dim)',
          borderTop: '1px solid var(--border-dim)',
          paddingTop: 14,
          width: '100%', textAlign: 'center',
          lineHeight: 2,
        }}>
          <span style={{ color: 'var(--text-section)' }}>ACCESS RESTRICTED</span><br />
          CONTACT VAULT OVERSEER FOR CLEARANCE
        </div>
      </div>
    </div>
  )
}
