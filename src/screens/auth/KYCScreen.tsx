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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { apiClient } from '../../services/apiClient';
import * as ImagePicker from 'expo-image-picker';
import ThemeToggle from '../../components/ThemeToggle';

const { width, height } = Dimensions.get('window');

type KYCScreenNavigationProp = StackNavigationProp<RootStackParamList, 'KYC'>;

interface KYCData {
  idType: 'passport' | 'drivers_license' | 'national_id' | '';
  idNumber: string;
  idImage: string | null;
  selfieImage: string | null;
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
    idImage: null,
    selfieImage: null,
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
  });

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

    if (!result.canceled) {
      if (type === 'id') {
        setKycData({ ...kycData, idImage: result.assets[0].uri });
      } else {
        setKycData({ ...kycData, selfieImage: result.assets[0].uri });
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

    if (!result.canceled) {
      if (type === 'id') {
        setKycData({ ...kycData, idImage: result.assets[0].uri });
      } else {
        setKycData({ ...kycData, selfieImage: result.assets[0].uri });
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

    if (!kycData.idImage) {
      Alert.alert('ID Photo Required', 'Please upload a photo of your ID');
      return false;
    }

    if (!kycData.selfieImage) {
      Alert.alert('Selfie Required', 'Please upload a selfie for verification');
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
      // In a real app, you'd upload images to a server first
      const response = await apiClient.post('/kyc/submit', {
        ...kycData,
        userId: session.user?.id,
      });

      if (response.success) {
        Alert.alert(
          'KYC Submitted! 🎉',
          'Your verification documents have been submitted. We\'ll review them within 24-48 hours.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Main'), // Navigate to main app
            },
          ]
        );
      } else {
        Alert.alert('Submission Failed', response.error || 'Failed to submit KYC');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
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
            value={kycData.state}
            onChangeText={(text) => setKycData({ ...kycData, state: text })}
          />
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
            value={kycData.country}
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