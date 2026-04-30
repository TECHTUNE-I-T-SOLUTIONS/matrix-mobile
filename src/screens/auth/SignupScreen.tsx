// src/screens/SignupScreen.tsx
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { apiClient } from '../../services/apiClient';
import ProgressIndicator from '../../components/ProgressIndicator';
import ThemeToggle from '../../components/ThemeToggle';
import CustomAlert from '../../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

type SignupMode = 'new' | 'existing';

interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob?: string;
  status: string;
  country: string;
  kyc_status?: 'pending' | 'submitted' | 'verified' | 'rejected' | 'not_started';
}

interface EmailCheckResponse {
  exists: boolean;
  type?: 'database' | 'payscribe';
  customer?: Customer;
}

interface SignupResponse {
  success: boolean;
  user?: any;
  message?: string;
}

interface PayscribeCustomerResponse {
  success: boolean;
  customer?: Customer;
  message?: string;
}

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { signUp } = useSession();

  const [mode, setMode] = useState<SignupMode>('new');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    buttons: undefined as Array<{ text: string; onPress: () => void; style?: 'cancel' | 'destructive' }> | undefined,
  });

  // NEW USER FORM
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  // EXISTING CUSTOMER FORM
  const [existingForm, setExistingForm] = useState({
    email: '',
  });
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [verificationField, setVerificationField] = useState<'phone' | 'dob'>('phone');
  const [verificationValue, setVerificationValue] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const getStepLabels = () => {
    if (mode === 'new') {
      return ['Email Check', 'Details', 'Security', 'Terms'];
    }
    return ['Find Account', 'Verify', 'Setup', 'Complete'];
  };

  const getTotalSteps = () => {
    return mode === 'new' ? 4 : 4;
  };

  // ===== FORM VALIDATION =====
  const validateStep1 = () => {
    if (!newUserForm.email.trim()) {
      setAlert({
        visible: true,
        title: 'Email Required',
        message: 'Please enter an email address to continue',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (!newUserForm.email.includes('@') || !newUserForm.email.includes('.')) {
      setAlert({
        visible: true,
        title: 'Invalid Email',
        message: 'Please enter a valid email address',
        type: 'error',
        buttons: undefined,
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!newUserForm.firstName.trim()) {
      setAlert({
        visible: true,
        title: 'First Name Required',
        message: 'Please enter your first name',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (!newUserForm.lastName.trim()) {
      setAlert({
        visible: true,
        title: 'Last Name Required',
        message: 'Please enter your last name',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (!newUserForm.mobile.trim()) {
      setAlert({
        visible: true,
        title: 'Phone Required',
        message: 'Please enter your phone number',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    // Validate phone format
    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    if (!phoneRegex.test(newUserForm.mobile.replace(/\s/g, ''))) {
      setAlert({
        visible: true,
        title: 'Invalid Phone Format',
        message: 'Use 08012345678 or +2348012345678',
        type: 'error',
        buttons: undefined,
      });
      return false;
    }

    if (!newUserForm.username.trim()) {
      setAlert({
        visible: true,
        title: 'Username Required',
        message: 'Please choose a username',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (newUserForm.username.length < 3) {
      setAlert({
        visible: true,
        title: 'Username Too Short',
        message: 'Username must be at least 3 characters',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    if (!newUserForm.password.trim()) {
      setAlert({
        visible: true,
        title: 'Password Required',
        message: 'Please create a password',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (newUserForm.password.length < 8) {
      setAlert({
        visible: true,
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters for security',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (newUserForm.password !== newUserForm.confirmPassword) {
      setAlert({
        visible: true,
        title: 'Password Mismatch',
        message: 'The passwords you entered do not match',
        type: 'error',
        buttons: undefined,
      });
      return false;
    }

    if (!acceptTerms) {
      setAlert({
        visible: true,
        title: 'Terms Required',
        message: 'Please accept terms and conditions to continue',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    return true;
  };

  const validateExistingStep1 = () => {
    if (!existingForm.email.trim()) {
      setAlert({
        visible: true,
        title: 'Email Required',
        message: 'Please enter an email to search',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (!existingForm.email.includes('@') || !existingForm.email.includes('.')) {
      setAlert({
        visible: true,
        title: 'Invalid Email',
        message: 'Please enter a valid email address',
        type: 'error',
        buttons: undefined,
      });
      return false;
    }

    return true;
  };

  const validateExistingStep2 = () => {
    if (!foundCustomer) {
      setAlert({
        visible: true,
        title: 'No Customer Found',
        message: 'Please search for your account first',
        type: 'error',
        buttons: undefined,
      });
      return false;
    }

    if (verificationField === 'phone' && !verificationValue.trim()) {
      setAlert({
        visible: true,
        title: 'Phone Required',
        message: 'Please enter your phone number for verification',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (verificationField === 'dob' && !verificationValue.trim()) {
      setAlert({
        visible: true,
        title: 'Date of Birth Required',
        message: 'Please enter your date of birth (DD/MM/YYYY)',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    return true;
  };

  const validateExistingStep3 = () => {
    if (!username.trim()) {
      setAlert({
        visible: true,
        title: 'Username Required',
        message: 'Please choose a username',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (username.length < 3) {
      setAlert({
        visible: true,
        title: 'Username Too Short',
        message: 'Username must be at least 3 characters',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (!password.trim()) {
      setAlert({
        visible: true,
        title: 'Password Required',
        message: 'Please create a password',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (password.length < 8) {
      setAlert({
        visible: true,
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters for security',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    if (password !== confirmPassword) {
      setAlert({
        visible: true,
        title: 'Password Mismatch',
        message: 'The passwords you entered do not match',
        type: 'error',
        buttons: undefined,
      });
      return false;
    }

    if (!acceptTerms) {
      setAlert({
        visible: true,
        title: 'Terms Required',
        message: 'Please accept terms and conditions to continue',
        type: 'warning',
        buttons: undefined,
      });
      return false;
    }

    return true;
  };

  // ===== STEP NAVIGATION =====
  const handleNextStep = () => {
    if (mode === 'new') {
      if (step === 1 && validateStep1()) {
        setStep(2);
      } else if (step === 2 && validateStep2()) {
        setStep(3);
      } else if (step === 3 && validateStep3()) {
        setStep(4);
      }
    } else {
      if (step === 1 && validateExistingStep1()) {
        setStep(2);
      } else if (step === 2 && validateExistingStep2()) {
        setStep(3);
      } else if (step === 3 && validateExistingStep3()) {
        setStep(4);
      }
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  const handleCheckEmailNew = async () => {
    if (!newUserForm.email.trim()) {
      setAlert({
        visible: true,
        title: 'Email Required',
        message: 'Please enter an email address to continue',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    if (!newUserForm.email.includes('@')) {
      setAlert({
        visible: true,
        title: 'Invalid Email',
        message: 'Please enter a valid email address',
        type: 'error',
        buttons: undefined,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<EmailCheckResponse>(`/auth/signup?email=${encodeURIComponent(newUserForm.email.trim())}`);

      if (response.success && response.data) {
        const emailCheckData = response.data as EmailCheckResponse;

        if (emailCheckData.exists) {
          if (emailCheckData.type === 'database') {
            // Check if user has completed KYC
            const hasCompletedKYC = emailCheckData.customer?.status === 'verified' || emailCheckData.customer?.kyc_status === 'verified';

            if (hasCompletedKYC) {
              setAlert({
                visible: true,
                title: 'Email Already Registered',
                message: 'This email is already registered with a verified account. Please sign in instead.',
                type: 'warning',
                buttons: [
                  { text: 'Sign In', onPress: () => { navigation.navigate('Login'); setAlert({ ...alert, visible: false }); } },
                  { text: 'Use Different Email', onPress: () => setAlert({ ...alert, visible: false }), style: 'cancel' },
                ],
              });
            } else {
              setAlert({
                visible: true,
                title: 'Account Setup Incomplete',
                message: 'You have an account but haven\'t completed KYC verification. Please sign in to complete your verification.',
                type: 'info',
                buttons: [
                  { text: 'Sign In', onPress: () => { navigation.navigate('Login'); setAlert({ ...alert, visible: false }); } },
                  { text: 'Forgot Password?', onPress: () => { navigation.navigate('ForgotPassword'); setAlert({ ...alert, visible: false }); }, style: 'cancel' },
                ],
              });
            }
            return;
          }

          if (emailCheckData.type === 'payscribe') {
            // Auto-switch to existing customer mode
            setExistingForm({ email: newUserForm.email });
            setFoundCustomer(emailCheckData.customer || null);
            setMode('existing');
            setStep(2);
            setAlert({
              visible: true,
              title: 'Account Found',
              message: `Welcome back, ${emailCheckData.customer?.firstName}! Let's verify your details.`,
              type: 'success',
              buttons: undefined,
            });
            return;
          }
        }

        setAlert({
          visible: true,
          title: 'Email Available',
          message: 'Great! This email is available. Continue to create your account.',
          type: 'success',
          buttons: undefined,
        });
        setStep(2);
      } else {
        setAlert({
          visible: true,
          title: 'Error',
          message: response.error || 'Failed to check email availability',
          type: 'error',
          buttons: undefined,
        });
      }
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Network Error',
        message: 'Please check your connection and try again',
        type: 'error',
        buttons: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewAccount = async () => {
    // Validation
    if (!newUserForm.firstName.trim() || !newUserForm.lastName.trim()) {
      setAlert({
        visible: true,
        title: 'Name Required',
        message: 'Please enter your first and last name to continue',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    if (!newUserForm.email.trim()) {
      setAlert({
        visible: true,
        title: 'Email Required',
        message: 'Please enter a valid email address',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    if (!newUserForm.mobile.trim()) {
      setAlert({
        visible: true,
        title: 'Phone Required',
        message: 'Please enter your phone number (Format: 08012345678 or +2348012345678)',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    // Validate phone format
    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    if (!phoneRegex.test(newUserForm.mobile.replace(/\s/g, ''))) {
      setAlert({
        visible: true,
        title: 'Invalid Phone Format',
        message: 'Use 08012345678 or +2348012345678',
        type: 'error',
        buttons: undefined,
      });
      return;
    }

    if (!newUserForm.username.trim()) {
      setAlert({
        visible: true,
        title: 'Username Required',
        message: 'Please choose a username',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    if (newUserForm.password.length < 8) {
      setAlert({
        visible: true,
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters for security',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    if (newUserForm.password !== newUserForm.confirmPassword) {
      setAlert({
        visible: true,
        title: 'Password Mismatch',
        message: 'The passwords you entered do not match',
        type: 'error',
        buttons: undefined,
      });
      return;
    }

    if (!acceptTerms) {
      setAlert({
        visible: true,
        title: 'Terms Required',
        message: 'Please accept terms and conditions to continue',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<SignupResponse>('/auth/signup', {
        ...newUserForm,
        step: 'create',
        referralCode: newUserForm.referralCode || undefined,
      });

      if (response.success) {
        setAlert({
          visible: true,
          title: 'Account Created!',
          message: 'Your account has been created successfully! Redirecting to KYC verification...',
          type: 'success',
          buttons: undefined,
        });
        // Store user data for KYC
        setTimeout(() => {
          navigation.navigate('KYC');
        }, 2000);
      } else {
        Alert.alert('❌ Signup Failed', response.error || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('🚨 Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== EXISTING CUSTOMER FLOW =====
  const handleSearchExisting = async () => {
    if (!existingForm.email) {
      setAlert({
        visible: true,
        title: 'Email Required',
        message: 'Please enter an email to search',
        type: 'warning',
        buttons: undefined,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get(`/auth/signup?email=${encodeURIComponent(existingForm.email)}`);

      if (response.success) {
        const searchData = response.data as EmailCheckResponse;

        if (!searchData.exists) {
          setAlert({
            visible: true,
            title: 'Not Found',
            message: 'No account found with this email. Would you like to create a new account?',
            type: 'info',
            buttons: [
              { text: 'Create New', onPress: () => { setMode('new'); setAlert({ ...alert, visible: false }); } },
              { text: 'Try Again', onPress: () => setAlert({ ...alert, visible: false }), style: 'cancel' },
            ],
          });
          return;
        }

        if (searchData.type === 'database') {
          setAlert({
            visible: true,
            title: 'Already Registered',
            message: 'This email is already registered. Please sign in instead',
            type: 'info',
            buttons: undefined,
          });
          return;
        }

        if (searchData.type === 'payscribe') {
          if (searchData.customer?.status === 'blacklist') {
            setAlert({
              visible: true,
              title: 'Account Blacklisted',
              message: 'Your account is blacklisted. Please contact support',
              type: 'error',
              buttons: undefined,
            });
            return;
          }

          setFoundCustomer(searchData.customer || null);
          setStep(2);
          setAlert({
            visible: true,
            title: 'Welcome Back',
            message: `Found your account, ${searchData.customer?.firstName}!`,
            type: 'success',
            buttons: undefined,
          });
          return;
        }
      } else {
        setAlert({
          visible: true,
          title: 'Error',
          message: response.error || 'Failed to search for account',
          type: 'error',
          buttons: undefined,
        });
      }
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Network Error',
        message: 'Please check your connection',
        type: 'error',
        buttons: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyExisting = async () => {
    if (!verificationValue) {
      Alert.alert('🔍 Verification Required', `Please enter your ${verificationField === 'phone' ? 'phone number' : 'date of birth'}!`);
      return;
    }

    if (!foundCustomer) {
      Alert.alert('❌ Error', 'Customer not found');
      return;
    }

    setIsLoading(true);
    try {
      // Simple client-side verification (in production, verify server-side)
      let isValid = false;

      if (verificationField === 'phone') {
        const normalizedInput = verificationValue.replace(/\D/g, '');
        const normalizedStored = (foundCustomer.phone || '').replace(/\D/g, '');
        isValid = normalizedInput === normalizedStored;
      } else if (verificationField === 'dob') {
        isValid = verificationValue === foundCustomer.dob;
      }

      if (!isValid) {
        Alert.alert('❌ Verification Failed', `The ${verificationField} you entered doesn't match our records.`);
        return;
      }

      Alert.alert('✅ Verified!', 'Identity verified successfully! Now create your password.');
      setStep(3);
    } catch (error) {
      Alert.alert('🚨 Error', 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteExisting = async () => {
    if (!username.trim()) {
      Alert.alert('👤 Username Required', 'Please enter a username!');
      return;
    }

    if (password.length < 8) {
      Alert.alert('🔒 Password Too Short', 'Password must be at least 8 characters!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('🔄 Password Mismatch', 'Passwords do not match!');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('📋 Terms Required', 'Please accept terms and conditions!');
      return;
    }

    if (!foundCustomer) {
      Alert.alert('❌ Error', 'Customer not found');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<SignupResponse>('/auth/signup', {
        customerId: foundCustomer.customerId,
        email: foundCustomer.email,
        username,
        password,
        step: 'complete_existing',
      });

      if (response.success) {
        setAlert({
          visible: true,
          title: 'Account Linked!',
          message: 'Your account has been linked successfully! Proceeding to KYC verification...',
          type: 'success',
          buttons: undefined,
        });
        setTimeout(() => {
          navigation.navigate('KYC');
        }, 1500);
      } else {
        Alert.alert('❌ Linking Failed', response.error || 'Failed to complete signup');
      }
    } catch (error) {
      Alert.alert('🚨 Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const renderNewUserStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Let's Get Started!</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Enter your email to check availability and get started
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={theme.inputPlaceholder}
                value={newUserForm.email}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.singlePrimaryButton,
                { backgroundColor: theme.primary },
                isLoading && styles.disabledButton,
              ]}
              onPress={handleCheckEmailNew}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Check Email →</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Tell Us About Yourself</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Fill in your personal details
            </Text>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="John"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={newUserForm.firstName}
                  onChangeText={(text) => setNewUserForm({ ...newUserForm, firstName: text })}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Doe"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={newUserForm.lastName}
                  onChangeText={(text) => setNewUserForm({ ...newUserForm, lastName: text })}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Phone Number
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {' '}(Format: 08012345678 or +2348012345678)
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="08012345678 or +2348012345678"
                placeholderTextColor={theme.inputPlaceholder}
                value={newUserForm.mobile}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, mobile: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="johndoe"
                placeholderTextColor={theme.inputPlaceholder}
                value={newUserForm.username}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, username: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Referral Code
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {' '}(Optional - Earn rewards)
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Enter referral code"
                placeholderTextColor={theme.inputPlaceholder}
                value={newUserForm.referralCode}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, referralCode: text.toUpperCase() })}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setStep(1)}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleNextStep}
              >
                <Text style={styles.primaryButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Secure Your Account</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Create a strong password to protect your account
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={newUserForm.password}
                  onChangeText={(text) => setNewUserForm({ ...newUserForm, password: text })}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Re-enter password"
                placeholderTextColor={theme.inputPlaceholder}
                value={newUserForm.confirmPassword}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, confirmPassword: text })}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setStep(2)}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleNextStep}
              >
                <Text style={styles.primaryButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Almost There!</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Review and accept our terms to complete your account
            </Text>

            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && { backgroundColor: theme.primary }]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                  I agree to the{' '}
                  <Text style={[styles.linkText, { color: theme.primary }]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.linkText, { color: theme.primary }]}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.singlePrimaryButton,
                { backgroundColor: theme.primary },
                (!acceptTerms || isLoading) && styles.disabledButton,
              ]}
              onPress={handleCreateNewAccount}
              disabled={!acceptTerms || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account 🎉</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.singleSecondaryButton, { borderColor: theme.border }]}
              onPress={() => setStep(3)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>← Back</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const renderExistingUserStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Welcome Back! 🔍</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Enter your email to find your existing account
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={theme.inputPlaceholder}
                value={existingForm.email}
                onChangeText={(text) => setExistingForm({ ...existingForm, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.singlePrimaryButton,
                { backgroundColor: theme.primary },
                isLoading && styles.disabledButton,
              ]}
              onPress={handleSearchExisting}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Search Account 🔍</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 2:
        return foundCustomer ? (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Verify Your Identity ✅</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              We found {foundCustomer.firstName} {foundCustomer.lastName}. Please verify it's you.
            </Text>

            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: theme.text }]}>
                {foundCustomer.firstName} {foundCustomer.lastName}
              </Text>
              <Text style={[styles.customerEmail, { color: theme.textSecondary }]}>
                {foundCustomer.email}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Verify by {verificationField === 'phone' ? 'Phone Number' : 'Date of Birth'}
              </Text>
              {verificationField === 'phone' ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={verificationValue}
                  onChangeText={setVerificationValue}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              ) : (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={verificationValue}
                  onChangeText={setVerificationValue}
                  editable={!isLoading}
                />
              )}
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setVerificationField(verificationField === 'phone' ? 'dob' : 'phone')}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                Verify using {verificationField === 'phone' ? 'DOB' : 'Phone'} instead
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setStep(1)}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.primary },
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleVerifyExisting}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify →</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null;

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Set Up Your Account 🔧</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Create your username and password
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="johndoe"
                placeholderTextColor={theme.inputPlaceholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="At least 8 characters"
                placeholderTextColor={theme.inputPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Re-enter password"
                placeholderTextColor={theme.inputPlaceholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={() => setStep(2)}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleNextStep}
              >
                <Text style={styles.primaryButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Final Step! 🎯</Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              Accept our terms to complete your account setup
            </Text>

            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && { backgroundColor: theme.primary }]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                  I agree to the{' '}
                  <Text style={[styles.linkText, { color: theme.primary }]}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.linkText, { color: theme.primary }]}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.singlePrimaryButton,
                { backgroundColor: theme.primary },
                (!acceptTerms || isLoading) && styles.disabledButton,
              ]}
              onPress={handleCompleteExisting}
              disabled={!acceptTerms || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Complete Setup 🎉</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setStep(3)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>← Back</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      style={styles.container}
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
          <View style={styles.header}>
            <ThemeToggle />
          </View>

          {/* Mode Toggle */}
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'new' && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setMode('new');
                setStep(1);
              }}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: mode === 'new' ? '#ffffff' : theme.text },
                ]}
              >
                New Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'existing' && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setMode('existing');
                setStep(1);
              }}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: mode === 'existing' ? '#ffffff' : theme.text },
                ]}
              >
                Existing Customer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <ProgressIndicator
            currentStep={step}
            totalSteps={getTotalSteps()}
            stepLabels={getStepLabels()}
          />

          {/* Step Content */}
          {mode === 'new' ? renderNewUserStep() : renderExistingUserStep()}

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Alert */}
          <CustomAlert
            visible={alert.visible}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            buttons={alert.buttons}
            onClose={() => setAlert({ ...alert, visible: false })}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 30,
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 2,
  },
  eyeText: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  singlePrimaryButton: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
  },
  singleSecondaryButton: {
    height: 48,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  termsContainer: {
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    fontWeight: '600',
  },
  customerInfo: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupScreen;
