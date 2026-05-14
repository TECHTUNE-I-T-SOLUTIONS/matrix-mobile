// src/screens/dashboard/ElectricityScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';

const ELECTRICITY_PROVIDERS = [
  { id: 'ikedc', name: 'IKEDC', description: 'Ikeja Electric' },
  { id: 'ekedc', name: 'EKEDC', description: 'Eko Electric' },
  { id: 'kedco', name: 'KEDCO', description: 'Kano Electric' },
  { id: 'phed', name: 'PHED', description: 'Port Harcourt Electric' },
  { id: 'jed', name: 'JED', description: 'Jos Electric' },
  { id: 'aedc', name: 'AEDC', description: 'Abuja Electric' },
  { id: 'ibedc', name: 'IBEDC', description: 'Ibadan Electric' },
  { id: 'eedc', name: 'EEDC', description: 'Enugu Electric' },
  { id: 'kaedco', name: 'KAEDCO', description: 'Kaduna Electric' },
];

const ElectricityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [validationData, setValidationData] = useState<any>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    buttons: undefined as Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }> | undefined,
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const closeAlert = () => {
    setAlertConfig((current) => ({ ...current, visible: false }));
  };

  const handleValidate = async () => {
    if (!selectedProvider || !meterNumber || !amount) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    if (parseFloat(amount) < 1000) {
      showAlert('Error', 'Minimum amount is ₦1,000', 'error');
      return;
    }

    try {
      setLoading(true);
      const validationResponse = await apiClient.post('/services/electricity/validate', {
        meter_number: meterNumber,
        disco: selectedProvider,
        meter_type: meterType,
        amount: parseFloat(amount),
      });

      if (!validationResponse.success) {
        showAlert('Validation Failed', validationResponse.error || 'Meter validation failed', 'error');
        return;
      }

      const validationData = (validationResponse.data as any)?.data || validationResponse.data;
      console.log('[ElectricityScreen] Validation data:', validationData);
      setValidationData(validationData);
      setIsValidated(true);
      showAlert(
        'Meter Validated',
        `Customer: ${validationData?.customer_name || 'Unknown'}\nAddress: ${validationData?.address || 'Not available'}\nYou can now proceed to pay.`,
        'success'
      );
    } catch (error) {
      console.error('Validation error:', error);
      showAlert('Error', 'Failed to validate meter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProvider || !meterNumber || !amount) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    if (parseFloat(amount) < 1000) {
      showAlert('Error', 'Minimum amount is ₦1,000', 'error');
      return;
    }

    if (!isValidated) {
      await handleValidate();
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/electricity/purchase', {
        meter_number: meterNumber,
        amount: parseFloat(amount),
        disco: selectedProvider,
        meter_type: meterType,
        customer_name: validationData?.customer_name,
        address: validationData?.address,
        validation: validationData,
      });

      const responseData = (response.data as any)?.data || response.data;

      if (response.success) {
        showAlert(
          'Success',
          'Electricity purchase successful!',
          'success',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'electricity',
                  amount: parseFloat(amount),
                  provider: selectedProvider,
                  meterNumber: meterNumber,
                  meterType: meterType,
                  transactionId: responseData?.transaction_id || responseData?.reference || `TXN_${Date.now()}`,
                  status: responseData?.status || 'completed',
                  timestamp: new Date().toISOString(),
                  pin: responseData?.token || responseData?.details?.token || responseData?.apiResponse?.message?.details?.token,
                  apiResponse: responseData,
                }
              })
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            }
          ]
        );
      } else {
        const errorMessage = response.error || 'Purchase failed';
        showAlert('Payment Failed', errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      
      // Extract error message from response if available
      let errorMessage = 'Failed to complete purchase. Please try again.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showAlert('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <LinearGradient
          colors={[theme.primary, theme.primary + 'DD']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="flash" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Electricity Bills</Text>
            <Text style={styles.serviceDescription}>
              Pay your electricity bills instantly
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Select Provider</Text>

          {/* Provider Selection */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.providersScrollView}
          >
            {ELECTRICITY_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: selectedProvider === provider.id ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  setSelectedProvider(provider.id);
                  setIsValidated(false);
                  setValidationData(null);
                }}
              >
                <Text
                  style={[
                    styles.providerName,
                    {
                      color: selectedProvider === provider.id ? '#ffffff' : theme.text,
                    },
                  ]}
                >
                  {provider.name}
                </Text>
                <Text
                  style={[
                    styles.providerDescription,
                    {
                      color: selectedProvider === provider.id ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                    },
                  ]}
                >
                  {provider.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Meter Type */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Meter Type</Text>
            <View style={styles.meterTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.meterTypeButton,
                  {
                    backgroundColor: meterType === 'prepaid' ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  setMeterType('prepaid');
                  setIsValidated(false);
                  setValidationData(null);
                }}
              >
                <Text
                  style={[
                    styles.meterTypeText,
                    {
                      color: meterType === 'prepaid' ? '#ffffff' : theme.text,
                    },
                  ]}
                >
                  Prepaid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.meterTypeButton,
                  {
                    backgroundColor: meterType === 'postpaid' ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  setMeterType('postpaid');
                  setIsValidated(false);
                  setValidationData(null);
                }}
              >
                <Text
                  style={[
                    styles.meterTypeText,
                    {
                      color: meterType === 'postpaid' ? '#ffffff' : theme.text,
                    },
                  ]}
                >
                  Postpaid
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Meter Number */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Meter Number</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter meter number"
              placeholderTextColor={theme.textSecondary}
              value={meterNumber}
              onChangeText={(text) => {
                setMeterNumber(text);
                setIsValidated(false);
                setValidationData(null);
              }}
              keyboardType="numeric"
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount (₦)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="1000"
              placeholderTextColor={theme.textSecondary}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setIsValidated(false);
                setValidationData(null);
              }}
              keyboardType="numeric"
            />
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: theme.primary }]}
            onPress={isValidated ? handlePurchase : handleValidate}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>{isValidated ? 'Pay Electricity Bill' : 'Validate'}</Text>
            )}
          </TouchableOpacity>

          {isValidated && validationData && (
            <View style={[styles.validationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.validationLabel, { color: theme.textSecondary }]}>Validated Customer</Text>
              <Text style={[styles.validationValue, { color: theme.text }]}>{validationData.customer_name || 'Unknown'}</Text>
              <Text style={[styles.validationSubValue, { color: theme.textSecondary }]}>
                {validationData.address || 'Address not available'}
              </Text>
              {validationData.arrears !== undefined && (
                <Text style={[styles.validationSubValue, { color: theme.textSecondary }]}>
                  Arrears: ₦{Number(validationData.arrears || 0).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  providersScrollView: {
    marginBottom: 20,
  },
  providerCard: {
    width: 140,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  meterTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  meterTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  meterTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  purchaseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  validationCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  validationLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  validationValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  validationSubValue: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ElectricityScreen;
