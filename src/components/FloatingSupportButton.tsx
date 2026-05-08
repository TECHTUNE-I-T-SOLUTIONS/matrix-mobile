import React from 'react'
import { StyleSheet, View, TouchableOpacity, Text, Linking, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSession } from '../contexts/SessionContext'
import { useTheme } from '../contexts/ThemeContext'

const SUPPORT_NUMBER = '+2348109816653'
const SUPPORT_GROUP = 'https://chat.whatsapp.com/Lng1V0v71BXAse8QoXljQk'

const FloatingSupportButton: React.FC = () => {
  const { session } = useSession()
  const { theme } = useTheme()

  const openWhatsApp = async () => {
    const name = session.user?.full_name || session.user?.email || ''
    const id = session.user?.id || ''
    const message = `Hello Support, I am ${name} (ID: ${id}). I need help with...`
    const encoded = encodeURIComponent(message)

    // Try whatsapp native deep link first
    const nativeUrl = `whatsapp://send?phone=${SUPPORT_NUMBER.replace(/\+/g, '')}&text=${encoded}`
    const webUrl = `https://wa.me/${SUPPORT_NUMBER.replace(/\+/g, '')}?text=${encoded}`

    try {
      const supported = await Linking.canOpenURL(nativeUrl)
      if (supported) return Linking.openURL(nativeUrl)
    } catch (e) {
      // ignore
    }

    // fallback to web
    try {
      await Linking.openURL(webUrl)
    } catch (e) {
      console.warn('Unable to open WhatsApp:', e)
    }
  }

  const openGroup = async () => {
    try {
      await Linking.openURL(SUPPORT_GROUP)
    } catch (e) {
      console.warn('Unable to open group link', e)
    }
  }

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <View style={styles.stack}>
        <TouchableOpacity
          accessibilityLabel="Join support group"
          style={[styles.button, { backgroundColor: theme.surface }]}
          onPress={openGroup}
        >
          <Ionicons name="people" size={20} color={theme.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Chat with support"
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={openWhatsApp}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 116, // above bottom nav
    zIndex: 1000,
  },
  stack: {
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
})

export default FloatingSupportButton
