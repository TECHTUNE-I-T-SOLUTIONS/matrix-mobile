// src/screens/dashboard/InternetScreen.tsx
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

const INTERNET_PROVIDERS = [{ id: 'spectranet', name: 'Spectranet', color: '#1E40AF' }];

interface InternetPlan {
  id: string;
  name: string;
  amount: number;
}

const InternetScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { walletBalance, refreshBalance } = useWalletBalance();
  const [selectedProvider, setSelectedProvider] = useState('spectranet');
  const [accountNumber, setAccountNumber] = useState('');
  const [internetPlans, setInternetPlans] = useState<InternetPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<InternetPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
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

    if (selectedProvider === 'spectranet') {
      fetchSpectranetPlans();
    } else {
      setInternetPlans([]);
      setSelectedPlan(null);
    }
  }, [selectedProvider]);

  const fetchSpectranetPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await apiClient.get('/services/bundles/internet');

      if (!response.success) {
        showAlert('Error', response.error || 'Failed to load internet plans', 'error');
        setInternetPlans([]);
        return;
      }

      const bundles = (response.data as any)?.data?.bundles || (response.data as any)?.bundles || [];
      const normalizedPlans: InternetPlan[] = Array.isArray(bundles)
        ? bundles
            .filter((plan: any) => plan && (plan.id || plan.name || plan.title))
            .map((plan: any) => ({
              id: String(plan.id || plan.plan_id || plan.code || ''),
              name: String(plan.name || plan.title || 'Internet Plan'),
              amount: Number(plan.amount || 0),
            }))
        : [];

      setInternetPlans(normalizedPlans);
      setSelectedPlan((current) => {
        if (current && normalizedPlans.some((plan) => plan.id === current.id)) {
          return current;
        }
        return normalizedPlans[0] || null;
      });
    } catch (error) {
      console.error('Failed to fetch internet plans:', error);
      showAlert('Error', 'Failed to load internet plans', 'error');
      setInternetPlans([]);
      setSelectedPlan(null);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProvider || !accountNumber || !selectedPlan) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    const availableBalance = Number(walletBalance.balance || 0);
    const requiredAmount = Number(selectedPlan.amount || 0);

    if (availableBalance < requiredAmount) {
      showAlert(
        'Insufficient Balance',
        `You need ₦${requiredAmount.toLocaleString()} to buy ${selectedPlan.name}, but your wallet balance is only ₦${availableBalance.toLocaleString()}. Please fund your wallet and try again.`,
        'error'
      );
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/internet', {
        provider: selectedProvider,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        account: accountNumber,
        amount: selectedPlan.amount,
        qty: 1,
      });

      if (response.success) {
        showAlert('Success', 'Internet subscription successful!', 'success', [
          {
            text: 'View Receipt',
            onPress: () =>
              navigation.navigate('Success', {
                data: {
                  serviceType: 'internet',
                  amount: selectedPlan.amount,
                  recipient: accountNumber,
                  provider: selectedProvider,
                  planName: selectedPlan.name,
                  transactionId: (response as any).transactionId || `TXN_${Date.now()}`,
                  apiResponse: response.data,
                  pin: (response.data as any)?.pin,
                  serial: (response.data as any)?.serial,
                  status: (response.data as any)?.status || 'completed',
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
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="globe" size={32} color="white" />
          </View>
          <Text style={styles.serviceTitle}>Internet Services</Text>
          <Text style={styles.serviceDescription}>
            Subscribe to Spectranet plans from Payscribe
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

        {/* Plan Selection */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Plan</Text>
          {loadingPlans ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading plans...</Text>
            </View>
          ) : internetPlans.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansScrollView}>
              {internetPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: selectedPlan?.id === plan.id ? theme.primary : theme.surface,
                      borderColor: selectedPlan?.id === plan.id ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <Text
                    style={[
                      styles.planName,
                      {
                        color: selectedPlan?.id === plan.id ? '#ffffff' : theme.text,
                      },
                    ]}
                  >
                    {plan.name}
                  </Text>
                  <Text
                    style={[
                      styles.planAmount,
                      {
                        color: selectedPlan?.id === plan.id ? '#ffffff' : theme.primary,
                      },
                    ]}
                  >
                    ₦{plan.amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>No internet plans available right now.</Text>
          )}
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

        {/* Purchase Button */}
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            { backgroundColor: theme.primary },
            (!selectedProvider || !accountNumber || !selectedPlan || loading) && styles.disabledButton,
          ]}
          onPress={handlePurchase}
          disabled={!selectedProvider || !accountNumber || !selectedPlan || loading}
        >
          {loading ? (
            <Text style={styles.purchaseText}>Processing...</Text>
          ) : (
            <Text style={styles.purchaseText}>Subscribe to Internet</Text>
          )}
        </TouchableOpacity>
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
