// src/screens/auth/KYCScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient as api } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
import CustomAlert from '../../components/CustomAlert';

const { width, height } = Dimensions.get('window');

type KYCScreenNavigationProp = StackNavigationProp<RootStackParamList, 'KYC'>;

interface KYCData {
  idType: 'passport' | 'drivers_license' | 'national_id' | '';
  idNumber: string;
  identificationType: 'BVN' | 'NIN' | '';
  identificationNumber: string;
  dob: string;
  idImage: string | null;
  selfieImage: string | null;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const KYCScreen: React.FC<any> = ({ route }) => {
  const navigation = useNavigation<KYCScreenNavigationProp>();
  const { theme } = useTheme();
  const { session } = useSession();

  // Use user details from route params if available, otherwise from session
  const initialUser = route?.params?.user || session?.user;

  const [kycData, setKycData] = useState<KYCData>({
    idType: '',
    idNumber: '',
    identificationType: '',
    identificationNumber: '',
    dob: '',
    idImage: null,
    selfieImage: null,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'NG',
  });

  const [showStateModal, setShowStateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = Welcome/Marketing, 1-3 = Form
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date(2000, 0, 1));

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    buttons: [] as any[],
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', buttons?: any[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons: buttons || [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }],
    });
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [currentStep]);

  const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
  ];

  const steps = [
    'Identity',
    'Address',
    'Review',
  ];

  const idTypes = [
    { value: 'passport', label: 'Passport', icon: 'journal' },
    { value: 'drivers_license', label: "License", icon: 'card' },
    { value: 'national_id', label: 'National ID', icon: 'document' },
  ];

  const pickImage = async (type: 'id' | 'selfie') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please grant camera roll permissions', 'warning');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'id' ? [3, 2] : [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setKycData({ ...kycData, [type === 'id' ? 'idImage' : 'selfieImage']: result.assets[0].uri });
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setKycData({ ...kycData, idImage: result.assets[0].uri });
      }
    } catch (err) {
      showAlert('Error', 'Failed to pick document', 'error');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDobDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setKycData({ ...kycData, dob: formattedDate });
    }
  };

  const takePhoto = async (type: 'id' | 'selfie') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please grant camera permissions', 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'id' ? [3, 2] : [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setKycData({ ...kycData, [type === 'id' ? 'idImage' : 'selfieImage']: result.assets[0].uri });
    }
  };

  const validateStep1 = () => {
    if (!kycData.idType || !kycData.idNumber.trim()) {
      showAlert('Missing Info', 'Please provide ID type and number', 'warning'); return false;
    }
    if (!kycData.identificationType || !kycData.identificationNumber.trim()) {
      showAlert('Missing Info', 'Please provide BVN or NIN', 'warning'); return false;
    }
    if (kycData.identificationType === 'BVN' && kycData.identificationNumber.length !== 11) {
      showAlert('Invalid BVN', 'BVN must be 11 digits', 'error'); return false;
    }
    if (!kycData.idImage || !kycData.selfieImage || !kycData.dob) {
      showAlert('Missing Info', 'Please provide photos and date of birth', 'warning'); return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!kycData.address.trim() || !kycData.city.trim() || !kycData.state.trim() || !kycData.postalCode.trim()) {
      showAlert('Missing Info', 'Please complete your address details', 'warning'); return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let userId = session.user?.id;
      let email = session.user?.email || '';
      const _metadata = (session.user as any)?.user_metadata || {};
      let firstName = _metadata?.first_name || '';
      let lastName = _metadata?.last_name || '';
      let phone = _metadata?.mobile || _metadata?.phone || '';

      if (!userId) {
        const stored = await AsyncStorage.getItem('kycPendingCustomer');
        if (stored) {
          const pending = JSON.parse(stored);
          userId = pending.customerId;
          email = email || pending.email || '';
          firstName = firstName || pending.firstName || '';
          lastName = lastName || pending.lastName || '';
          phone = phone || pending.phone || '';
        }
      }

      if (!userId) {
        showAlert('Error', 'Session lost. Please login again.', 'error');
        setIsLoading(false);
        return;
      }

      const uploadFile = async (localUri: string, bucket: string) => {
        try {
          const response = await fetch(localUri);
          const blob = await response.blob();
          const filename = localUri.split('/').pop() || `${Date.now()}.jpg`;
          const form = new FormData();
          form.append('file', {
            uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
            name: filename,
            type: blob.type || 'image/jpeg',
          } as any);
          form.append('bucket', bucket);
          form.append('customerId', userId!);
          const uploadResp = await api.upload('/upload/kyc-documents', form);
          return uploadResp.success ? (uploadResp.data as any).url : null;
        } catch (e) { return null; }
      };

      const idUrl = kycData.idImage ? await uploadFile(kycData.idImage, 'identity-documents') : null;
      const selfieUrl = kycData.selfieImage ? await uploadFile(kycData.selfieImage, 'profile-photos') : null;

      const payload = {
        userId, email, firstName, lastName,
        phone: phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`,
        dob: kycData.dob,
        addressStreet: kycData.address,
        addressCity: kycData.city,
        addressState: kycData.state,
        addressCountry: 'NG',
        addressPostalCode: kycData.postalCode,
        identificationType: kycData.identificationType,
        identificationNumber: kycData.identificationNumber,
        identificationPhotoUrl: kycData.identificationType !== 'BVN' ? idUrl : null,
        identityType: kycData.idType,
        identityNumber: kycData.idNumber,
        identityCountry: 'NG',
        identityImageUrl: idUrl,
        profilePhotoUrl: selfieUrl,
      };

      const response = await api.post('/auth/kyc-submit', payload);
      if (response.success) {
        await AsyncStorage.removeItem('kycPendingCustomer');
        showAlert('Yay! KYC Submitted!', 'Verification takes at most, 48 hours. You can now login.', 'success', [
          { text: 'Login Now', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) }
        ]);
      } else {
        showAlert('Submission Failed', response.error || 'Failed to submit KYC', 'error');
      }
    } catch (error) {
      showAlert('Error', 'An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcome = () => (
    <Animated.View style={[styles.welcomeStep, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.promoImageContainer}>
        <LinearGradient colors={[theme.primary + '20', 'transparent']} style={styles.promoCircle}>
          <MaterialCommunityIcons name="shield-check-outline" size={100} color={theme.primary} />
        </LinearGradient>
      </View>

      <Text style={[styles.welcomeTitle, { color: theme.text }]}>Unlock all + Premium Features</Text>
      <Text style={[styles.welcomeSub, { color: theme.textSecondary }]}>
        One-time verification puts you on <Text style={{ color: theme.primary, fontWeight: 'bold' }}>the best tier</Text> automatically.
        That is why we ask for these verification documents. Without completing your kyc you won't be able to perform any transaction.
      </Text>

      <View style={styles.benefitList}>
        {[
          { icon: 'account', text: 'Virtual Naira & USD Bank Accounts', sub: 'Receive money from anywhere' },
          { icon: 'wifi', text: 'Buy airtime, data, and electricity bills', sub: 'Do more with Matrix' },
          { icon: 'credit-card', text: 'Virtual USD Visa/Mastercard', sub: 'Pay for Netflix, Amazon & more' },
          { icon: 'send', text: 'Make withdrawals and Transfers', sub: 'Withdraw your money anytime' },
        ].map((b, i) => (
          <View key={i} style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: theme.primary + '15' }]}>
              <MaterialCommunityIcons name={b.icon as any} size={24} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.benefitText, { color: theme.text }]}>{b.text}</Text>
              <Text style={[styles.benefitSub, { color: theme.textSecondary }]}>{b.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.infoBox, { backgroundColor: theme.surface }]}>
        <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Compliant with Central Bank of Nigeria (CBN) regulations. Your data is encrypted and secure.
        </Text>
      </View>

      <TouchableOpacity style={[styles.getStartedButton, { backgroundColor: theme.primary }]} onPress={() => setCurrentStep(1)}>
        <Text style={styles.getStartedText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <Text style={[styles.formHeader, { color: theme.text }]}>Identity Verification</Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Select ID Type</Text>
        <View style={styles.idGrid}>
          {idTypes.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setKycData({ ...kycData, idType: t.value as any })}
              style={[styles.idCard, kycData.idType === t.value ? { borderColor: theme.primary, backgroundColor: theme.primary + '10' } : { borderColor: theme.border }]}
            >
              <Ionicons name={t.icon as any} size={24} color={kycData.idType === t.value ? theme.primary : theme.textSecondary} />
              <Text style={[styles.idCardLabel, { color: kycData.idType === t.value ? theme.primary : theme.text }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={[styles.modernInput, { color: theme.text, borderColor: theme.border }]}
        placeholder="Document ID Number"
        placeholderTextColor={theme.textSecondary}
        value={kycData.idNumber}
        onChangeText={(t) => setKycData({ ...kycData, idNumber: t })}
      />

      <View style={styles.idChoiceGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Verification Source</Text>
        <View style={styles.row}>
          {['BVN', 'NIN'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setKycData({ ...kycData, identificationType: type as any })}
              style={[styles.choiceBtn, kycData.identificationType === type ? { backgroundColor: theme.primary } : { borderColor: theme.border, borderWidth: 1 }]}
            >
              <Text style={{ color: kycData.identificationType === type ? '#fff' : theme.text }}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.modernInput, { color: theme.text, borderColor: theme.border, marginTop: 12 }]}
          placeholder={`Enter ${kycData.identificationType || 'Source'} Number`}
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
          value={kycData.identificationNumber}
          onChangeText={(t) => setKycData({ ...kycData, identificationNumber: t })}
        />
      </View>
      <View style={styles.photoGrid}>
        <TouchableOpacity style={[styles.photoBox, { borderColor: theme.border }]} onPress={pickDocument}>
          {kycData.idImage ? <Image source={{ uri: kycData.idImage }} style={styles.photoFill} /> : (
            <>
              <Ionicons name="document-text-outline" size={32} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 8 }}>ID Document (PDF/Img)</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.photoBox, { borderColor: theme.border }]} onPress={() => takePhoto('selfie')}>
          {kycData.selfieImage ? <Image source={{ uri: kycData.selfieImage }} style={styles.photoFill} /> : (
            <>
              <Ionicons name="person-outline" size={32} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 8 }}>Selfie</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.modernInput, { borderColor: theme.border, marginTop: 20, justifyContent: 'center' }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: kycData.dob ? theme.text : theme.textSecondary }}>
          {kycData.dob || 'Date of Birth (Select Date)'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dobDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <Text style={[styles.formHeader, { color: theme.text }]}>Address Details</Text>
      <TextInput
        style={[styles.modernInput, { color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
        placeholder="Home Address"
        placeholderTextColor={theme.textSecondary}
        multiline
        value={kycData.address}
        onChangeText={(t) => setKycData({ ...kycData, address: t })}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.modernInput, { color: theme.text, borderColor: theme.border, width: '48%' }]}
          placeholder="City"
          placeholderTextColor={theme.textSecondary}
          value={kycData.city}
          onChangeText={(t) => setKycData({ ...kycData, city: t })}
        />
        <TouchableOpacity
          style={[styles.modernInput, { borderColor: theme.border, width: '48%', justifyContent: 'center' }]}
          onPress={() => setShowStateModal(true)}
        >
          <Text style={{ color: kycData.state ? theme.text : theme.textSecondary }}>{kycData.state || 'State'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.modernInput, { color: theme.text, borderColor: theme.border }]}
        placeholder="Postal Code"
        placeholderTextColor={theme.textSecondary}
        keyboardType="numeric"
        value={kycData.postalCode}
        onChangeText={(t) => setKycData({ ...kycData, postalCode: t })}
      />
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
      <Text style={[styles.formHeader, { color: theme.text }]}>Review Submission</Text>
      <View style={[styles.reviewCard, { backgroundColor: theme.surface }]}>
        <View style={styles.reviewRow}>
          <Text style={{ color: theme.textSecondary }}>Document</Text>
          <Text style={{ color: theme.text, fontWeight: 'bold' }}>{kycData.idType?.toUpperCase()}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={{ color: theme.textSecondary }}>ID Number</Text>
          <Text style={{ color: theme.text, fontWeight: 'bold' }}>{kycData.idNumber}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={{ color: theme.textSecondary }}>{kycData.identificationType}</Text>
          <Text style={{ color: theme.text, fontWeight: 'bold' }}>{kycData.identificationNumber}</Text>
        </View>
        <View style={styles.reviewDivider} />
        <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>Residential Address</Text>
        <Text style={{ color: theme.text, fontWeight: '500' }}>{kycData.address}, {kycData.city}, {kycData.state}</Text>
      </View>

      <View style={styles.statusList}>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={{ color: theme.text, marginLeft: 8 }}>ID Document Attached</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={{ color: theme.text, marginLeft: 8 }}>Verification Selfie Ready</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient colors={[theme.background, theme.surface]} style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={handleBack} style={currentStep === 0 ? { opacity: 0 } : {}}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {currentStep > 0 && (
          <View style={styles.stepper}>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepperItem}>
                <View style={[styles.stepDot, i + 1 <= currentStep ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }]} />
                <Text style={[styles.stepLabel, { color: i + 1 === currentStep ? theme.primary : theme.textSecondary }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {currentStep === 0 && renderWelcome()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {currentStep > 0 && (
        <View style={styles.footer}>
          {currentStep < 3 ? (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={handleNext}>
              <Text style={styles.actionBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }, isLoading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.actionBtnText}>Complete Verification</Text>
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={showStateModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select State</Text>
            <ScrollView>
              {NIGERIAN_STATES.map((s) => (
                <TouchableOpacity key={s} onPress={() => { setKycData({ ...kycData, state: s }); setShowStateModal(false); }} style={[styles.modalItem, { borderBottomColor: theme.border }]}>
                  <Text style={{ color: theme.text }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowStateModal(false)} style={[styles.closeBtn, { backgroundColor: theme.primary }]}>
              <Text style={{ color: '#fff' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' },
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  welcomeStep: { alignItems: 'center', paddingTop: 20 },
  promoImageContainer: { marginBottom: 30 },
  promoCircle: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center' },
  welcomeTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  welcomeSub: { fontSize: 16, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  benefitList: { width: '100%', marginBottom: 40, gap: 20 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  benefitIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  benefitText: { fontSize: 16, fontWeight: 'bold' },
  benefitSub: { fontSize: 13, marginTop: 2 },
  infoBox: { flexDirection: 'row', padding: 16, borderRadius: 12, gap: 12, alignItems: 'center', marginBottom: 30 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  getStartedButton: { width: '100%', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  getStartedText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, marginTop: 20 },
  stepperItem: { alignItems: 'center', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLabel: { fontSize: 11, fontWeight: '600' },
  stepContent: { flex: 1 },
  formHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  idGrid: { flexDirection: 'row', gap: 10 },
  idCard: { flex: 1, height: 90, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', gap: 8 },
  idCardLabel: { fontSize: 12, fontWeight: '700' },
  modernInput: { height: 56, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, marginBottom: 16 },
  idChoiceGroup: { marginTop: 10, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  choiceBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  photoGrid: { flexDirection: 'row', gap: 15, marginTop: 10 },
  photoBox: { flex: 1, height: 140, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoFill: { width: '100%', height: '100%' },
  reviewCard: { padding: 20, borderRadius: 20, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 4 },
  statusList: { marginTop: 30, gap: 12 },
  statusItem: { flexDirection: 'row', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 8, left: 0, right: 0, padding: 24, backgroundColor: 'transparent' },
  actionBtn: { height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1 },
  closeBtn: { height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20 }
});

export default KYCScreen;