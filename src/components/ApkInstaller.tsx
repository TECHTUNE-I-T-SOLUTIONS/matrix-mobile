import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Application from 'expo-application'

const RELEASES_URL = process.env.RELEASES_URL || process.env.EXPO_PUBLIC_RELEASES_URL || 'https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/matrix-mobile/releases/latest'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.EXPO_PUBLIC_GITHUB_TOKEN || ''

const ApkInstaller: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false)

  const openUnknownSourcesSettings = async () => {
    try {
      const pkg = Application.applicationId || (await Application.getAndroidId()) || ''
      await IntentLauncher.startActivityAsync('android.settings.MANAGE_UNKNOWN_APP_SOURCES', {
        data: `package:${pkg}`,
      })
    } catch (e) {
      console.warn('Failed to open install unknown apps settings', e)
      Alert.alert('Open Settings', 'Please open Android settings → Install unknown apps and allow this app to install APKs.')
    }
  }

  const downloadAndInstall = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not supported', 'In-app APK install is only supported on Android devices')
      return
    }

    // Guide user to enable unknown sources if needed
    Alert.alert(
      'Install permission required',
      'To install the APK you will need to allow this app to install unknown apps. Open settings to enable it, then return and continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: openUnknownSourcesSettings },
        { text: 'Continue', onPress: () => _doDownload() },
      ]
    )
  }

  const _doDownload = async () => {
    setIsDownloading(true)
    try {
      // Prefer using a server-side proxy on the website which has the GitHub token
      const websiteDownload = process.env.EXPO_PUBLIC_DOWNLOAD_APK_URL || (process.env.EXPO_PUBLIC_APP_URL ? `${process.env.EXPO_PUBLIC_APP_URL.replace(/\/$/, '')}/api/download-apk` : '')

      let downloadUrl: string | null = null
      let filename = `matrix-${Date.now()}.apk`

      if (websiteDownload) {
        downloadUrl = websiteDownload
      } else {
        // Fallback: fetch release metadata directly from GitHub
        const headers: Record<string,string> = { Accept: 'application/vnd.github+json' }
        if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`

        const res = await fetch(RELEASES_URL, { headers })
        if (!res.ok) throw new Error('Failed to fetch release metadata')
        const data = await res.json()

        const asset = (data.assets || []).find((a: any) => a.name && a.name.toLowerCase().endsWith('.apk'))
        if (!asset) {
          Alert.alert('No APK found', 'No APK asset was found on the latest release')
          return
        }

        downloadUrl = asset.browser_download_url
        filename = asset.name
      }

      const baseDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || ''
      const localUri = baseDir + filename

      const downloadOptions: any = {}
      if (!websiteDownload && GITHUB_TOKEN) downloadOptions.headers = { Authorization: `Bearer ${GITHUB_TOKEN}` }

      if (!downloadUrl) throw new Error('No download URL available')
      const { uri } = await FileSystem.downloadAsync(downloadUrl, localUri, downloadOptions)

      // Launch installer via Intent
      try {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: uri,
          flags: 1,
          type: 'application/vnd.android.package-archive',
        })
      } catch (e) {
        // Fallback: inform user where the file is
        Alert.alert('Download complete', `APK saved to ${uri}. Please open it to install.`)
      }
    } catch (err: any) {
      console.warn('APK install failed', err)
      Alert.alert('Error', err?.message || 'Failed to download or install APK')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={downloadAndInstall} disabled={isDownloading}>
        <Text style={styles.buttonText}>{isDownloading ? 'Downloading...' : 'Download'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginLeft: 12, alignSelf: 'flex-start' },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#047603',
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
})

export default ApkInstaller
