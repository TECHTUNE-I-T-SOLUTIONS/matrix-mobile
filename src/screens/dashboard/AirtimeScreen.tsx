// src/screens/dashboard/AirtimeScreen.tsx
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
import ThemeToggle from '../../components/ThemeToggle';
import { useNavigation } from '@react-navigation/native';

const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: '#FFC107' },
  { id: 'airtel', name: 'Airtel', color: '#FF4444' },
  { id: 'glo', name: 'Glo', color: '#4CAF50' },
  { id: '9mobile', name: '9Mobile', color: '#2196F3' },
];

const AirtimeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedNetwork || !phoneNumber || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(amount) < 50) {
      Alert.alert('Error', 'Minimum amount is ₦50');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/airtime', {
        phone_number: phoneNumber,
        amount: parseFloat(amount),
        network: selectedNetwork,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Airtime purchase successful!',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'airtime',
                  amount: parseFloat(amount),
                  recipient: phoneNumber,
                  network: selectedNetwork,
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
              <Ionicons name="call" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Buy Airtime</Text>
            <Text style={styles.serviceDescription}>
              Purchase airtime for MTN, Airtel, Glo, 9Mobile
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Select Network</Text>

          {/* Network Selection */}
          <View style={styles.networkGrid}>
            {NETWORKS.map((network) => (
              <TouchableOpacity
                key={network.id}
                style={[
                  styles.networkCard,
                  {
                    backgroundColor: selectedNetwork === network.id ? network.color : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setSelectedNetwork(network.id)}
              >
                <Text
                  style={[
                    styles.networkName,
                    {
                      color: selectedNetwork === network.id ? '#ffffff' : theme.text,
                    },
                  ]}
                >
                  {network.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Phone Number */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Phone Number</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="08012345678"
              placeholderTextColor={theme.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount (₦)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="100"
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
              <Text style={styles.purchaseText}>Purchase Airtime</Text>
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
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  networkCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  networkName: {
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

export default AirtimeScreen;
