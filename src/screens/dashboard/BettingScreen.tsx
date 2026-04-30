// src/screens/dashboard/BettingScreen.tsx
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

const BETTING_PROVIDERS = [
  { id: 'bet9ja', name: 'Bet9ja', color: '#1E40AF' },
  { id: 'sportybet', name: 'SportyBet', color: '#059669' },
  { id: 'nairabet', name: 'NairaBet', color: '#DC2626' },
  { id: 'merrybet', name: 'MerryBet', color: '#7C3AED' },
];

const BettingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedProvider || !accountId || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(amount) < 100) {
      Alert.alert('Error', 'Minimum amount is ₦100');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/betting', {
        betId: selectedProvider,
        amount: parseFloat(amount),
        customerId: accountId,
        customerName: accountId, // Using accountId as customerName for now
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Betting account funded successfully!',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'betting',
                  amount: parseFloat(amount),
                  recipient: accountId,
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
              <Ionicons name="football" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Betting & Gaming</Text>
            <Text style={styles.serviceDescription}>
              Fund your Bet9ja, SportyBet, NairaBet, MerryBet accounts
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Select Provider</Text>

          {/* Provider Selection */}
          <View style={styles.providerGrid}>
            {BETTING_PROVIDERS.map((provider) => (
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

          {/* Account ID */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Account ID / Username</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter account ID or username"
              placeholderTextColor={theme.textSecondary}
              value={accountId}
              onChangeText={setAccountId}
              autoCapitalize="none"
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

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Make sure your account details are correct. Funds will be credited to your betting account instantly.
            </Text>
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
              <Text style={styles.purchaseText}>Fund Betting Account</Text>
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
    minWidth: '45%',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
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

export default BettingScreen;
