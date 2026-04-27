import type { DisplaySettings } from '../../hooks/useDisplaySettings'

interface Props {
  settings: DisplaySettings
  children: React.ReactNode
}

export default function AppRoot({ settings, children }: Props) {
  const contentFilter = [
    settings.bloom && 'url(#crt-bloom)',
    settings.smear && 'blur(0.45px)',
  ].filter(Boolean).join(' ') || undefined

  const scanlinesBg = settings.interlace
    ? 'repeating-linear-gradient(0deg, rgba(0,255,65,0.018) 0px, rgba(0,255,65,0.018) 1px, rgba(0,0,0,0.22) 1px, rgba(0,0,0,0.22) 2px)'
    : settings.scanlines
    ? 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px)'
    : undefined

  return (
    <div className="app-root">
      {settings.bloom && (
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <filter id="crt-bloom" x="-18%" y="-18%" width="136%" height="136%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="blur" />
              <feBlend in="SourceGraphic" in2="blur" mode="screen" />
            </filter>
          </defs>
        </svg>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', filter: contentFilter }}>
        {children}
      </div>

      {scanlinesBg && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, background: scanlinesBg }} />
      )}

      {/* Vignette — always on */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.72) 100%)',
      }} />

      {settings.reflection && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9996,
          background: [
            'radial-gradient(ellipse at 22% 8%, rgba(160,255,160,0.06) 0%, transparent 38%)',
            'linear-gradient(160deg, rgba(255,255,255,0.015) 0%, transparent 30%)',
          ].join(', '),
        }} />
      )}
    </div>
  )
}
