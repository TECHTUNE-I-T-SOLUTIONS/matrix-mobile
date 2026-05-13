// src/screens/dashboard/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import ThemeToggle from '../../components/ThemeToggle';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAutoCheckEnabled, setAutoCheckEnabled } from '../../hooks/useAutoUpdateCheck';
import CustomAlert from '../../components/CustomAlert';

const SettingsScreen: React.FC = () => {
  const { theme, isDark, setThemeMode } = useTheme();
  const { signOut } = useSession();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [autoCheckUpdates, setAutoCheckUpdates] = useState<boolean>(true);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    buttons: undefined as
      | Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
      | undefined,
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ) => setAlertConfig({ visible: true, title, message, type, buttons });

  const closeAlert = () => setAlertConfig((c) => ({ ...c, visible: false }));

  // load saved setting
  React.useEffect(() => {
    (async () => {
      try {
        const enabled = await isAutoCheckEnabled()
        setAutoCheckUpdates(enabled)
      } catch (e) {
        console.warn('Failed to load auto-check updates setting', e)
      }
    })()
  }, [])

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', 'warning', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Logout error:', error);
            showAlert('Error', 'Failed to logout. Please try again.', 'error');
          }
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'key',
          label: 'PIN & Biometric',
          onPress: () => navigation.navigate('PinSettings'),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'lock-closed',
          label: 'Auto Lock',
          type: 'switch',
          value: autoLock,
          onValueChange: setAutoLock,
        },
        {
          icon: 'key',
          label: 'Change Password',
          onPress: () => showAlert('Coming Soon', 'Password change feature will be available soon.'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications',
          label: 'Push Notifications',
          type: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
        {
          icon: 'mail',
          label: 'Email Notifications',
          onPress: () => showAlert('Coming Soon', 'Email notification settings will be available soon.'),
        },
        {
          icon: 'phone-portrait',
          label: 'SMS Notifications',
          onPress: () => showAlert('Coming Soon', 'SMS notification settings will be available soon.'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon',
          label: 'Dark Mode',
          type: 'switch',
          value: isDark,
          onValueChange: (value: boolean) => {
            setThemeMode(value ? 'dark' : 'light');
          },
        },
        {
          icon: 'globe',
          label: 'Currency',
          onPress: () => showAlert('Currency', 'Currently set to Nigerian Naira (NGN).'),
        },
        {
          icon: 'download',
          label: 'Auto-check updates on startup',
          type: 'switch',
          value: autoCheckUpdates,
          onValueChange: async (v: boolean) => {
            setAutoCheckUpdates(v)
            try {
              await setAutoCheckEnabled(v)
            } catch (e) {
              console.warn('Failed to save auto-check setting', e)
            }
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          label: 'Help & Support',
          onPress: () => navigation.navigate('Support'),
        },
        {
          icon: 'document-text',
          label: 'Terms of Service',
          onPress: () => navigation.navigate('TermsOfService'),
        },
        {
          icon: 'shield',
          label: 'Privacy Policy',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
      ],
    },
  ];

  return (
    <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.container}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
            <ThemeToggle />
          </View>
        </View>

        <ScrollView style={styles.content}>
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {section.title}
              </Text>
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    <TouchableOpacity
                      style={styles.settingItem}
                      onPress={item.onPress}
                      disabled={item.type === 'switch'}
                    >
                      <View style={styles.settingContent}>
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color={theme.primary}
                        />
                        <Text style={[styles.settingLabel, { color: theme.text }]}>
                          {item.label}
                        </Text>
                      </View>
                      {item.type === 'switch' ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onValueChange}
                          trackColor={{ false: theme.border, true: theme.primary + '50' }}
                          thumbColor={item.value ? theme.primary : theme.textSecondary}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                    {itemIndex < section.items.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: '#ef4444' }]}
              onPress={handleLogout}
            >
              <View style={styles.settingContent}>
                <Ionicons
                  name="log-out"
                  size={20}
                  color="#ef4444"
                />
                <Text style={styles.logoutText}>Logout</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#ef4444"
              />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={closeAlert} />
      </LinearGradient>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 12,
  },
});

export default SettingsScreen;
