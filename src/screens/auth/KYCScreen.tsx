// src/screens/KYCScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
// apiClient used via alias `api` below
import * as ImagePicker from 'expo-image-picker';
import { apiClient as api } from '../../services/apiClient';
import { Platform } from 'react-native';
import ThemeToggle from '../../components/ThemeToggle';

const { width, height } = Dimensions.get('window');

type KYCScreenNavigationProp = StackNavigationProp<RootStackParamList, 'KYC'>;

interface KYCData {
  idType: 'passport' | 'drivers_license' | 'national_id' | '';
  idNumber: string; // identity document number
  identificationType: 'BVN' | 'NIN' | '';
  identificationNumber: string; // BVN/NIN
  dob: string; // YYYY-MM-DD
  idImage: string | null; // identity document image
  selfieImage: string | null; // profile photo
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const KYCScreen: React.FC = () => {
  const navigation = useNavigation<KYCScreenNavigationProp>();
  const { theme } = useTheme();
  const { session } = useSession();

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

  const NIGERIAN_STATES = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','FCT'
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    'ID Verification',
    'Address Details',
    'Review & Submit',
  ];

  const idTypes = [
    { value: 'passport', label: 'Passport', icon: '🛂' },
    { value: 'drivers_license', label: "Driver's License", icon: '🚗' },
    { value: 'national_id', label: 'National ID', icon: '🆔' },
  ];

