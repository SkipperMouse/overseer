import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

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
  brightness: number
}

const STORAGE_KEY = 'overseer_display_settings'
const DEVICE_ID_KEY = 'overseer_device_id'

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
  brightness: 1.0,
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

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function upsertToDb(settings: DisplaySettings, deviceId: string) {
  supabase
    .from('device_settings')
    .upsert({ device_id: deviceId, settings }, { onConflict: 'device_id' })
    .then(({ error }) => { if (error) console.error('[settings upsert]', error) })
}

export function useDisplaySettings() {
  const [settings, setSettings] = useState<DisplaySettings>(load)
  const [loaded, setLoaded] = useState(false)
  const deviceIdRef = useRef<string>(getDeviceId())

  useEffect(() => {
    let cancelled = false
    const deviceId = deviceIdRef.current

    const timer = setTimeout(() => { if (!cancelled) setLoaded(true) }, 2500)

    supabase
      .from('device_settings')
      .select('settings')
      .eq('device_id', deviceId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        clearTimeout(timer)
        if (!error && data !== null) {
          const merged: DisplaySettings = { ...DEFAULTS, ...(data.settings as Partial<DisplaySettings>) }
          setSettings(merged)
          save(merged)
          const dbKeys = Object.keys(data.settings as object)
          const hasNewKeys = (Object.keys(DEFAULTS) as string[]).some(k => !dbKeys.includes(k))
          if (hasNewKeys) {
            upsertToDb(merged, deviceId)
          }
        }
        setLoaded(true)
      })

    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

  function toggleSetting(key: keyof DisplaySettings) {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] }
      save(next)
      upsertToDb(next, deviceIdRef.current)
      return next
    })
  }

  function setSetting<K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      save(next)
      upsertToDb(next, deviceIdRef.current)
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

  return { settings, toggleSetting, setSetting, loaded }
}
