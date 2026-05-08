import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Application from 'expo-application'

const AUTO_CHECK_KEY = 'auto_check_updates'
const RELEASES_URL = process.env.RELEASES_URL || process.env.EXPO_PUBLIC_RELEASES_URL || 'https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/matrix-mobile/releases/latest'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.EXPO_PUBLIC_GITHUB_TOKEN || ''

export async function checkForUpdate(): Promise<boolean> {
  try {
    const headers: Record<string,string> = { Accept: 'application/vnd.github+json' }
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`
    const res = await fetch(RELEASES_URL, { headers, cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json()
    const tag = data.tag_name || data.name
    const current = Application.nativeApplicationVersion || Application.nativeBuildVersion || '1.0.0'
    if (tag && tag !== current) {
      // Do not immediately interrupt; return true for caller to decide how to prompt
      return true
    }
  } catch (err) {
    // Network can fail (device offline) — keep silent to avoid noisy console warnings
    console.debug('[useAutoUpdateCheck] check error', err)
  }
  return false
}

export function useAutoUpdateCheck() {
  const appState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    (async () => {
      // run once on mount if enabled
      try {
        const raw = await AsyncStorage.getItem(AUTO_CHECK_KEY)
        const enabled = raw === null ? true : raw === 'true'
        if (enabled) {
          // run check but do not force an alert here; the caller component should handle UI
          await checkForUpdate()
        }
      } catch (e) {
        console.debug('[useAutoUpdateCheck] init error', e)
      }
    })();

    const sub = AppState.addEventListener('change', async (next) => {
      // when returning to foreground, check if enabled
      if (appState.current.match(/inactive|background/) && next === 'active') {
        try {
          const raw = await AsyncStorage.getItem(AUTO_CHECK_KEY)
          const enabled = raw === null ? true : raw === 'true'
          if (enabled) {
            // run the check silently; UI-handling components can read AsyncStorage and prompt users
            await checkForUpdate()
          }
        } catch (e) {
          console.debug('[useAutoUpdateCheck] appstate error', e)
        }
      }
      appState.current = next
    })

    return () => sub.remove()
  }, [])
}

export async function setAutoCheckEnabled(value: boolean) {
  await AsyncStorage.setItem(AUTO_CHECK_KEY, value ? 'true' : 'false')
}

export async function isAutoCheckEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(AUTO_CHECK_KEY)
  return raw === null ? true : raw === 'true'
}