  const pickImage = async (type: 'id' | 'selfie') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'id' ? [3, 2] : [1, 1],
      quality: 0.8,
    });

    const cancelled = (result as any).canceled ?? (result as any).cancelled ?? false
    const assets = (result as any).assets ?? (result as any).uri ? [{ uri: (result as any).uri }] : []
    if (!cancelled && assets.length > 0) {
      if (type === 'id') {
        setKycData({ ...kycData, idImage: assets[0].uri });
      } else {
        setKycData({ ...kycData, selfieImage: assets[0].uri });
      }
    }
  };

  const takePhoto = async (type: 'id' | 'selfie') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'id' ? [3, 2] : [1, 1],
      quality: 0.8,
    });

    const cancelled2 = (result as any).canceled ?? (result as any).cancelled ?? false
    const assets2 = (result as any).assets ?? (result as any).uri ? [{ uri: (result as any).uri }] : []
    if (!cancelled2 && assets2.length > 0) {
      if (type === 'id') {
        setKycData({ ...kycData, idImage: assets2[0].uri });
      } else {
        setKycData({ ...kycData, selfieImage: assets2[0].uri });
      }
    }
  };

  const validateStep1 = () => {
    if (!kycData.idType) {
      Alert.alert('ID Type Required', 'Please select your ID type');
      return false;
    }

    if (!kycData.idNumber.trim()) {
      Alert.alert('ID Number Required', 'Please enter your ID number');
      return false;
    }

    if (!kycData.identificationType) {
      Alert.alert('Identification Required', 'Please select BVN or NIN');
      return false;
    }

    if (!kycData.identificationNumber.trim()) {
      Alert.alert('Identification Number Required', 'Please enter your BVN/NIN');
      return false;
    }

    // If BVN selected, ensure 11 digits
    if (kycData.identificationType === 'BVN' && !/^\d{11}$/.test(kycData.identificationNumber)) {
      Alert.alert('Invalid BVN', 'BVN must be exactly 11 digits');
      return false;
    }

    if (!kycData.idImage) {
      Alert.alert('ID Photo Required', 'Please upload a photo of your ID');
      return false;
    }

    if (!kycData.selfieImage) {
      Alert.alert('Selfie Required', 'Please upload a selfie for verification');
      return false;
    }

    if (!kycData.dob) {
      Alert.alert('Date of Birth Required', 'Please enter your date of birth (YYYY-MM-DD)');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!kycData.address.trim()) {
      Alert.alert('Address Required', 'Please enter your address');
      return false;
    }

    if (!kycData.city.trim()) {
      Alert.alert('City Required', 'Please enter your city');
      return false;
    }

    if (!kycData.state.trim()) {
      Alert.alert('State Required', 'Please enter your state');
      return false;
    }

    if (!kycData.postalCode.trim()) {
      Alert.alert('Postal Code Required', 'Please enter your postal code');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      let userId = session.user?.id
      let email = session.user?.email || ''
      const _metadata = (session.user as any)?.user_metadata || {}
      let firstName = _metadata?.first_name || ''
      let lastName = _metadata?.last_name || ''
      let phone = _metadata?.mobile || _metadata?.phone || ''

      if (!userId) {
        const stored = await AsyncStorage.getItem('kycPendingCustomer')
        if (stored) {
          const pending = JSON.parse(stored)
          userId = pending.customerId || pending.customerId
          email = email || pending.email || ''
          firstName = firstName || pending.firstName || ''
          lastName = lastName || pending.lastName || ''
          phone = phone || pending.phone || ''
        }
      }

      if (!userId) {
        Alert.alert('Error', 'Unable to find user session or pending signup. Please login again.');
        setIsLoading(false);
        return;
      }

      // Upload images first (if present) to backend upload endpoint
      let identificationPhotoUrl: string | null = null
      let profilePhotoUrl: string | null = null
      let identityImageUrl: string | null = null

      const uploadFile = async (localUri: string, bucket: string) => {
        try {
          // Convert local file URI to blob
          const uri = localUri;
          const response = await fetch(uri);
          const blob = await response.blob();
          const filename = uri.split('/').pop() || `${Date.now()}.jpg`;

          const form = new FormData()
          // @ts-ignore — React Native FormData accepts file objects
          form.append('file', {
            uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
            name: filename,
            type: blob.type || 'image/jpeg',
          })
          form.append('bucket', bucket)
          form.append('customerId', userId)

          const uploadResp = await api.upload('/upload/kyc-documents', form)
          if (uploadResp.success && uploadResp.data) {
            return (uploadResp.data as any).url as string
          }
        } catch (e) {
          console.warn('Upload failed', e)
        }
        return null
      }

      if (kycData.idImage) {
        identificationPhotoUrl = await uploadFile(kycData.idImage, 'identity-documents')
      }

      if (kycData.selfieImage) {
        profilePhotoUrl = await uploadFile(kycData.selfieImage, 'profile-photos')
      }

      // For compatibility: identityImageUrl use the same as identificationPhotoUrl if present
      identityImageUrl = identificationPhotoUrl || null

      // Normalize phone to international format with leading + (e.g. +2348012345678)
      const rawPhone = (phone || '').trim()
      let phoneToSend = rawPhone
      const digitsOnly = rawPhone.replace(/\D/g, '')
      if (rawPhone.startsWith('+')) {
        // keep as-is (already international)
        phoneToSend = rawPhone
      } else if (digitsOnly.startsWith('0')) {
        phoneToSend = `+234${digitsOnly.substring(1)}`
      } else if (digitsOnly.startsWith('234')) {
        phoneToSend = `+${digitsOnly}`
      } else {
        // fallback: assume local number, prepend +234
        phoneToSend = `+234${digitsOnly}`
      }

      // Build payload matching server's expected fields
      const payload = {
        userId,
        email,
        firstName,
        lastName,
        phone: phoneToSend,
        dob: kycData.dob,
        addressStreet: kycData.address,
        addressCity: kycData.city,
        addressState: kycData.state,
        addressCountry: kycData.country || 'NG',
        addressPostalCode: kycData.postalCode,
        identificationType: kycData.identificationType, // BVN/NIN
        identificationNumber: kycData.identificationNumber,
        identificationPhotoUrl: kycData.identificationType !== 'BVN' ? identificationPhotoUrl : null,
        identityType: kycData.idType,
        identityNumber: kycData.idNumber,
        identityCountry: kycData.country || 'NG',
        identityImageUrl: identityImageUrl,
        profilePhotoUrl: profilePhotoUrl,
      }

      const response = await api.post('/auth/kyc-submit', payload)

      if (response.success) {
        // Clear any pending KYC marker saved during signup
        try {
          await AsyncStorage.removeItem('kycPendingCustomer')
        } catch (e) {
          console.warn('Failed to clear kycPendingCustomer', e)
        }

        Alert.alert(
          'KYC Submitted! 🎉',
          'Your verification documents have been submitted. We\'ll review them within 24-48 hours.',
          [
              {
                text: 'Continue',
                onPress: () => navigation.navigate('Auth', { screen: 'Login' }),
              },
            ]
        )
      } else {
        Alert.alert('Submission Failed', response.error || 'Failed to submit KYC')
      }
    } catch (error) {
      console.error('KYC submit error', error)
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Identity Verification 🆔
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Please provide your identification details and photos
      </Text>

      {/* ID Type Selection */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>ID Type</Text>
        <View style={styles.idTypeContainer}>
          {idTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.idTypeButton,
                kycData.idType === type.value && { backgroundColor: theme.primary },
              ]}
              onPress={() => setKycData({ ...kycData, idType: type.value as any })}
            >
              <Text style={styles.idTypeIcon}>{type.icon}</Text>
              <Text
                style={[
                  styles.idTypeText,
                  { color: kycData.idType === type.value ? '#ffffff' : theme.text },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ID Number */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>ID Number</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            },
          ]}
          placeholder="Enter your ID number"
          placeholderTextColor={theme.inputPlaceholder}
          value={kycData.idNumber}
          onChangeText={(text) => setKycData({ ...kycData, idNumber: text })}
        />
      </View>

      {/* DOB */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>Date of Birth</Text>
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
          value={kycData.dob}
          onChangeText={(text) => setKycData({ ...kycData, dob: text })}
        />
      </View>

      {/* Identification Type (BVN/NIN) and Number */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>Identification</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.smallButton,
              kycData.identificationType === 'BVN' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setKycData({ ...kycData, identificationType: 'BVN' })}
          >
            <Text style={[styles.smallButtonText, { color: kycData.identificationType === 'BVN' ? '#fff' : theme.text }]}>BVN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.smallButton,
              kycData.identificationType === 'NIN' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setKycData({ ...kycData, identificationType: 'NIN' })}
          >
            <Text style={[styles.smallButtonText, { color: kycData.identificationType === 'NIN' ? '#fff' : theme.text }]}>NIN</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
              marginTop: 8,
            },
          ]}
          placeholder="Enter BVN or NIN"
          placeholderTextColor={theme.inputPlaceholder}
          value={kycData.identificationNumber}
          onChangeText={(text) => setKycData({ ...kycData, identificationNumber: text })}
          keyboardType="numeric"
        />
      </View>

      {/* ID Photo */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>
          ID Photo {kycData.idImage && '✓'}
        </Text>
        <View style={styles.imageUploadContainer}>
          {kycData.idImage ? (
            <Image source={{ uri: kycData.idImage }} style={styles.uploadedImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { borderColor: theme.inputBorder }]}>
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                📷 ID Photo
              </Text>
            </View>
          )}
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: theme.primary }]}
              onPress={() => takePhoto('id')}
            >
              <Text style={styles.imageButtonText}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageButton, { borderColor: theme.border }]}
              onPress={() => pickImage('id')}
            >
              <Text style={[styles.imageButtonText, { color: theme.text }]}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Selfie */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>
          Selfie {kycData.selfieImage && '✓'}
        </Text>
        <View style={styles.imageUploadContainer}>
          {kycData.selfieImage ? (
            <Image source={{ uri: kycData.selfieImage }} style={styles.uploadedImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { borderColor: theme.inputBorder }]}>
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                🤳 Selfie
              </Text>
            </View>
          )}
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: theme.primary }]}
              onPress={() => takePhoto('selfie')}
            >
              <Text style={styles.imageButtonText}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageButton, { borderColor: theme.border }]}
              onPress={() => pickImage('selfie')}
            >
              <Text style={[styles.imageButtonText, { color: theme.text }]}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Address Details 🏠
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Please provide your residential address
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>Street Address</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            },
          ]}
          placeholder="123 Main Street"
          placeholderTextColor={theme.inputPlaceholder}
          value={kycData.address}
          onChangeText={(text) => setKycData({ ...kycData, address: text })}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>City</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            placeholder="Lagos"
            placeholderTextColor={theme.inputPlaceholder}
            value={kycData.city}
            onChangeText={(text) => setKycData({ ...kycData, city: text })}
          />
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>State</Text>
          <TouchableOpacity
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                justifyContent: 'center',
              },
            ]}
            onPress={() => setShowStateModal(true)}
          >
            <Text style={{ color: kycData.state ? theme.text : theme.inputPlaceholder }}>
              {kycData.state || 'Select state'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Postal Code</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            placeholder="100001"
            placeholderTextColor={theme.inputPlaceholder}
            value={kycData.postalCode}
            onChangeText={(text) => setKycData({ ...kycData, postalCode: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Country</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            placeholder="Nigeria"
            placeholderTextColor={theme.inputPlaceholder}
            value={kycData.country === 'NG' ? 'Nigeria' : kycData.country}
            onChangeText={(text) => setKycData({ ...kycData, country: text })}
            editable={false}
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>
        Review & Submit 📋
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Please review your information before submitting
      </Text>

      <View style={styles.reviewContainer}>
        <View style={styles.reviewSection}>
          <Text style={[styles.reviewTitle, { color: theme.text }]}>Identity Information</Text>
          <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>ID Type:</Text>
            <Text style={[styles.reviewValue, { color: theme.text }]}>
              {idTypes.find(t => t.value === kycData.idType)?.label}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>ID Number:</Text>
            <Text style={[styles.reviewValue, { color: theme.text }]}>{kycData.idNumber}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.reviewTitle, { color: theme.text }]}>Address Information</Text>
          <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Address:</Text>
            <Text style={[styles.reviewValue, { color: theme.text }]}>{kycData.address}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>City:</Text>
            <Text style={[styles.reviewValue, { color: theme.text }]}>{kycData.city}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>State:</Text>
            <Text style={[styles.reviewValue, { color: theme.text }]}>{kycData.state}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>Postal Code:</Text>
            <Text style={[styles.reviewValue, { color: theme.text }]}>{kycData.postalCode}</Text>
          </View>
        </View>

        <View style={styles.documentsSection}>
          <Text style={[styles.reviewTitle, { color: theme.text }]}>Documents</Text>
          <View style={styles.documentStatus}>
            <Text style={[styles.documentText, { color: theme.text }]}>
              🆔 ID Photo: {kycData.idImage ? '✓ Uploaded' : '❌ Missing'}
            </Text>
            <Text style={[styles.documentText, { color: theme.text }]}>
              🤳 Selfie: {kycData.selfieImage ? '✓ Uploaded' : '❌ Missing'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemeToggle />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.progressItem}>
              <View
                style={[
                  styles.progressCircle,
                  index + 1 <= currentStep && { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.progressNumber,
                    { color: index + 1 <= currentStep ? '#ffffff' : theme.textSecondary },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.progressText,
                  {
                    color: index + 1 <= currentStep ? theme.primary : theme.textSecondary,
                  },
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Step Content */}
        {renderCurrentStep()}

        {/* State Selection Modal */}
        <Modal visible={showStateModal} animationType="slide" onRequestClose={() => setShowStateModal(false)}>
          <View style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Select State</Text>
            <ScrollView>
              {NIGERIAN_STATES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => { setKycData({ ...kycData, state: s }); setShowStateModal(false); }}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                >
                  <Text style={{ color: theme.text }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowStateModal(false)} style={{ marginTop: 12, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: theme.border }]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonText, { color: theme.text }]}>← Back</Text>
            </TouchableOpacity>
          )}

          {currentStep < steps.length ? (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.primary }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.primary },
                isLoading && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit KYC 🎉</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
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
  idTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  idTypeButton: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  smallButton: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  idTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  idTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageUploadContainer: {
    marginTop: 8,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  reviewContainer: {
    marginBottom: 32,
  },
  reviewSection: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    flex: 1,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  documentsSection: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  documentStatus: {
    marginTop: 8,
  },
  documentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default KYCScreen;