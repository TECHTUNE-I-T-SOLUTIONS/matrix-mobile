// src/screens/dashboard/BettingScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';
import { useWalletBalance } from '../../contexts/WalletBalanceContext';

interface BettingProvider {
  id: string;
  name: string;
  description?: string;
}

interface BettingValidationResult {
  account_name: string;
  account_number: string;
  bet_id: string;
  customer_id: string;
  description?: string;
}

const BettingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { walletBalance, refreshBalance } = useWalletBalance();
  const [providers, setProviders] = useState<BettingProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [validationResult, setValidationResult] = useState<BettingValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    buttons: undefined as
      | Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
      | undefined,
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ) => setAlertConfig({ visible: true, title, message, type, buttons });

  const closeAlert = () => setAlertConfig((c) => ({ ...c, visible: false }));

  useEffect(() => {
    refreshBalance().catch(() => undefined);
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await apiClient.get('/services/bundles/betting');
      if (!response.success) {
        showAlert('Error', response.error || 'Failed to load betting providers', 'error');
        setProviders([]);
        return;
      }

      const bundles = (response.data as any)?.data?.bundles || (response.data as any)?.bundles || [];
      const normalizedProviders: BettingProvider[] = Array.isArray(bundles)
        ? bundles
            .filter((provider: any) => provider && (provider.id || provider.name))
            .map((provider: any) => ({
              id: String(provider.id || '').toLowerCase(),
              name: String(provider.name || provider.title || 'Betting Provider'),
              description: String(provider.description || ''),
            }))
        : [];

      setProviders(normalizedProviders);
      if (!selectedProvider && normalizedProviders.length > 0) {
        setSelectedProvider(normalizedProviders[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch betting providers:', error);
      showAlert('Error', 'Failed to load betting providers', 'error');
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleValidateAccount = async () => {
    if (!selectedProvider || !customerId) {
      showAlert('Error', 'Select a provider and enter the customer ID first', 'error');
      return;
    }

    try {
      setValidating(true);
      setValidationResult(null);
      setCustomerName('');

      const response = await apiClient.get(`/services/betting/lookup?bet_id=${encodeURIComponent(selectedProvider)}&customer_id=${encodeURIComponent(customerId)}`);

      if (!response.success) {
        showAlert('Validation Failed', response.error || 'Unable to validate betting account', 'error');
        return;
      }

      const data = response.data as any;
      const validated: BettingValidationResult = {
        account_name: String(data?.account_name || data?.message?.details?.name || ''),
        account_number: String(data?.account_number || data?.customer_id || customerId),
        bet_id: String(data?.bet_id || selectedProvider),
        customer_id: String(data?.customer_id || customerId),
        description: String(data?.description || 'Validation successful'),
      };

      setValidationResult(validated);
      setCustomerName(validated.account_name);

      setAmount('');

      showAlert(
        'Validation Successful',
        `${validated.account_name || 'Customer'} has been verified for ${selectedProvider.toUpperCase()}.`,
        'success'
      );
    } catch (error) {
      console.error('Validation error:', error);
      showAlert('Validation Failed', 'Unable to validate the betting account', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProvider || !customerId || !amount || !validationResult) {
      showAlert('Error', 'Please validate the betting account before funding', 'error');
      return;
    }

    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue < 100) {
      showAlert('Error', 'Minimum amount is ₦100', 'error');
      return;
    }

    const availableBalance = Number(walletBalance.balance || 0);
    if (availableBalance < amountValue) {
      showAlert(
        'Insufficient Balance',
        `You need ₦${amountValue.toLocaleString()} to fund this betting wallet, but your wallet balance is only ₦${availableBalance.toLocaleString()}. Please fund your wallet and try again.`,
        'error'
      );
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/betting', {
        betId: selectedProvider,
        amount: amountValue,
        customerId,
        customerName: customerName || validationResult.account_name || customerId,
      });

      if (response.success) {
        showAlert('Success', 'Betting account funded successfully!', 'success', [
          {
            text: 'View Receipt',
            onPress: () =>
              navigation.navigate('Success', {
                data: {
                  serviceType: 'betting',
                  amount: amountValue,
                  recipient: customerId,
                  provider: selectedProvider,
                  planName: validationResult.account_name,
                  betId: selectedProvider,
                  customerName: validationResult.account_name || customerName || customerId,
                  transactionId: (response as any).data?.transaction_id || (response as any).data?.matrix_transaction_id || `TXN_${Date.now()}`,
                  apiResponse: response.data,
                  status: (response as any).data?.status || 'completed',
                  timestamp: new Date().toISOString(),
                },
              }),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]);
      } else {
        showAlert('Error', response.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showAlert('Error', 'Failed to complete purchase', 'error');
    } finally {
      setLoading(false);
      refreshBalance().catch(() => undefined);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="football" size={32} color="white" />
          </View>
          <Text style={styles.serviceTitle}>Betting & Gaming</Text>
          <Text style={styles.serviceDescription}>Load the provider list, validate the betting account, then fund the wallet.</Text>
        </View>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Select Provider</Text>

        {loadingProviders ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading providers...</Text>
          </View>
        ) : (
          <View style={styles.providerGrid}>
            {providers.map((provider) => (
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
                  setValidationResult(null);
                  setCustomerName('');
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
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Provider is selected from the list above. No free-text Bet ID input. */}

        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Customer ID</Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
            placeholder="Enter customer ID"
            placeholderTextColor={theme.textSecondary}
            value={customerId}
            onChangeText={(text) => {
              setCustomerId(text.trim());
              setValidationResult(null);
              setCustomerName('');
            }}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { borderColor: theme.primary },
            (validating || !selectedProvider || !customerId) && styles.disabledButton,
          ]}
          onPress={handleValidateAccount}
          disabled={validating || !selectedProvider || !customerId}
        >
          {validating ? (
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Validating...</Text>
          ) : (
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Validate Account</Text>
          )}
        </TouchableOpacity>

        {validationResult && (
          <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
            <View style={styles.validationTextContainer}>
              <Text style={[styles.validationTitle, { color: theme.text }]}>Account validated</Text>
              <Text style={[styles.infoText, { color: theme.text }]}>
                {validationResult.account_name || 'Customer'} - {validationResult.account_number}
              </Text>
            </View>
          </View>
        )}

        {validationResult && (
          <>
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

            <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="wallet" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                Wallet balance: ₦{Number(walletBalance.balance || 0).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                { backgroundColor: theme.primary },
                (!selectedProvider || !customerId || !amount || !validationResult || loading) && styles.disabledButton,
              ]}
              onPress={handlePurchase}
              disabled={!selectedProvider || !customerId || !amount || !validationResult || loading}
            >
              {loading ? (
                <Text style={styles.purchaseText}>Processing...</Text>
              ) : (
                <Text style={styles.purchaseText}>Fund Betting Wallet</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  validationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
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

export default BettingScreen;
