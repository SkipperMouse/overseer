import type { DisplaySettings } from '../../hooks/useDisplaySettings'
import OverseerLogo from '../ui/OverseerLogo'

interface Props {
  settings: DisplaySettings
  onToggle: (key: keyof DisplaySettings) => void
  onBack: () => void
}

const EFFECTS: { key: keyof DisplaySettings; label: string; desc: string }[] = [
  { key: 'phosphorGlow', label: 'PHOSPHOR GLOW',   desc: 'soft green luminance on active elements' },
  { key: 'bloom',        label: 'BLOOM / HALATION', desc: 'bright pixels bleed outward like real phosphor' },
  { key: 'smear',        label: 'PHOSPHOR SMEAR',   desc: 'subtle horizontal blur on all content' },
  { key: 'scanlines',    label: 'SCANLINES',         desc: 'horizontal dark bands, 2px pitch' },
  { key: 'interlace',    label: 'INTERLACE LINES',   desc: 'alternating green/dark rows, crt interlace' },
  { key: 'reflection',   label: 'GLASS REFLECTION',  desc: 'static highlight, upper-left corner' },
]

export default function SettingsScreen({ settings, onToggle, onBack }: Props) {
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
          onClick={onBack}
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
          ← BACK
        </button>
      </div>

      <div style={{
        flexShrink: 0,
        padding: '10px 16px 8px',
        borderBottom: '1px solid var(--border-dim)',
        fontSize: 9, letterSpacing: '3px', color: 'var(--text-section)',
      }}>
        SETTINGS / DISPLAY
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {EFFECTS.map(({ key, label, desc }) => {
          const on = settings[key]
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                width: '100%', textAlign: 'left',
                background: on ? 'rgba(0,255,65,0.03)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-dim)',
                padding: '14px 16px',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(106,170,90,0.04)' }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                flexShrink: 0,
                marginTop: 1,
                width: 14, height: 14,
                border: `1px solid ${on ? 'var(--accent)' : 'var(--border-bright)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: on ? '0 0 5px #00ff4133' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}>
                {on && (
                  <div style={{ width: 8, height: 8, background: 'var(--accent)', boxShadow: '0 0 4px #00ff4188' }} />
                )}
              </div>

              <div>
                <div style={{
                  fontSize: 10, letterSpacing: '2px',
                  color: on ? 'var(--accent)' : 'var(--text-primary)',
                  textShadow: on ? '0 0 6px #00ff4155' : 'none',
                  marginBottom: 4,
                  transition: 'color 0.15s',
                }}>
                  {label}
                </div>
                <div style={{ fontSize: 9, letterSpacing: '1px', color: 'var(--text-section)', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </div>
            </button>
          )
        })}

        <div style={{
          padding: '20px 16px',
          fontSize: 9, letterSpacing: '1.5px', color: 'var(--border-dim)',
          lineHeight: 2,
        }}>
          SETTINGS ARE SAVED AUTOMATICALLY<br />
          AND PERSIST BETWEEN SESSIONS.
        </div>
      </div>
    </div>
  )
}
