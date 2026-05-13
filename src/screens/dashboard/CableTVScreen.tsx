// src/screens/dashboard/CableTVScreen.tsx
import React, { useState, useEffect } from 'react';
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

interface CablePlan {
  id: string;
  plan_id?: string;
  name: string;
  amount: number;
  duration: string;
}

const CABLE_PROVIDERS = [
  { id: 'dstv', name: 'DSTV', color: '#1E3A8A' },
  { id: 'gotv', name: 'GOTV', color: '#059669' },
  { id: 'startimes', name: 'Startimes', color: '#DC2626' },
];

const CableTVScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [smartCardNumber, setSmartCardNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [cablePlans, setCablePlans] = useState<CablePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CablePlan | null>(null);
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
    if (selectedProvider) {
      fetchCablePlans();
    }
  }, [selectedProvider]);

  const fetchCablePlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await apiClient.get(`/services/tv/packages?service=${selectedProvider}`);
      if (response.success && response.data) {
        const plans = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || (response.data as any)?.message?.details || [];

        const normalizedPlans = (plans as any[]).map((plan: any) => ({
          id: plan.id || plan.plan_id,
          plan_id: plan.plan_id || plan.id,
          name: plan.name,
          amount: parseFloat(plan.amount) || 0,
          duration: plan.validity || plan.duration || '1 month',
        }));

        setCablePlans(normalizedPlans);
      } else {
        setCablePlans([]);
        showAlert('Error', 'Failed to load cable plans', 'error');
      }
    } catch (error) {
      console.error('Fetch cable plans error:', error);
      setCablePlans([]);
      showAlert('Error', 'Failed to load cable plans', 'error');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProvider || !smartCardNumber || !selectedPlan) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/tv/purchase', {
        smartcard_number: smartCardNumber,
        package_id: selectedPlan.plan_id || selectedPlan.id,
        service: selectedProvider,
        amount: selectedPlan.amount,
      });

      if (response.success) {
        showAlert('Success', 'Cable TV subscription successful!', 'success', [
          {
            text: 'View Receipt',
            onPress: () =>
              navigation.navigate('Success', {
                data: {
                  serviceType: 'cabletv',
                  amount: selectedPlan.amount,
                  recipient: smartCardNumber,
                  planName: selectedPlan.name,
                  provider: selectedProvider,
                  transactionId:
                    (response as any).data?.transaction_id || (response as any).data?.reference || `TXN_${Date.now()}`,
                  status: (response as any).data?.status || 'completed',
                  timestamp: new Date().toISOString(),
                  ...(response as any).data && { apiResponse: (response as any).data },
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
              <Ionicons name="tv" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Cable TV</Text>
            <Text style={styles.serviceDescription}>
              Subscribe to DSTV, GOTV, Startimes
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Select Provider</Text>

          {/* Provider Selection */}
          <View style={styles.providerGrid}>
            {CABLE_PROVIDERS.map((provider) => (
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

          {/* Smart Card Number */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Smart Card Number</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter smart card number"
              placeholderTextColor={theme.textSecondary}
              value={smartCardNumber}
              onChangeText={setSmartCardNumber}
              keyboardType="numeric"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Phone Number</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter phone number"
              placeholderTextColor={theme.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Email Address</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter email address"
              placeholderTextColor={theme.textSecondary}
              value={userEmail}
              onChangeText={setUserEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Cable Plans */}
          {selectedProvider && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Plan</Text>
              {loadingPlans ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Loading cable plans...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.plansScrollView}
                >
                  {cablePlans.map((plan) => (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planCard,
                        {
                          backgroundColor: selectedPlan?.id === plan.id ? theme.primary : theme.surface,
                          borderColor: theme.border,
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
                        ₦{plan.amount}
                      </Text>
                      <Text
                        style={[
                          styles.planDuration,
                          {
                            color: selectedPlan?.id === plan.id ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                          },
                        ]}
                      >
                        {plan.duration}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Purchase Button */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: theme.primary },
              (!selectedProvider || !smartCardNumber || !selectedPlan || loading) && styles.disabledButton,
            ]}
            onPress={handlePurchase}
            disabled={!selectedProvider || !smartCardNumber || !selectedPlan || loading}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>Subscribe to Cable TV</Text>
            )}
          </TouchableOpacity>
        </View>
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={closeAlert} />
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
  planAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planDuration: {
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

export default CableTVScreen;
