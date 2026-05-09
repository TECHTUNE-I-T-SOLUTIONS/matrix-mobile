import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Application from 'expo-application'

const RELEASES_URL = process.env.RELEASES_URL || process.env.EXPO_PUBLIC_RELEASES_URL || 'https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/matrix-mobile/releases/latest'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.EXPO_PUBLIC_GITHUB_TOKEN || ''

const ApkInstaller: React.FC = () => {
  const [downloadProgress, setDownloadProgress] = useState(0)
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

    Alert.alert(
      'Install Permission',
      'To install the update, you need to allow this app to install unknown apps. If you haven\'t enabled it, please do so in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: openUnknownSourcesSettings },
        { text: 'Download & Install', onPress: () => _doDownload() },
      ]
    )
  }

  const _doDownload = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    try {
      const websiteDownload = process.env.EXPO_PUBLIC_DOWNLOAD_APK_URL || (process.env.EXPO_PUBLIC_APP_URL ? `${process.env.EXPO_PUBLIC_APP_URL.replace(/\/$/, '')}/api/download-apk` : '')

      let downloadUrl: string | null = null
      let filename = `matrix-${Date.now()}.apk`

      if (websiteDownload) {
        downloadUrl = websiteDownload
      } else {
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

      const localUri = (FileSystem as any).cacheDirectory + filename

      const callback = (downloadProgress: any) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
        setDownloadProgress(progress)
      }

      const downloadOptions: any = {}
      if (!websiteDownload && GITHUB_TOKEN) downloadOptions.headers = { Authorization: `Bearer ${GITHUB_TOKEN}` }

      if (!downloadUrl) throw new Error('No download URL available')
      
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        localUri,
        downloadOptions,
        callback
      )

      const downloadResult = await downloadResumable.downloadAsync()
      if (!downloadResult) throw new Error('Download failed')

      const { uri } = downloadResult

      // Launch installer via Intent
      try {
        const contentUri = await FileSystem.getContentUriAsync(uri)
        await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        })
      } catch (e) {
        console.warn('Direct install failed, trying VIEW intent', e)
        try {
          const contentUri = await FileSystem.getContentUriAsync(uri)
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'application/vnd.android.package-archive',
          })
        } catch (e2) {
          Alert.alert('Download complete', `APK saved. Please find it in your files to install.`)
        }
      }
    } catch (err: any) {
      console.warn('APK install failed', err)
      Alert.alert('Error', err?.message || 'Failed to download or install APK')
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, isDownloading && styles.disabledButton]} 
        onPress={downloadAndInstall} 
        disabled={isDownloading}
      >
        <Text style={styles.buttonText}>
          {isDownloading ? `Downloading ${Math.round(downloadProgress * 100)}%` : 'Update App'}
        </Text>
      </TouchableOpacity>
      {isDownloading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${downloadProgress * 100}%` }]} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginLeft: 12, alignSelf: 'stretch' },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#047603',
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#04760380',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  progressContainer: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#047603',
  },
})

export default ApkInstaller
