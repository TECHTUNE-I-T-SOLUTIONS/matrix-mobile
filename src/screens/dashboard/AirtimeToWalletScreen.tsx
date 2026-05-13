import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import CustomAlert from '../../components/CustomAlert';

const NETWORKS = [
  { id: 'mtn', name: 'MTN' },
  { id: 'airtel', name: 'Airtel' },
  { id: 'glo', name: 'Glo' },
  { id: '9mobile', name: '9Mobile' },
];

const AirtimeToWalletScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [amount, setAmount] = useState('1000');
  const [lookupData, setLookupData] = useState<any>(null);
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

  const closeAlert = () => setAlertConfig((current) => ({ ...current, visible: false }));

  const lookupRoute = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/services/airtime-to-wallet/lookup', {});
      if (response.success) {
        setLookupData((response.data as any)?.data || response.data || {});
        showAlert('Lookup complete', 'Payscribe returned the current airtime-to-wallet lookup successfully.', 'success');
      } else {
        showAlert('Error', response.error || 'Lookup failed', 'error');
      }
    } catch {
      showAlert('Error', 'Failed to load airtime-to-wallet lookup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendAirtime = async () => {
    if (!selectedNetwork || !phoneNumber || !fromNumber || !amount) {
      showAlert('Error', 'Please complete all fields', 'error');
      return;
    }

    if (parseFloat(amount) < 1000) {
      showAlert('Error', 'Minimum amount is ₦1,000', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/airtime-to-wallet/send', {
        network: selectedNetwork,
        phone_number: phoneNumber,
        from: fromNumber,
        amount: parseFloat(amount),
      });

      const responseData = (response.data as any)?.data || response.data;

      if (response.success) {
        showAlert(
          'Success',
          'Airtime-to-wallet request submitted successfully.',
          'success',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'airtime_to_wallet',
                  amount: parseFloat(amount),
                  recipient: phoneNumber,
                  network: selectedNetwork,
                  transactionId: responseData?.trans_id || responseData?.transaction_id || `ATW_${Date.now()}`,
                  status: responseData?.status || 'processing',
                  timestamp: new Date().toISOString(),
                  ...(responseData && { apiResponse: responseData }),
                },
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
        showAlert('Error', response.error || 'Failed to send airtime', 'error');
      }
    } catch {
      showAlert('Error', 'Failed to send airtime', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="wallet" size={32} color="white" />
          <Text style={styles.serviceTitle}>Airtime to Wallet</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={[styles.lookupButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={lookupRoute}>
          <Ionicons name="refresh" size={18} color={theme.primary} />
          <Text style={[styles.lookupButtonText, { color: theme.text }]}>Lookup Available Network / Number</Text>
        </TouchableOpacity>

        {lookupData ? (
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>Lookup Result</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>{JSON.stringify(lookupData, null, 2)}</Text>
          </View>
        ) : null}

        <Text style={[styles.label, { color: theme.text }]}>Network</Text>
        <View style={styles.networkRow}>
          {NETWORKS.map((network) => (
            <TouchableOpacity
              key={network.id}
              style={[styles.networkTab, { borderColor: theme.border, backgroundColor: selectedNetwork === network.id ? theme.primary : 'transparent' }]}
              onPress={() => setSelectedNetwork(network.id)}
            >
              <Text style={{ color: selectedNetwork === network.id ? 'white' : theme.text }}>{network.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Payscribe Wallet Number</Text>
        <TextInput style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="070..." placeholderTextColor={theme.textSecondary} keyboardType="phone-pad" />

        <Text style={[styles.label, { color: theme.text }]}>Your Sending Number</Text>
        <TextInput style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]} value={fromNumber} onChangeText={setFromNumber} placeholder="081..." placeholderTextColor={theme.textSecondary} keyboardType="phone-pad" />

        <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
        <TextInput style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]} value={amount} onChangeText={setAmount} placeholder="1000" placeholderTextColor={theme.textSecondary} keyboardType="numeric" />

        <Text style={[styles.helper, { color: theme.textSecondary }]}>Wallet is credited once the airtime is received.</Text>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.primary }]} onPress={sendAirtime} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Send Airtime</Text>}
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minHeight: 140 },
  backButton: { position: 'absolute', left: 20, top: 50 },
  headerContent: { alignItems: 'center', gap: 6 },
  serviceTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  lookupButton: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  lookupButtonText: { fontWeight: '600' },
  infoCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  infoText: { fontSize: 12, fontFamily: 'monospace' },
  label: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  networkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  networkTab: { borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  helper: { fontSize: 12, marginTop: 2 },
  submitButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default AirtimeToWalletScreen;