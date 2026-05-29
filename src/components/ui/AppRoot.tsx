import { useState, useEffect, useRef } from 'react'
import type { DisplaySettings } from '../../hooks/useDisplaySettings'

interface Props {
  settings: DisplaySettings
  children: React.ReactNode
}

function RollingBar() {
  const [pass, setPass] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function schedule() {
      const delay = 9000 + Math.random() * 19000
      timerRef.current = setTimeout(() => {
        setPass(p => p + 1)
        schedule()
      }, delay)
    }
    schedule()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <div key={pass} style={{
      position: 'fixed', left: 0, right: 0, top: 0,
      height: 130,
      background: 'linear-gradient(180deg, transparent 0%, rgba(106,170,90,0.045) 35%, rgba(106,170,90,0.07) 50%, rgba(106,170,90,0.045) 65%, transparent 100%)',
      pointerEvents: 'none',
      zIndex: 9993,
      animation: `rolling-bar ${8 + Math.random() * 2}s linear forwards`,
    }} />
  )
}

export default function AppRoot({ settings, children }: Props) {
  const contentFilter = [
    settings.bloom && 'url(#crt-bloom)',
    settings.smear && 'blur(0.45px)',
    settings.brightness !== 1.0 && `brightness(${settings.brightness})`,
  ].filter(Boolean).join(' ') || undefined

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

      {settings.scanlines && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.30) 1px, rgba(0,0,0,0.30) 2px)',
        }} />
      )}
      {settings.interlace && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
          background: 'repeating-linear-gradient(0deg, rgba(0,255,65,0.018) 0px, rgba(0,255,65,0.018) 1px, rgba(0,0,0,0.22) 1px, rgba(0,0,0,0.22) 2px)',
        }} />
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

      {settings.rollingBar && <RollingBar />}
    </div>
  )
}
