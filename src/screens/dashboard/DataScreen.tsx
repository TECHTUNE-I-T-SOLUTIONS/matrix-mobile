// src/screens/dashboard/DataScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';

interface DataPlan {
  plan_code: string;
  name: string;
  category: string;
  alias: string;
  amount: number;
  discount: number;
  discount_type: string;
  capped_at: string;
}

interface GroupedPlans {
  [category: string]: DataPlan[];
}

const NETWORKS = [
  { id: 'mtn', name: 'MTN', color: '#FFC107' },
  { id: 'airtel', name: 'Airtel', color: '#FF4444' },
  { id: 'glo', name: 'Glo', color: '#4CAF50' },
  { id: '9mobile', name: '9Mobile', color: '#2196F3' },
  { id: 'smile', name: 'Smile', color: '#059669' },
];

const { width } = Dimensions.get('window');

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
  const itemsPerPage = 12; // Show 12 plans per page (3x4 grid)

  useEffect(() => {
    if (selectedNetwork) {
      fetchDataPlans();
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (selectedCategory === '' && Object.keys(groupedPlans).length > 0) {
      setSelectedCategory(Object.keys(groupedPlans)[0]);
    }
  }, [selectedNetwork, dataPlans]);

  // Group plans by category like the website
  const groupedPlans = dataPlans.reduce((acc: GroupedPlans, plan) => {
    let category = 'Other';
    const name = plan.name.toLowerCase();
    const planCategory = plan.category.toLowerCase();

    // Priority 1: Special bundle types (most specific)
    if (name.includes('-gifting')) {
      category = 'Gifting';
    }
    else if (name.includes('-awoof')) {
      category = 'Awoof';
    }
    // Priority 2: Special plan types
    else if (name.includes('hynet broadband') || name.includes('broadband')) {
      category = 'Broadband';
    }
    else if (name.includes('xtradata') || name.includes('xtra-data') || name.includes('xtra special')) {
      category = 'XtraData';
    }
    else if (name.includes('thryvedata') || name.includes('thryve')) {
      category = 'ThryveData';
    }
    // Priority 3: Business/SME plans
    else if (name.includes('sme') || planCategory.includes('sme')) {
      category = 'SME';
    }
    // Priority 4: Data sharing plans
    else if (name.includes('data share') || name.includes('share')) {
      category = 'Data Share';
    }
    // Priority 5: Time-based plans (more specific patterns)
    else if (name.includes('365days') || name.includes('365 days') || planCategory.includes('365')) {
      category = 'Yearly';
    }
    else if (name.includes('90days') || name.includes('90 days') || planCategory.includes('90')) {
      category = '90 Days';
    }
    else if (name.includes('60days') || name.includes('60 days') || planCategory.includes('60')) {
      category = '60 Days';
    }
    else if (name.includes('30days') || name.includes('30 days') || name.includes('monthly') || planCategory === 'monthly' || planCategory === '30days') {
      category = 'Monthly';
    }
    else if (name.includes('7days') || name.includes('7 days') || name.includes('weekly') || planCategory === 'days' || planCategory === '36' || planCategory === 'weekly') {
      category = 'Weekly';
    }
    else if (name.includes('2days') || name.includes('2 days') || planCategory === '33' || planCategory === '39') {
      category = '2 Days';
    }
    else if (name.includes('3days') || name.includes('3 days')) {
      category = '3 Days';
    }
    else if (name.includes('1days') || name.includes('1 day') || name.includes('daily') || planCategory === 'day' || planCategory === '30') {
      category = 'Daily';
    }
    // Priority 6: Data size based categories (fallback for plans without clear time indicators)
    else if (name.includes('unlimited') || planCategory === 'lte') {
      category = 'Unlimited';
    }
    else if (name.match(/\d+(\.\d+)?gb/) || name.match(/\d+(\.\d+)?gb/)) {
      const gbMatch = name.match(/(\d+(?:\.\d+)?)\s*gb/i);
      if (gbMatch) {
        const gb = parseFloat(gbMatch[1]);
        if (gb >= 100) category = '100GB+';
        else if (gb >= 50) category = '50-99GB';
        else if (gb >= 20) category = '20-49GB';
        else if (gb >= 10) category = '10-19GB';
        else if (gb >= 5) category = '5-9GB';
        else if (gb >= 2) category = '2-4GB';
        else if (gb >= 1) category = '1-1.9GB';
        else category = '< 1GB';
      }
    }
    // Priority 7: Corporate and special plans
    else if (name.includes('corporate') || planCategory.includes('corporate')) {
      category = 'Corporate';
    }
    else if (name.includes('direct') || name.includes('special') || planCategory === 'plan') {
      category = 'Special';
    }
    // Priority 8: Generic promotional plans (lowest priority)
    else if (name.includes('promo') || name.includes('bonus') || name.includes('offer')) {
      category = 'Promo';
    }

    if (!acc[category]) acc[category] = [];
    acc[category].push(plan);
    return acc;
  }, {});

  const categories = Object.keys(groupedPlans).sort((a, b) => {
    // Define preferred category order
    const categoryOrder = [
      'Daily', '2 Days', '3 Days', 'Weekly', 'Monthly', '60 Days', '90 Days', 'Yearly',
      'Gifting', 'Awoof', 'Data Share', 'SME', 'Broadband', 'XtraData', 'ThryveData',
      'Unlimited', '100GB+', '50-99GB', '20-49GB', '10-19GB', '5-9GB', '2-4GB', '1-1.9GB', '< 1GB',
      'Promo', 'Special', 'Corporate', 'Other'
    ];

    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    // If both categories are in the order array, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one is in the order array, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });

  const activeCategory = selectedCategory || categories[0];
  const allCategoryPlans = groupedPlans[activeCategory] || [];

  // Pagination logic
  const totalPages = Math.ceil(allCategoryPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const categoryPlans = allCategoryPlans.slice(startIndex, endIndex);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when category changes
    setSelectedPlan(null); // Clear selected plan
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPlan(null); // Clear selected plan when page changes
  };

  const fetchDataPlans = async () => {
    try {
      setLoadingPlans(true);
      console.log(`Fetching data plans for network: ${selectedNetwork}`);
      const response = await apiClient.get(`/services/data/plans?network=${selectedNetwork}`);
      console.log('API Response:', response);

      if (response.success) {
        let plans: DataPlan[] = [];
        const data = response.data as any;

        if (Array.isArray(data)) {
          // Direct array response
          plans = data;
        } else if (data?.data && Array.isArray(data.data)) {
          // Nested data response
          plans = data.data;
        } else if (data?.message?.details && Array.isArray(data.message.details) && data.message.details.length > 0) {
          // Payscribe nested response
          const networkDetails = data.message.details[0];
          plans = networkDetails.plans || [];
        }

        console.log(`Loaded ${plans.length} plans`);
        setDataPlans(plans);
        // Reset category selection when network changes
        setSelectedCategory('');
        setSelectedPlan(null);
        setCurrentPage(1); // Reset pagination
      } else {
        console.log('API call failed:', response);
        setDataPlans([]);
        const errorMessage = response.error || 'Failed to load data plans';
        Alert.alert('Error', `Failed to load data plans: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Fetch data plans error:', error);
      setDataPlans([]);
      Alert.alert('Error', 'Failed to load data plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedNetwork || !phoneNumber || !selectedPlan) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/data', {
        phone_number: phoneNumber,
        plan_id: selectedPlan.plan_code,
        network: selectedNetwork,
        amount: selectedPlan.amount,
        quantity: 1,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Data purchase successful!',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'data',
                  amount: selectedPlan.amount,
                  recipient: phoneNumber,
                  planName: selectedPlan.name,
                  network: selectedNetwork,
                  transactionId: (response as any).data?.transaction_id || (response as any).data?.matrix_transaction_id || `TXN_${Date.now()}`,
                  status: (response as any).data?.status || 'completed',
                  timestamp: (response as any).data?.created_at || new Date().toISOString(),
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
              <Ionicons name="wifi" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Buy Data</Text>
            <Text style={styles.serviceDescription}>
              Purchase data bundles for MTN, Airtel, Glo, 9Mobile
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Network Tabs */}
          <View style={styles.networkTabs}>
            {NETWORKS.map((network) => (
              <TouchableOpacity
                key={network.id}
                style={[
                  styles.networkTab,
                  {
                    backgroundColor: selectedNetwork === network.id ? network.color : 'transparent',
                    borderColor: selectedNetwork === network.id ? network.color : theme.border,
                  },
                ]}
                onPress={() => {
                  setSelectedNetwork(network.id);
                  setSelectedCategory('');
                  setSelectedPlan(null);
                }}
              >
                <Text
                  style={[
                    styles.networkTabText,
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

          {/* Category Tabs and Plans */}
          {selectedNetwork && (
            <View style={styles.fieldContainer}>
              {loadingPlans ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Loading data plans...
                  </Text>
                </View>
              ) : dataPlans.length > 0 ? (
                <>
                  {/* Category Tabs */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryTabs}
                  >
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryTab,
                          {
                            backgroundColor: activeCategory === category ? theme.primary : theme.surface,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => handleCategoryChange(category)}
                      >
                        <Text
                          style={[
                            styles.categoryTabText,
                            {
                              color: activeCategory === category ? '#ffffff' : theme.text,
                            },
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Plans Grid */}
                  <View style={styles.plansGrid}>
                    {categoryPlans.map((plan) => (
                      <TouchableOpacity
                        key={plan.plan_code}
                        style={[
                          styles.planCard,
                          {
                            backgroundColor: selectedPlan?.plan_code === plan.plan_code ? theme.primary : theme.surface,
                            borderColor: selectedPlan?.plan_code === plan.plan_code ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setSelectedPlan(plan)}
                      >
                        <View style={styles.planHeader}>
                          <Text
                            style={[
                              styles.planName,
                              {
                                color: selectedPlan?.plan_code === plan.plan_code ? '#ffffff' : theme.text,
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {plan.name}
                          </Text>
                          {selectedPlan?.plan_code === plan.plan_code && (
                            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                          )}
                        </View>
                        {plan.alias && plan.alias !== plan.name && (
                          <Text
                            style={[
                              styles.planAlias,
                              {
                                color: selectedPlan?.plan_code === plan.plan_code ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {plan.alias}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.planAmount,
                            {
                              color: selectedPlan?.plan_code === plan.plan_code ? '#ffffff' : '#10B981',
                            },
                          ]}
                        >
                          ₦{plan.amount.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
                        onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? theme.textSecondary : theme.primary} />
                        <Text style={[styles.paginationText, { color: currentPage === 1 ? theme.textSecondary : theme.primary }]}>
                          Previous
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.pageIndicator}>
                        <Text style={[styles.pageIndicatorText, { color: theme.textSecondary }]}>
                          {currentPage} of {totalPages}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
                        onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <Text style={[styles.paginationText, { color: currentPage === totalPages ? theme.textSecondary : theme.primary }]}>
                          Next
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? theme.textSecondary : theme.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noPlansContainer}>
                  <Ionicons name="information-circle-outline" size={48} color={theme.textSecondary} />
                  <Text style={[styles.noPlansText, { color: theme.textSecondary }]}>
                    No plans available for {NETWORKS.find(n => n.id === selectedNetwork)?.name}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Purchase Button */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: theme.primary },
              (!selectedNetwork || !phoneNumber || !selectedPlan || loading) && styles.disabledButton,
            ]}
            onPress={handlePurchase}
            disabled={!selectedNetwork || !phoneNumber || !selectedPlan || loading}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>Purchase Data</Text>
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
  networkTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  networkTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  networkTabText: {
    fontSize: 14,
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
  categoryTabs: {
    marginBottom: 16,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  planCard: {
    width: (width - 40 - 24) / 2, // Two columns with gap
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  planAlias: {
    fontSize: 12,
    marginBottom: 8,
  },
  planAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noPlansContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPlansText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  pageIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DataScreen;
