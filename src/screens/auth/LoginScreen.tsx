// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '../../contexts/SessionContext';
import CustomAlert from '../../components/CustomAlert';
import ThemeToggle from '../../components/ThemeToggle';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { signIn, session } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{ text: string; onPress: () => void; style?: 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setAlert({
        visible: true,
        title: 'Fields Required',
        message: 'Please enter both email and password',
        type: 'warning',
      });
      return;
    }

    if (!email.includes('@')) {
      setAlert({
        visible: true,
        title: 'Invalid Email',
        message: 'Please enter a valid email address',
        type: 'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.success) {
        setAlert({
          visible: true,
          title: 'Login Failed',
          message: result.error || 'An error occurred. Please try again.',
          type: 'error',
        });
      } else {
        // Decide where to navigate based on KYC and pending KYC data
        try {
          const pending = await AsyncStorage.getItem('kycPendingCustomer');
          if (result.kycRequired || pending) {
            setAlert({ visible: true, title: 'KYC Required', message: 'Please complete KYC verification to continue.', type: 'warning', buttons: undefined });
            navigation.navigate('KYC');
          } else {
            navigation.navigate('Main');
          }
        } catch (e) {
          navigation.navigate('Main');
        }
      }
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#012201', '#023502']
          : ['#49EE49', '#89EB89']
      }
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Theme Toggle */}
          <View style={styles.headerTop}>
            <View />
            <ThemeToggle />
          </View>

          {/* Main Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? 'rgba(4, 118, 3, 0.2)' : 'rgba(4, 118, 3, 0.1)' },
              ]}
            >
              <Ionicons
                name="log-in"
                size={40}
                color={isDark ? '#0a8f0a' : '#047603'}
              />
            </View>
            <Text style={[styles.welcomeText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitleText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
              Sign in to your account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#042B04' : '#62C062',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <Ionicons
                  name="mail"
                  size={20}
                  color={isDark ? '#0DBD0D' : '#286B28'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: isDark ? '#f1f5f9' : '#0f172a' }]}
                  placeholder="your@email.com"
                  placeholderTextColor={isDark ? '#64748b' : '#cbd5e1'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#042B04' : '#62C062',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={isDark ? '#0DBD0D' : '#286B28'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: isDark ? '#f1f5f9' : '#0f172a' }]}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#64748b' : '#cbd5e1'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#0DBD0D' : '#286B28'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotPasswordText, { color: isDark ? '#0DBD0D' : '#286B28' }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#047603', '#0a8f0a']}
              style={styles.loginButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="log-in"
                    size={20}
                    color="#ffffff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={[styles.signupLink, { color: isDark ? '#0a8f0a' : '#047603' }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttons={[
          {
            text: 'OK',
            onPress: () => setAlert({ ...alert, visible: false }),
          },
        ]}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitleText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LoginScreen;