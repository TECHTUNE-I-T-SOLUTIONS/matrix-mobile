// src/screens/dashboard/AirtimeScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PhoneInputWithContacts from '../../components/PhoneInputWithContacts';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';

const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: '#FFC107' },
  { id: 'airtel', name: 'Airtel', color: '#FF4444' },
  { id: 'glo', name: 'Glo', color: '#4CAF50' },
  { id: '9mobile', name: '9Mobile', color: '#01573d' },
];

const NETWORK_PREFIXES: { [key: string]: string } = {
  '0803': 'mtn', '0806': 'mtn', '0703': 'mtn', '0706': 'mtn', '0813': 'mtn', '0814': 'mtn', '0816': 'mtn', '0903': 'mtn', '0906': 'mtn', '0810': 'mtn', '0913': 'mtn',
  '0802': 'airtel', '0808': 'airtel', '0701': 'airtel', '0708': 'airtel', '0812': 'airtel', '0902': 'airtel', '0907': 'airtel', '0901': 'airtel', '0911': 'airtel',
  '0805': 'glo', '0807': 'glo', '0705': 'glo', '0815': 'glo', '0811': 'glo', '0905': 'glo',
  '0809': '9mobile', '0817': '9mobile', '0818': '9mobile', '0909': '9mobile', '0908': '9mobile',
};

const normalizePhoneNumber = (number: string) => {
  const digitsOnly = String(number || '').replace(/\D/g, '');

  if (digitsOnly.startsWith('234') && digitsOnly.length > 3) {
    return `0${digitsOnly.slice(3)}`;
  }

  if (digitsOnly.startsWith('0')) {
    return digitsOnly.slice(0, 11);
  }

  if (digitsOnly.length === 10) {
    return `0${digitsOnly}`;
  }

  return digitsOnly.slice(0, 11);
};

type AirtimeScreenProps = {
  route?: {
    params?: {
      prefilledNumber?: string;
    };
  };
};

const AirtimeScreen: React.FC<AirtimeScreenProps> = ({ route }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(route?.params?.prefilledNumber || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
    onConfirm: () => {},
  });

  const showAlert = useCallback((title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', onConfirm?: () => void) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false }))),
    });
  }, []);

  // Auto-detect network when prefilled number is provided
  useEffect(() => {
    if (route?.params?.prefilledNumber) {
      detectNetwork(route.params.prefilledNumber);
    }
  }, [route?.params?.prefilledNumber]);

  const detectNetwork = (number: string) => {
    const cleanNumber = normalizePhoneNumber(number);

    if (cleanNumber.length >= 4) {
      const prefix = cleanNumber.substring(0, 4);
      const network = NETWORK_PREFIXES[prefix];
      if (network) {
        setSelectedNetwork(network);
      }
    }
    return cleanNumber;
  };

  const handlePhoneNumberChange = (text: string) => {
    const cleaned = detectNetwork(text);
    setPhoneNumber(cleaned);
  };

  const handlePurchase = () => {
    if (!selectedNetwork || !phoneNumber || !amount) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    showAlert(
      'Confirm Purchase',
      `You are about to purchase ₦${amount} airtime for ${phoneNumber} (${selectedNetwork.toUpperCase()}). Proceed?`,
      'info',
      processPurchase
    );
  };

  const processPurchase = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/services/airtime', {
        phone_number: phoneNumber,
        amount: parseFloat(amount),
        network: selectedNetwork,
      });

      if (response.success) {
        navigation.navigate('Success', {
          data: {
            serviceType: 'airtime',
            amount: parseFloat(amount),
            recipient: phoneNumber,
            network: selectedNetwork,
            transactionId: (response.data as any)?.transaction_id || `TXN_${Date.now()}`,
            status: 'completed',
            timestamp: new Date().toISOString(),
          }
        });
      } else {
        showAlert('Error', response.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      showAlert('No Internet', 'Please check your internet connection and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Fixed Header */}
        <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Ionicons name="call" size={32} color="white" />
            <Text style={styles.serviceTitle}>Buy Airtime</Text>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Network Selection */}
          <Text style={[styles.label, { color: theme.text, marginBottom: 12 }]}>Select Network</Text>
          <View style={styles.networkTabs}>
            {NETWORKS.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[styles.networkTab, { 
                  backgroundColor: selectedNetwork === n.id ? n.color : 'transparent',
                  borderColor: selectedNetwork === n.id ? n.color : theme.border 
                }]}
                onPress={() => setSelectedNetwork(n.id)}
              >
                <Text style={[styles.networkTabText, { color: selectedNetwork === n.id ? '#fff' : theme.text }]}>
                  {n.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <PhoneInputWithContacts
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            onNetworkDetect={detectNetwork}
            label="Phone Number"
          />

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.text, marginBottom: 8 }]}>Amount (₦)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
              placeholder="100"
              placeholderTextColor={theme.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        {/* Fixed Purchase Button */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: theme.primary }, (!amount || !phoneNumber || loading) && { opacity: 0.5 }]}
            onPress={handlePurchase}
            disabled={!amount || !phoneNumber || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.purchaseText}>Purchase Airtime</Text>}
          </TouchableOpacity>
        </View>

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
          onConfirm={alertConfig.onConfirm}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center', height: 140, justifyContent: 'center' },
  backButton: { position: 'absolute', left: 20, top: 50 },
  headerContent: { alignItems: 'center', gap: 5 },
  serviceTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  networkTabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  networkTab: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  networkTabText: { fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: '600' },
  fieldContainer: { marginTop: 20 },
  textInput: { height: 55, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 16 },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  purchaseButton: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  purchaseText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AirtimeScreen;
