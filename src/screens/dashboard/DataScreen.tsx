// src/screens/dashboard/DataScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Dimensions,
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

interface DataPlan {
  plan_code: string;
  name: string;
  amount: number;
  category: string;
  alias?: string;
  discount?: number;
  discount_type?: string;
}

interface GroupedPlans {
  [key: string]: DataPlan[];
}

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

const UNAVAILABLE_PLANS = ['PSPLAN_316', 'PSPLAN_318'];

const { width } = Dimensions.get('window');

// Memoized Plan Card for performance
const PlanCard = React.memo(({ 
  plan, 
  isSelected, 
  onPress, 
  theme 
}: { 
  plan: DataPlan; 
  isSelected: boolean; 
  onPress: () => void; 
  theme: any 
}) => (
  <TouchableOpacity
    style={[
      styles.planCard,
      {
        backgroundColor: isSelected ? theme.primary : theme.surface,
        borderColor: isSelected ? theme.primary : theme.border,
      },
    ]}
    onPress={onPress}
  >
    <View style={styles.planHeader}>
      <Text
        style={[
          styles.planName,
          { color: isSelected ? '#ffffff' : theme.text },
        ]}
        numberOfLines={2}
      >
        {plan.name}
      </Text>
      {isSelected && <Ionicons name="checkmark-circle" size={18} color="#ffffff" />}
    </View>
    <Text
      style={[
        styles.planAmount,
        { color: isSelected ? '#ffffff' : '#10B981' },
      ]}
    >
      ₦{plan.amount.toLocaleString()}
    </Text>
  </TouchableOpacity>
));

const DataScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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

  const detectNetwork = (number: string) => {
    let cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('+234')) {
      cleanNumber = '0' + cleanNumber.slice(4);
    } else if (cleanNumber.startsWith('234')) {
      cleanNumber = '0' + cleanNumber.slice(3);
    }

    if (cleanNumber.length >= 4) {
      const prefix = cleanNumber.substring(0, 4);
      const network = NETWORK_PREFIXES[prefix];
      if (network && network !== selectedNetwork) {
        setSelectedNetwork(network);
      }
    }
    return cleanNumber;
  };

  const handlePhoneNumberChange = (text: string) => {
    const cleaned = detectNetwork(text);
    setPhoneNumber(cleaned);
  };

  const fetchDataPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await apiClient.get(`/services/data/plans?network=${selectedNetwork}`);
      
      if (response.success) {
        let plans: DataPlan[] = [];
        const data = response.data as any;
        if (Array.isArray(data)) plans = data;
        else if (data?.data && Array.isArray(data.data)) plans = data.data;
        else if (data?.message?.details?.[0]?.plans) plans = data.message.details[0].plans;

        setDataPlans(plans);
        setSelectedCategory('');
        setSelectedPlan(null);
        setCurrentPage(1);
      } else {
        if (response.error?.toLowerCase().includes('fetch') || response.error?.toLowerCase().includes('network')) {
          showAlert('No Internet', 'Please check your internet connection and try again.', 'error');
        } else {
          showAlert('Error', response.error || 'Failed to load plans', 'error');
        }
        setDataPlans([]);
      }
    } catch (error: any) {
      showAlert('No Internet', 'Please check your internet connection and try again.', 'error');
      setDataPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchDataPlans();
  }, [selectedNetwork]);

  // Grouping logic remains same but memoized
  const groupedPlans = useMemo(() => {
    return dataPlans.reduce((acc: GroupedPlans, plan) => {
      let category = 'Other';
      const name = plan.name.toLowerCase();
      const planCategory = plan.category.toLowerCase();

      if (name.includes('-gifting')) category = 'Gifting';
      else if (name.includes('-awoof')) category = 'Awoof';
      else if (name.includes('broadband')) category = 'Broadband';
      else if (name.includes('xtradata')) category = 'XtraData';
      else if (name.includes('sme')) category = 'SME';
      else if (name.includes('share')) category = 'Data Share';
      else if (name.includes('365days')) category = 'Yearly';
      else if (name.includes('30days') || name.includes('monthly')) category = 'Monthly';
      else if (name.includes('7days') || name.includes('weekly')) category = 'Weekly';
      else if (name.includes('daily') || name.includes('1days')) category = 'Daily';
      else if (name.includes('corporate')) category = 'Corporate';
      else if (name.includes('direct')) category = 'Special';

      if (!acc[category]) acc[category] = [];
      acc[category].push(plan);
      return acc;
    }, {});
  }, [dataPlans]);

  const categories = useMemo(() => {
    const keys = Object.keys(groupedPlans);
    const order = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'SME', 'Gifting', 'Awoof', 'Data Share', 'Broadband', 'XtraData', 'Corporate', 'Special', 'Other'];
    return keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [groupedPlans]);

  const activeCategory = selectedCategory || categories[0];
  const allCategoryPlans = groupedPlans[activeCategory] || [];
  const totalPages = Math.ceil(allCategoryPlans.length / itemsPerPage);
  const categoryPlans = allCategoryPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectPlan = (plan: DataPlan) => {
    if (UNAVAILABLE_PLANS.includes(plan.plan_code)) {
      showAlert('Plan Unavailable', 'This plan is temporarily unavailable from the network provider. Please try another plan.', 'warning');
      return;
    }
    setSelectedPlan(plan);
  };

  const handlePurchase = () => {
    if (!selectedNetwork || !phoneNumber || !selectedPlan) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    showAlert(
      'Confirm Purchase',
      `You are about to purchase ${selectedPlan.name} for ${phoneNumber}. Amount: ₦${selectedPlan.amount}. Proceed?`,
      'info',
      processPurchase
    );
  };

  const processPurchase = async () => {
    const plan = selectedPlan;
    if (!plan) return;
    
    try {
      setLoading(true);
      const response = await apiClient.post('/services/data', {
        phone_number: phoneNumber,
        plan_id: plan.plan_code,
        network: selectedNetwork,
        amount: plan.amount,
        quantity: 1,
      });

      if (response.success) {
        navigation.navigate('Success', {
          data: {
            serviceType: 'data',
            amount: plan.amount,
            recipient: phoneNumber,
            planName: plan.name,
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
      showAlert('No Internet', 'Please check your internet connection.', 'error');
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
            <Ionicons name="wifi" size={32} color="white" />
            <Text style={styles.serviceTitle}>Buy Data</Text>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Network Selection */}
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

          {loadingPlans ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
          ) : (
            <View>
              {/* Category Selection */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryTab, { 
                      backgroundColor: activeCategory === c ? theme.primary : theme.surface,
                      borderColor: theme.border 
                    }]}
                    onPress={() => { setSelectedCategory(c); setCurrentPage(1); setSelectedPlan(null); }}
                  >
                    <Text style={{ color: activeCategory === c ? '#fff' : theme.text }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Plans Grid */}
              <View style={styles.plansGrid}>
                {categoryPlans.map((p) => (
                  <PlanCard 
                    key={p.plan_code}
                    plan={p}
                    isSelected={selectedPlan?.plan_code === p.plan_code}
                    onPress={() => handleSelectPlan(p)}
                    theme={theme}
                  />
                ))}
              </View>

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity disabled={currentPage === 1} onPress={() => setCurrentPage(prev => prev - 1)}>
                    <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? theme.textSecondary : theme.primary} />
                  </TouchableOpacity>
                  <Text style={{ color: theme.textSecondary }}>{currentPage} / {totalPages}</Text>
                  <TouchableOpacity disabled={currentPage === totalPages} onPress={() => setCurrentPage(prev => prev + 1)}>
                    <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? theme.textSecondary : theme.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Fixed Purchase Button */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: theme.primary }, (!selectedPlan || !phoneNumber || loading) && { opacity: 0.5 }]}
            onPress={handlePurchase}
            disabled={!selectedPlan || !phoneNumber || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.purchaseText}>Purchase Data</Text>}
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
  categoryTabs: { marginBottom: 15 },
  categoryTab: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10 },
  plansGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planCard: { width: (width - 50) / 2, padding: 15, borderRadius: 12, borderWidth: 1, gap: 5 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontSize: 14, fontWeight: 'bold', flex: 1 },
  planAmount: { fontSize: 16, fontWeight: '900' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 20 },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  purchaseButton: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  purchaseText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default DataScreen;
