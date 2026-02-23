import { useState, useEffect, useCallback } from 'react'
import { load } from '@tauri-apps/plugin-store'
import { isTauri } from '@tauri-apps/api/core'

export type OutputMode = 'clipboard' | 'type'
export type RecordingMode = 'toggle' | 'push-to-talk'

export interface AppSettings {
  outputMode: OutputMode
  recordingMode: RecordingMode
  hotkey: string
  convertNumbers: boolean
  realtimeFill: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  outputMode: 'clipboard',
  recordingMode: 'toggle',
  hotkey: 'CommandOrControl+Shift+Space',
  convertNumbers: true,
  realtimeFill: false,
}

const STORE_KEY = 'app-settings'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isTauri()) {
      const saved = localStorage.getItem(STORE_KEY)
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
        } catch {}
      }
      setLoaded(true)
      return
    }

    let mounted = true
    load('settings.json')
      .then(async (store) => {
        if (!mounted) return
        const saved = await store.get<AppSettings>(STORE_KEY)
        if (saved && typeof saved === 'object') {
          setSettings({ ...DEFAULT_SETTINGS, ...saved })
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoaded(true))

    return () => { mounted = false }
  }, [])

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings)
    if (!isTauri()) {
      localStorage.setItem(STORE_KEY, JSON.stringify(newSettings))
      return
    }
    try {
      const store = await load('settings.json')
      await store.set(STORE_KEY, newSettings)
      await store.save()
    } catch {}
  }, [])

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const next = { ...settings, [key]: value }
      saveSettings(next)
    },
    [settings, saveSettings]
  )

  return { settings, loaded, saveSettings, updateSetting }
}
