import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
import CustomAlert from '../../components/CustomAlert';

const PinSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { session } = useSession();
  const navigation = useNavigation<any>();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);
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

  useEffect(() => {
    // Check if user has PIN set
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      const response = await apiClient.get('/auth/check-pin-status');
      if (response.success) {
        const data = response.data as { hasPin: boolean; biometricEnabled: boolean };
        setHasPin(data.hasPin);
        setBiometricEnabled(data.biometricEnabled);
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
    }
  };

  const handleSetPin = async () => {
    if (!newPin || newPin.length < 4) {
      showAlert('Error', 'PIN must be at least 4 digits', 'error');
      return;
    }

    if (newPin !== confirmPin) {
      showAlert('Error', 'PINs do not match', 'error');
      return;
    }

    if (hasPin && !currentPin) {
      showAlert('Error', 'Please enter your current PIN', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = hasPin ? '/auth/change-pin' : '/auth/set-pin';
      const payload = hasPin
        ? { currentPin, newPin }
        : { pin: newPin };

      const response = await apiClient.post(endpoint, payload);

      if (response.success) {
        showAlert(
          'Success',
          hasPin ? 'PIN changed successfully' : 'PIN set successfully',
          'success',
          [
            {
              text: 'OK',
              onPress: () => {
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
                setHasPin(true);
              },
            },
          ]
        );
      } else {
        showAlert('Error', response.error || 'Failed to set PIN', 'error');
      }
    } catch (error) {
      console.error('Error setting PIN:', error);
      showAlert('Error', 'Failed to set PIN. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (!hasPin && value) {
      showAlert('Error', 'Please set a PIN first before enabling biometric authentication', 'error');
      return;
    }

    try {
      const response = await apiClient.post('/auth/toggle-biometric', { enabled: value });

      if (response.success) {
        setBiometricEnabled(value);
        showAlert('Success', value ? 'Biometric authentication enabled' : 'Biometric authentication disabled', 'success');
      } else {
        showAlert('Error', response.error || 'Failed to update biometric settings', 'error');
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      showAlert('Error', 'Failed to update biometric settings', 'error');
    }
  };

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
            <Text style={styles.title}>PIN & Biometric</Text>
            <ThemeToggle />
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.heroSection}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="key" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Security Settings
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Manage your PIN and biometric authentication
            </Text>
          </View>

          {/* PIN Section */}
          <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {hasPin ? 'Change PIN' : 'Set PIN'}
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              {hasPin
                ? 'Enter your current PIN and set a new one'
                : 'Set a 4-digit PIN for additional security'
              }
            </Text>

            {hasPin && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Current PIN</Text>
                <TextInput
                  style={[styles.pinInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter current PIN"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={currentPin}
                  onChangeText={setCurrentPin}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                {hasPin ? 'New PIN' : 'PIN'}
              </Text>
              <TextInput
                style={[styles.pinInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={newPin}
                onChangeText={setNewPin}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm PIN</Text>
              <TextInput
                style={[styles.pinInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Confirm PIN"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={confirmPin}
                onChangeText={setConfirmPin}
              />
            </View>

            <TouchableOpacity
              style={[styles.setPinButton, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
              onPress={handleSetPin}
              disabled={isLoading}
            >
              <Text style={styles.setPinButtonText}>
                {isLoading ? 'Setting...' : (hasPin ? 'Change PIN' : 'Set PIN')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Biometric Section */}
          {hasPin && (
            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.biometricHeader}>
                <View style={styles.biometricInfo}>
                  <Ionicons name="finger-print" size={24} color={theme.primary} />
                  <View style={styles.biometricText}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Biometric Authentication
                    </Text>
                    <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
                      Use fingerprint or face ID to login
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  trackColor={{ false: theme.border, true: theme.primary + '50' }}
                  thumbColor={biometricEnabled ? theme.primary : theme.textSecondary}
                />
              </View>
            </View>
          )}

          {/* Security Tips */}
          <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Security Tips</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Use a PIN you can remember but others can't guess
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Enable biometric authentication for faster login
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Never share your PIN with anyone
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Change your PIN regularly for better security
                </Text>
              </View>
            </View>
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 4,
  },
  setPinButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  setPinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  biometricText: {
    marginLeft: 12,
    flex: 1,
  },
  tipsList: {
    marginTop: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});

export default PinSettingsScreen;
