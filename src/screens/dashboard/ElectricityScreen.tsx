// src/screens/dashboard/ElectricityScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';

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
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedProvider || !meterNumber || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(amount) < 1000) {
      Alert.alert('Error', 'Minimum amount is ₦1,000');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/electricity/purchase', {
        meter_number: meterNumber,
        amount: parseFloat(amount),
        disco: selectedProvider,
        meter_type: meterType,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Electricity purchase successful!',
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
                  transactionId: (response as any).transactionId || (response as any).data?.reference || `TXN_${Date.now()}`,
                  status: (response as any).status || 'completed',
                  timestamp: new Date().toISOString(),
                  ...(response as any).data && { apiResponse: (response as any).data },
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
        Alert.alert('Error', response.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
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
                onPress={() => setSelectedProvider(provider.id)}
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
                onPress={() => setMeterType('prepaid')}
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
                onPress={() => setMeterType('postpaid')}
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
              onChangeText={setMeterNumber}
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
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: theme.primary }]}
            onPress={handlePurchase}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>Pay Electricity Bill</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});

export default ElectricityScreen;
