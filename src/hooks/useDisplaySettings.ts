import { useState, useEffect } from 'react'

export interface DisplaySettings {
  phosphorGlow: boolean
  bloom: boolean
  smear: boolean
  scanlines: boolean
  interlace: boolean
  reflection: boolean
  curvature: boolean
  rollingBar: boolean
  pipEmoji: boolean
}

const STORAGE_KEY = 'overseer_display_settings'

const DEFAULTS: DisplaySettings = {
  phosphorGlow: true,
  bloom: false,
  smear: false,
  scanlines: true,
  interlace: true,
  reflection: true,
  curvature: true,
  rollingBar: true,
  pipEmoji: true,
}

function load(): DisplaySettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

function save(s: DisplaySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function useDisplaySettings() {
  const [settings, setSettings] = useState<DisplaySettings>(load)

  function toggleSetting(key: keyof DisplaySettings) {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] }
      save(next)
      return next
    })
  }

  useEffect(() => {
    let el = document.getElementById('phosphor-style')
    if (!el) {
      el = document.createElement('style')
      el.id = 'phosphor-style'
      document.head.appendChild(el)
    }
    el.textContent = settings.phosphorGlow
      ? `.phosphor-glow { text-shadow: 0 0 8px #6aaa5a88, 0 0 3px #6aaa5acc !important; }`
      : ''
  }, [settings.phosphorGlow])

  useEffect(() => {
    let el = document.getElementById('pip-emoji-style')
    if (!el) {
      el = document.createElement('style')
      el.id = 'pip-emoji-style'
      document.head.appendChild(el)
    }
    el.textContent = settings.pipEmoji
      ? `.pip-emoji { filter: saturate(0) brightness(0.6) sepia(1) hue-rotate(55deg) saturate(4); }`
      : ''
  }, [settings.pipEmoji])

  return { settings, toggleSetting }
}
