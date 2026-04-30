// src/screens/ForgotPasswordScreen.tsx
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import CustomAlert from '../../components/CustomAlert';
import ThemeToggle from '../../components/ThemeToggle';

const { width, height } = Dimensions.get('window');

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { theme, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setAlert({
        visible: true,
        title: 'Email Required',
        message: 'Please enter your email address',
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
      const response = await apiClient.post('/auth/forgot-password', {
        email: email.trim(),
      });

      if (response.success) {
        setAlert({
          visible: true,
          title: 'Check Your Email',
          message: 'We have sent a password reset link to your email address. Please check your inbox and follow the instructions.',
          type: 'success',
        });
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        setAlert({
          visible: true,
          title: 'Error',
          message: response.error || 'Failed to process your request. Please try again.',
          type: 'error',
        });
      }
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Network Error',
        message: 'Please check your connection and try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#012201', '#023502']
          : ['#fafafa', '#ffffff']
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
          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? 'rgba(4, 118, 3, 0.2)' : 'rgba(4, 118, 3, 0.1)' },
              ]}
            >
              <Ionicons
                name="key"
                size={50}
                color={isDark ? '#0a8f0a' : '#047603'}
              />
            </View>

            {/* Title */}
            <Text
              style={[
                styles.title,
                { color: isDark ? '#ffffff' : '#0f172a' },
              ]}
            >
              Reset Password
            </Text>

            {/* Header with back button and theme toggle - moved down */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={isDark ? '#facc15' : '#047603'}
                />
              </TouchableOpacity>
              <ThemeToggle />
            </View>

            {/* Subtitle */}
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? '#cbd5e1' : '#64748b' },
              ]}
            >
              Enter your email address and we'll send you a link to reset your password
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDark ? '#f1f5f9' : '#0f172a' },
                ]}
              >
                Email Address
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <Ionicons
                  name="mail"
                  size={20}
                  color={isDark ? '#64748b' : '#94a3b8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: isDark ? '#f1f5f9' : '#0f172a' },
                  ]}
                  placeholder="your@email.com"
                  placeholderTextColor={isDark ? '#64748b' : '#cbd5e1'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#047603', '#0a8f0a']}
                style={styles.resetButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="send"
                      size={20}
                      color="#ffffff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLoginContainer}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={16}
                color={isDark ? '#0a8f0a' : '#047603'}
              />
              <Text
                style={[
                  styles.backToLoginText,
                  { color: isDark ? '#0a8f0a' : '#047603' },
                ]}
              >
                Back to Sign In
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
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
  resetButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ForgotPasswordScreen;