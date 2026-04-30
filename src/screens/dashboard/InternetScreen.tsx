// src/screens/dashboard/InternetScreen.tsx
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

const INTERNET_PROVIDERS = [
  { id: 'spectranet', name: 'Spectranet', color: '#1E40AF' },
  { id: 'smile', name: 'Smile', color: '#059669' },
  { id: 'ipnx', name: 'IPNX', color: '#DC2626' },
];

const InternetScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedProvider || !accountNumber || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(amount) < 100) {
      Alert.alert('Error', 'Minimum amount is ₦100');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/internet', {
        provider: selectedProvider,
        plan_id: 'default', // This might need to be updated based on actual plan selection
        account: accountNumber,
        amount: parseFloat(amount),
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Internet subscription successful!',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'internet',
                  amount: parseFloat(amount),
                  recipient: accountNumber,
                  provider: selectedProvider,
                  transactionId: (response as any).transactionId || `TXN_${Date.now()}`,
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
              <Ionicons name="globe" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Internet Services</Text>
            <Text style={styles.serviceDescription}>
              Subscribe to Spectranet, Smile, IPNX
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Select Provider</Text>

          {/* Provider Selection */}
          <View style={styles.providerGrid}>
            {INTERNET_PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: selectedProvider === provider.id ? provider.color : theme.surface,
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
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Number */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Account Number</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter account number"
              placeholderTextColor={theme.textSecondary}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />
          </View>

          {/* Amount Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount (₦)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter amount (minimum ₦100)"
              placeholderTextColor={theme.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: theme.primary },
              (!selectedProvider || !accountNumber || !amount || loading) && styles.disabledButton,
            ]}
            onPress={handlePurchase}
            disabled={!selectedProvider || !accountNumber || !amount || loading}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>Subscribe to Internet</Text>
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
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  providerCard: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  plansScrollView: {
    marginBottom: 10,
  },
  planCard: {
    width: 140,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  planData: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planValidity: {
    fontSize: 12,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  purchaseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InternetScreen;
