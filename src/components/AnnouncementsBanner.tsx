import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native'
import { apiClient } from '../services/apiClient'
import { useTheme } from '../contexts/ThemeContext'

export const AnnouncementsBanner: React.FC = () => {
  const { theme } = useTheme()
  const [message, setMessage] = useState<string | null>(null)
  const translateX = useRef(new Animated.Value(0)).current
  const [width, setWidth] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await apiClient.get('/announcements')
        if (!res.success) return

        // Website API returns { success: true, data: [ ... ] }
        const list = Array.isArray(res.data) ? res.data : (res.data && Array.isArray((res.data as any).data) ? (res.data as any).data : null)
        if (!list) return

        const first = list.find((a: any) => a.is_published) || list[0]
        if (!first) return

        const title = first.title || null
        const content = first.content || first.message || null

        if (mounted) {
          setMessage(title && content ? `${title} — ${content.replace(/\r?\n/g, ' ' )}` : (title || content))
        }
      } catch (e) {
        console.error('Announcements fetch error:', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (width > 0 && containerWidth > 0) {
      translateX.setValue(containerWidth)
      Animated.loop(
        Animated.timing(translateX, {
          toValue: -width,
          duration: (width + containerWidth) * 20,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()
    }
  }, [width, containerWidth, message])

  if (!message) return null

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <TouchableOpacity activeOpacity={0.8}>
        <View style={styles.inner}>
          <Animated.Text
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            style={[styles.text, { color: theme.text, transform: [{ translateX }] }]}
            numberOfLines={1}
          >
            {message}
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  inner: {
    overflow: 'hidden',
  },
  text: {
    fontSize: 14,
  },
})

export default AnnouncementsBanner