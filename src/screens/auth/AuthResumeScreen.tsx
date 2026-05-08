import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../../contexts/SessionContext';
import ThemeToggle from '../../components/ThemeToggle';

const AuthResumeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { session, signIn, signOut, completeResumeAuth } = useSession();
  const navigation = useNavigation<any>();

  const [authMethod, setAuthMethod] = useState<'password' | 'pin' | 'biometric'>('password');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    photo_url?: string;
    full_name?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    checkBiometricSupport();
    checkUserAuthSettings();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricSupported(compatible && enrolled);
  };

  const checkUserAuthSettings = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';

      // Fetch PIN and biometric status
      const authResponse = await fetch(`${apiUrl}/auth/check-pin-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        setHasPin(authData.hasPin);
        setBiometricEnabled(authData.biometricEnabled);
      }

      // Fetch user profile data
      const profileResponse = await fetch(`${apiUrl}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData.user); // Extract user data from response
      }
    } catch (error) {
      console.error('Error checking user settings:', error);
    }
  };

  const handlePasswordAuth = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      // Try to sign in with the stored email and entered password
      const result = await signIn(session?.user?.email || '', password);

      if (result.success) {
        // Update last login
        await updateLastLogin();
        // Complete resume authentication
        await completeResumeAuth();
        const pending = await AsyncStorage.getItem('kycPendingCustomer');
        if (result.kycRequired || pending) {
          navigation.replace('KYC');
        } else {
          navigation.replace('Main');
        }
      } else {
        Alert.alert('Authentication Failed', result.error || 'Invalid password');
      }
    } catch (error) {
      console.error('Password auth error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinAuth = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Error', 'Please enter your 4-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';
      const response = await fetch(`${apiUrl}/auth/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        await updateLastLogin();
        // Complete resume authentication
        await completeResumeAuth();
        navigation.replace('Main');
      } else {
        const error = await response.json();
        Alert.alert('Authentication Failed', error.error || 'Invalid PIN');
      }
    } catch (error) {
      console.error('PIN auth error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Verify with backend
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';
        const response = await fetch(`${apiUrl}/auth/verify-biometric`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        });

        if (response.ok) {
          await updateLastLogin();
          // Complete resume authentication
          await completeResumeAuth();
          navigation.replace('Main');
        } else {
          Alert.alert('Error', 'Biometric verification failed');
        }
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const updateLastLogin = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';
      await fetch(`${apiUrl}/auth/update-last-login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  const handleLogout = () => {
    console.log('[AuthResumeScreen] Logout button pressed');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('[AuthResumeScreen] Logout confirmed, calling signOut');
            await signOut();
            console.log('[AuthResumeScreen] signOut completed');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header with Theme Toggle */}
        <View style={styles.header}>
          <ThemeToggle />
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          {userProfile?.photo_url ? (
            <Image
              source={{ uri: userProfile.photo_url }}
              style={styles.avatar}
            />
          ) : session?.user?.avatar_url ? (
            <Image
              source={{ uri: session.user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="person" size={40} color={theme.primary} />
            </View>
          )}
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            Welcome back
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {userProfile?.full_name || session?.user?.full_name || session?.user?.email}
          </Text>
          {userProfile?.email && (
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {userProfile.email}
            </Text>
          )}
        </View>

        {/* Auth Methods */}
        <View style={styles.authSection}>
          <View style={styles.methodTabs}>
            <TouchableOpacity
              style={[
                styles.methodTab,
                authMethod === 'password' && { backgroundColor: theme.primary + '20' }
              ]}
              onPress={() => setAuthMethod('password')}
            >
              <Text style={[
                styles.methodTabText,
                { color: authMethod === 'password' ? theme.primary : theme.textSecondary }
              ]}>
                Password
              </Text>
            </TouchableOpacity>

            {hasPin && (
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  authMethod === 'pin' && { backgroundColor: theme.primary + '20' }
                ]}
                onPress={() => setAuthMethod('pin')}
              >
                <Text style={[
                  styles.methodTabText,
                  { color: authMethod === 'pin' ? theme.primary : theme.textSecondary }
                ]}>
                  PIN
                </Text>
              </TouchableOpacity>
            )}

            {biometricSupported && biometricEnabled && (
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  authMethod === 'biometric' && { backgroundColor: theme.primary + '20' }
                ]}
                onPress={() => setAuthMethod('biometric')}
              >
                <Ionicons
                  name="finger-print"
                  size={20}
                  color={authMethod === 'biometric' ? theme.primary : theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Auth Forms */}
          {authMethod === 'password' && (
            <View style={styles.authForm}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Enter your password</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: theme.primary }]}
                onPress={handlePasswordAuth}
                disabled={isLoading}
              >
                <Text style={styles.authButtonText}>
                  {isLoading ? 'Authenticating...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {authMethod === 'pin' && hasPin && (
            <View style={styles.authForm}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Enter your PIN</Text>
              <TextInput
                style={[styles.pinInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="0000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={pin}
                onChangeText={setPin}
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: theme.primary }]}
                onPress={handlePinAuth}
                disabled={isLoading}
              >
                <Text style={styles.authButtonText}>
                  {isLoading ? 'Authenticating...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {authMethod === 'biometric' && biometricSupported && biometricEnabled && (
            <View style={styles.authForm}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                Use biometric authentication
              </Text>
              <TouchableOpacity
                style={[styles.biometricButton, { backgroundColor: theme.primary + '20' }]}
                onPress={handleBiometricAuth}
              >
                <Ionicons name="finger-print" size={48} color={theme.primary} />
                <Text style={[styles.biometricText, { color: theme.primary }]}>
                  Touch to authenticate
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout Option */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: theme.textSecondary }]}>
            Not you? Logout
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 1,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  authSection: {
    marginBottom: 40,
  },
  methodTabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  authForm: {
    alignItems: 'center',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 24,
  },
  pinInput: {
    width: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    marginBottom: 24,
    letterSpacing: 8,
  },
  authButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  logoutButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 14,
  },
});

export default AuthResumeScreen;