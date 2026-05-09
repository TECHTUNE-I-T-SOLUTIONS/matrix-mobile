import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';

interface VirtualAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  status: string;
  created_at: string;
}

interface Card {
  id: string;
  brand: string;
  last_four: string;
  card_type: string;
  currency: string;
  balance: number;
}

interface WalletData {
  wallet: {
    balance: number;
    lockedBalance: number;
    totalFunded: number;
    totalSpent: number;
  };
  virtualAccounts: VirtualAccount[];
  cards: Card[];
  transactions: any[];
  profile: {
    firstName: string;
    lastName: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const WalletScreen: React.FC = () => {
  const { theme } = useTheme();
  const { session } = useSession();
  const navigation = useNavigation<any>();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [copyingAccount, setCopyingAccount] = useState<string | null>(null);

  // Modal states
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(false);

  // Card creation form
  const [cardFormData, setCardFormData] = useState({
    brand: 'VISA',
    type: 'virtual',
    amount: '1',
    currency: 'USD',
  });

  // Dropdown states
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Payout form
  const [payoutStep, setPayoutStep] = useState<'bank' | 'account' | 'amount' | 'confirm'>('bank');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [showBankList, setShowBankList] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (showPayoutModal && payoutStep === 'bank') {
      fetchBanks();
    }
  }, [showPayoutModal, payoutStep]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);

      // Fetch data from multiple endpoints matching web app
      const [walletRes, accountsRes, cardsRes] = await Promise.all([
        apiClient.get('/payscribe/wallet') as Promise<ApiResponse<{ data: { wallet: any; recentTransactions: any[] } }>>,
        apiClient.get('/payscribe/virtual-accounts') as Promise<ApiResponse<VirtualAccount[]>>,
        apiClient.get('/payscribe/cards') as Promise<ApiResponse<Card[]>>,
      ]);

      if (walletRes.success && accountsRes.success && cardsRes.success) {
        console.log('Wallet API Response:', walletRes);
        console.log('Accounts API Response:', accountsRes);
        console.log('Cards API Response:', cardsRes);

        const walletApiData = walletRes.data?.data; // Access the nested data
        if (!walletApiData || !walletApiData.wallet) {
          console.error('Invalid wallet response structure:', walletApiData);
          Alert.alert('Error', 'Invalid wallet data structure');
          return;
        }

        // Extract accounts - API returns { success: true, data: [...] }
        let accounts: VirtualAccount[] = [];
        const accountsData = accountsRes.data as any;
        if (Array.isArray(accountsData)) {
          // Direct array
          accounts = accountsData;
        } else if (accountsData?.data && Array.isArray(accountsData.data)) {
          // Wrapped: { success: true, data: [...] }
          accounts = accountsData.data;
        }

        console.log('[WalletScreen] Extracted accounts:', accounts);

        // Extract cards
        let cards: Card[] = [];
        const cardsData = cardsRes.data as any;
        if (Array.isArray(cardsData)) {
          cards = cardsData;
        } else if (cardsData?.data && Array.isArray(cardsData.data)) {
          cards = cardsData.data;
        }

        setWalletData({
          wallet: walletApiData.wallet,
          virtualAccounts: accounts,
          cards: cards,
          transactions: walletApiData.recentTransactions || [],
          profile: {
            firstName: 'User', // This might need to be fetched separately or from session
            lastName: '',
          },
        });
      } else {
        console.error('API call failures:', { walletRes, accountsRes, cardsRes });
        Alert.alert('Error', 'Failed to load wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  // Card creation function
  const handleCreateCard = async () => {
    if (!cardFormData.amount || parseFloat(cardFormData.amount) < 1) {
      Alert.alert('Error', 'Minimum amount is 1 USD');
      return;
    }

    try {
      setCreatingCard(true);
      const response = await apiClient.post('/payscribe/cards/create', {
        brand: cardFormData.brand,
        type: cardFormData.type,
        amount: parseFloat(cardFormData.amount),
        currency: cardFormData.currency,
      });

      if (response.success) {
        Alert.alert('Success', 'Card created successfully!');
        setShowCardModal(false);
        setCardFormData({
          brand: 'VISA',
          type: 'virtual',
          amount: '1',
          currency: 'USD',
        });
        // Refresh wallet data after a short delay
        setTimeout(() => {
          fetchWalletData();
        }, 1000);
      } else {
        const errorMessage = response.error || 'Failed to create card';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error creating card:', error);
      Alert.alert('Error', 'Failed to create card');
    } finally {
      setCreatingCard(false);
    }
  };

  // Payout functions
  const fetchBanks = async () => {
    try {
      const response = await apiClient.get<any>('/payscribe/payouts/banks');
      if (response.success && response.data) {
        // Handle both nested and direct data structures
        let bankData = Array.isArray(response.data) ? response.data : (response.data?.data || []);

        // Remove duplicates based on code to prevent key conflicts
        const uniqueBanks = bankData.filter((bank: any, index: number, self: any[]) =>
          index === self.findIndex((b: any) => b.code === bank.code)
        );

        setBanks(uniqueBanks);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      Alert.alert('Error', 'Failed to load banks');
    }
  };

  const verifyAccount = async () => {
    if (!accountNumber.trim() || !selectedBank) {
      Alert.alert('Error', 'Please enter account number and select bank');
      return;
    }

    try {
      setProcessingPayout(true);
      const response = await apiClient.post<any>('/payscribe/payouts/account-lookup', {
        account: accountNumber,
        bank: selectedBank.code,
      });

      if (response.success && response.data) {
        console.log('Account verification response:', JSON.stringify(response, null, 2));
        console.log('Account data:', response.data);

        // Try multiple ways to extract account name
        let accountNameValue = null;

        // Method 1: Direct access
        if (response.data.account_name) {
          accountNameValue = response.data.account_name;
          console.log('Found account_name in direct data');
        } else if (response.data.accountName) {
          accountNameValue = response.data.accountName;
          console.log('Found accountName in direct data');
        }

        // Method 2: Nested data
        if (!accountNameValue && response.data.data) {
          if (response.data.data.account_name) {
            accountNameValue = response.data.data.account_name;
            console.log('Found account_name in nested data');
          } else if (response.data.data.accountName) {
            accountNameValue = response.data.data.accountName;
            console.log('Found accountName in nested data');
          }
        }

        // Method 3: Check if response.data itself is the account name
        if (!accountNameValue && typeof response.data === 'string') {
          accountNameValue = response.data;
          console.log('Response data is a string, using as account name');
        }

        console.log('Final account name value:', accountNameValue);

        if (accountNameValue && typeof accountNameValue === 'string') {
          setAccountName(accountNameValue);
          setPayoutStep('amount');
          // Temporary alert to show what was extracted
          Alert.alert('Account Verified', `Account Name: ${accountNameValue}`);
        } else {
          console.error('Could not extract account name from response');
          Alert.alert('Error', 'Account verification failed - no account name returned');
        }
      } else {
        console.log('Account verification failed:', response);
        Alert.alert('Error', 'Account verification failed');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      Alert.alert('Error', 'Failed to verify account');
    } finally {
      setProcessingPayout(false);
    }
  };

  const calculateFee = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = parseFloat(payoutAmount);
    if (amount > (walletData?.wallet.balance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    try {
      setProcessingPayout(true);
      const response = await apiClient.post<{ amount: number; fee: number; total: number }>('/payscribe/payouts/fee', {
        amount: amount,
      });

      if (response.success && response.data) {
        setFeeInfo(response.data);
        setPayoutStep('confirm');
      } else {
        Alert.alert('Error', 'Failed to calculate fee');
      }
    } catch (error) {
      console.error('Error calculating fee:', error);
      Alert.alert('Error', 'Failed to calculate fee');
    } finally {
      setProcessingPayout(false);
    }
  };

  const initiatePayout = async () => {
    if (!selectedBank || !accountName || !feeInfo) return;

    try {
      setProcessingPayout(true);
      const response = await apiClient.post('/payscribe/payouts/initiate', {
        amount: parseFloat(payoutAmount),
        bank_code: selectedBank.code,
        account_number: accountNumber,
        account_name: accountName,
        narration: narration || 'Wallet withdrawal',
      });

      if (response.success) {
        Alert.alert('Success', 'Payout initiated successfully!');
        setShowPayoutModal(false);
        resetPayoutForm();
        fetchWalletData();
      } else {
        Alert.alert('Error', response.error || 'Failed to initiate payout');
      }
    } catch (error) {
      console.error('Error initiating payout:', error);
      Alert.alert('Error', 'Failed to initiate payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const resetPayoutForm = () => {
    setPayoutStep('bank');
    setSelectedBank(null);
    setAccountNumber('');
    setAccountName('');
    setPayoutAmount('');
    setNarration('');
    setFeeInfo(null);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      setCopyingAccount(label);
      setTimeout(() => setCopyingAccount(null), 2000);
      Alert.alert('Copied', `${label} copied to clipboard!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.container}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Wallet Management</Text>
            <ThemeToggle />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Ionicons
                name="home"
                size={20}
                color={activeTab === 'overview' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'accounts' && styles.activeTab]}
              onPress={() => setActiveTab('accounts')}
            >
              <Ionicons
                name="wallet"
                size={20}
                color={activeTab === 'accounts' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'accounts' && styles.activeTabText]}>
                Accounts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'cards' && styles.activeTab]}
              onPress={() => setActiveTab('cards')}
            >
              <Ionicons
                name="card"
                size={20}
                color={activeTab === 'cards' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'cards' && styles.activeTabText]}>
                Cards
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}
            >
              <Ionicons
                name="time"
                size={20}
                color={activeTab === 'history' ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                History
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
          >
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && walletData && (
                <View style={styles.tabContent}>
                  {/* KYC Verification Banner */}
                  {session.user?.kyc_required && session.user?.kyc_status === 'not_started' && (
                    <TouchableOpacity
                      style={[styles.kycBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary }]}
                      onPress={() => navigation.navigate('KYC' as any)}
                    >
                      <View style={styles.kycBannerContent}>
                        <View style={[styles.kycIconContainer, { backgroundColor: theme.primary }]}>
                          <Ionicons name="shield-checkmark" size={24} color="white" />
                        </View>
                        <View style={styles.kycTextContainer}>
                          <Text style={[styles.kycTitle, { color: theme.text }]}>Verify Your Identity</Text>
                          <Text style={[styles.kycDescription, { color: theme.textSecondary }]}>
                            Complete your KYC to unlock all features including virtual cards and higher limits.
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                      </View>
                    </TouchableOpacity>
                  )}
                  {/* Main Balance Card */}
                  <LinearGradient
                    colors={[theme.primary, theme.primary + 'DD']}
                    style={styles.balanceCard}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardLabel}>Wallet Balance</Text>
                      <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                        <Ionicons
                          name={showBalance ? "eye-off" : "eye"}
                          size={24}
                          color="rgba(255, 255, 255, 0.8)"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.balance}>
                      {showBalance ? formatCurrency(walletData.wallet.balance) : '****'}
                    </Text>
                    <Text style={styles.currency}>NGN</Text>
                    {walletData.wallet.lockedBalance > 0 && (
                      <Text style={styles.lockedBalance}>
                        Locked: {formatCurrency(walletData.wallet.lockedBalance)}
                      </Text>
                    )}
                  </LinearGradient>

                  {/* Quick Stats */}
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Ionicons name="arrow-down" size={24} color="#10B981" />
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Funded</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {formatCurrency(walletData.wallet.totalFunded)}
                      </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Ionicons name="arrow-up" size={24} color="#EF4444" />
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Spent</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {formatCurrency(walletData.wallet.totalSpent)}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.quickActions}>
                    <TouchableOpacity
                      onPress={() => setShowPayoutModal(true)}
                      style={[styles.quickActionButton, { backgroundColor: theme.primary }]}
                    >
                      <Ionicons name="send" size={20} color="white" />
                      <Text style={styles.quickActionText}>Withdraw</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Accounts Tab */}
              {activeTab === 'accounts' && (
                <View style={styles.tabContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Virtual Accounts</Text>
                    <TouchableOpacity onPress={fetchWalletData}>
                      <Ionicons name="refresh" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>

                  {walletData?.virtualAccounts && walletData.virtualAccounts.length > 0 ? (
                    walletData.virtualAccounts.map((account) => (
                      <View
                        key={account.id}
                        style={[styles.accountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        <View style={styles.accountHeader}>
                          <Text style={[styles.accountName, { color: theme.text }]}>
                            {account.account_name || `${walletData.profile.firstName} ${walletData.profile.lastName}`}
                          </Text>
                          <View style={[styles.statusBadge, {
                            backgroundColor: account.status === 'active' ? '#10B981' : '#F59E0B'
                          }]}>
                            <Text style={styles.statusText}>{account.status}</Text>
                          </View>
                        </View>

                        <Text style={[styles.bankName, { color: theme.textSecondary }]}>
                          {account.bank_name}
                        </Text>

                        {/* Account Number */}
                        <View style={styles.accountDetail}>
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Account Number</Text>
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailValue, { color: theme.text }]}>
                              {account.account_number}
                            </Text>
                            <TouchableOpacity
                              onPress={() => copyToClipboard(account.account_number, account.account_number)}
                              style={styles.copyButton}
                            >
                              <Ionicons
                                name={copyingAccount === account.account_number ? "checkmark" : "copy"}
                                size={20}
                                color={theme.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Bank Name */}
                        <View style={styles.accountDetail}>
                          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Bank Name</Text>
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailValue, { color: theme.text }]}>
                              {account.bank_name}
                            </Text>
                            <TouchableOpacity
                              onPress={() => copyToClipboard(account.bank_name, `bank-${account.bank_name}`)}
                              style={styles.copyButton}
                            >
                              <Ionicons
                                name={copyingAccount === `bank-${account.bank_name}` ? "checkmark" : "copy"}
                                size={20}
                                color={theme.primary}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={[styles.createdDate, { color: theme.textSecondary }]}>
                          Created: {new Date(account.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="wallet" size={48} color={theme.textSecondary} />
                      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Virtual Accounts</Text>
                      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Complete your KYC to create virtual accounts for receiving payments.
                      </Text>
                    </View>
                  )}

                  <View style={[styles.infoBox, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                    <Ionicons name="information-circle" size={20} color={theme.primary} />
                    <Text style={[styles.infoText, { color: theme.text }]}>
                      Virtual accounts allow you to receive payments directly into your wallet. Share your account details with senders for instant transfers.
                    </Text>
                  </View>
                </View>
              )}

              {/* Cards Tab */}
              {activeTab === 'cards' && (
                <View style={styles.tabContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>USD Cards</Text>
                    <TouchableOpacity
                      onPress={() => setShowCardModal(true)}
                      style={[styles.createButton, { backgroundColor: theme.primary }]}
                    >
                      <Ionicons name="add" size={20} color="white" />
                      <Text style={styles.createButtonText}>Create Card</Text>
                    </TouchableOpacity>
                  </View>

                  {walletData?.cards && walletData.cards.length > 0 ? (
                    walletData.cards.map((card) => (
                      <View
                        key={card.id}
                        style={[styles.cardItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={[styles.cardBrand, { color: theme.text }]}>
                            {card.brand} *** {card.last_four}
                          </Text>
                          <Text style={[styles.cardBalance, { color: theme.primary }]}>
                            ${card.balance?.toFixed(2) || '0.00'}
                          </Text>
                        </View>
                        <Text style={[styles.cardType, { color: theme.textSecondary }]}>
                          {card.card_type} • {card.currency}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="card" size={48} color={theme.textSecondary} />
                      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Cards Yet</Text>
                      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Create your first virtual USD card to start making international payments.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <View style={styles.tabContent}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction History</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Transactions' as never)}>
                      <Text style={[styles.addButton, { color: theme.primary }]}>View All</Text>
                    </TouchableOpacity>
                  </View>

                  {walletData?.transactions && walletData.transactions.length > 0 ? (
                    walletData.transactions.slice(0, 10).map((transaction: any) => (
                      <View
                        key={transaction.id}
                        style={[
                          styles.transactionItem,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <View style={styles.transactionIcon}>
                          <Ionicons
                            name={
                              transaction.transaction_type === 'credit' ? 'arrow-down' :
                                transaction.transaction_type === 'debit' ? 'arrow-up' :
                                  transaction.service_type === 'data' ? 'wifi' :
                                    transaction.service_type === 'airtime' ? 'call' :
                                      transaction.service_type === 'cable' ? 'tv' :
                                        transaction.service_type === 'bank' ? 'business' :
                                          transaction.service_type === 'card' ? 'card' :
                                            transaction.service_type === 'wallet_funding' ? 'wallet' :
                                              transaction.service_type === 'payout' ? 'wallet' : 'swap-horizontal'
                            }
                            size={20}
                            color={
                              transaction.transaction_type === 'credit' ? '#10B981' :
                                transaction.transaction_type === 'debit' ? '#EF4444' :
                                  transaction.service_type === 'data' ? '#10B981' :
                                    transaction.service_type === 'airtime' ? '#25bace' :
                                      transaction.service_type === 'cable' ? '#e6d92f' :
                                        transaction.service_type === 'bank' ? '#EF4444' :
                                          transaction.service_type === 'card' ? '#EF4444' :
                                            transaction.service_type === 'wallet_funding' ? '#dbc9c9ff' :
                                              transaction.service_type === 'payout' ? '#EF4444' : theme.primary
                            }
                          />
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={[styles.transactionType, { color: theme.text }]}>
                            {transaction.service_type || transaction.transaction_type}
                          </Text>
                          <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.transactionAmount}>
                          <Text style={[
                            styles.transactionAmountText,
                            {
                              color: transaction.transaction_type === 'credit' ? '#10B981' :
                                transaction.transaction_type === 'debit' ? '#EF4444' : theme.text
                            },
                          ]}>
                            {transaction.transaction_type === 'credit' ? '+' : transaction.transaction_type === 'debit' ? '-' : ''}
                            ₦{transaction.amount?.toLocaleString()}
                          </Text>
                          <Text style={[styles.transactionStatus, {
                            color: transaction.status === 'completed' ? '#10B981' :
                              transaction.status === 'successful' ? '#24e082ff' :
                                transaction.status === 'pending' ? '#F59E0B' :
                                  transaction.status === "failed" ? "#ef4444" : '#EF4444'
                          }]}>
                            {transaction.status}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="receipt" size={48} color={theme.textSecondary} />
                      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions Yet</Text>
                      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        Your transaction history will appear here once you start using your wallet.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={{ height: 100 }} />
            </>
          </ScrollView>
        )}
      </LinearGradient>

      {/* Card Creation Modal */}
      <Modal
        visible={showCardModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Card</Text>
              <TouchableOpacity onPress={() => setShowCardModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: theme.text }]}>Card Brand</Text>
              <TouchableOpacity
                onPress={() => setShowBrandDropdown(!showBrandDropdown)}
                style={[styles.dropdown, { borderColor: theme.border }]}
              >
                <Text style={[styles.dropdownText, { color: theme.text }]}>{cardFormData.brand}</Text>
                <Ionicons name={showBrandDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              {showBrandDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setCardFormData({ ...cardFormData, brand: 'VISA' });
                      setShowBrandDropdown(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>VISA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setCardFormData({ ...cardFormData, brand: 'MASTERCARD' });
                      setShowBrandDropdown(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>Mastercard</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.modalLabel, { color: theme.text }]}>Card Type</Text>
              <TouchableOpacity
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                style={[styles.dropdown, { borderColor: theme.border }]}
              >
                <Text style={[styles.dropdownText, { color: theme.text }]}>{cardFormData.type}</Text>
                <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              {showTypeDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setCardFormData({ ...cardFormData, type: 'virtual' });
                      setShowTypeDropdown(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>Virtual</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.modalLabel, { color: theme.text }]}>Currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                style={[styles.dropdown, { borderColor: theme.border }]}
              >
                <Text style={[styles.dropdownText, { color: theme.text }]}>{cardFormData.currency}</Text>
                <Ionicons name={showCurrencyDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              {showCurrencyDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setCardFormData({ ...cardFormData, currency: 'USD' });
                      setShowCurrencyDropdown(false);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>USD</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.modalLabel, { color: theme.text }]}>Initial Funding</Text>
              <TextInput
                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                value={cardFormData.amount}
                onChangeText={(value: string) => setCardFormData({ ...cardFormData, amount: value })}
                placeholder="1.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />

              <Text style={[styles.modalNote, { color: theme.textSecondary }]}>
                Minimum: 1 {cardFormData.currency} (from your wallet)
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setShowCardModal(false)}
                style={[styles.modalButton, styles.cancelButton]}
                disabled={creatingCard}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCard}
                style={[styles.modalButton, styles.primaryButton, { backgroundColor: theme.primary }]}
                disabled={creatingCard || !cardFormData.amount || parseFloat(cardFormData.amount) < 1}
              >
                {creatingCard ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Card</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payout Modal */}
      <Modal
        visible={showPayoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Withdraw to Bank</Text>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {payoutStep === 'bank' && (
                <>
                  <Text style={[styles.modalLabel, { color: theme.text }]}>Select Bank</Text>
                  <TouchableOpacity
                    onPress={() => {
                      fetchBanks();
                      setShowBankList(true);
                    }}
                    style={[styles.bankSelector, { borderColor: theme.border }]}
                  >
                    <Text style={[styles.bankSelectorText, { color: theme.text }]}>
                      {selectedBank ? selectedBank.name : 'Choose a bank...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </>
              )}

              {payoutStep === 'account' && (
                <>
                  <Text style={[styles.modalLabel, { color: theme.text }]}>Account Number</Text>
                  <TextInput
                    style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Enter account number"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TouchableOpacity
                    onPress={verifyAccount}
                    style={[styles.verifyButton, { backgroundColor: theme.primary }]}
                    disabled={processingPayout}
                  >
                    {processingPayout ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Verify Account</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {payoutStep === 'amount' && (
                <>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountName, { color: theme.text }]}>
                      {accountName || 'Account Name Not Available'}
                    </Text>
                    <Text style={[styles.accountNumber, { color: theme.textSecondary }]}>
                      {accountNumber} • {selectedBank?.name}
                    </Text>
                  </View>

                  <Text style={[styles.modalLabel, { color: theme.text }]}>Amount (NGN)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                    value={payoutAmount}
                    onChangeText={setPayoutAmount}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />

                  <Text style={[styles.modalLabel, { color: theme.text }]}>Narration</Text>
                  <TextInput
                    style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                    value={narration}
                    onChangeText={setNarration}
                    placeholder="Payment description"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <TouchableOpacity
                    onPress={calculateFee}
                    style={[styles.verifyButton, { backgroundColor: theme.primary }]}
                    disabled={processingPayout}
                  >
                    {processingPayout ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.verifyButtonText}>Calculate Fee</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {payoutStep === 'confirm' && feeInfo && (
                <>
                  <View style={styles.confirmationCard}>
                    <Text style={[styles.confirmLabel, { color: theme.text }]}>Transfer Details</Text>
                    <View style={styles.confirmRow}>
                      <Text style={[styles.confirmText, { color: theme.textSecondary }]}>Amount:</Text>
                      <Text style={[styles.confirmValue, { color: theme.text }]}>₦{parseFloat(payoutAmount).toLocaleString()}</Text>
                    </View>
                    <View style={styles.confirmRow}>
                      <Text style={[styles.confirmText, { color: theme.textSecondary }]}>Fee:</Text>
                      <Text style={[styles.confirmValue, { color: theme.text }]}>₦{feeInfo.fee.toLocaleString()}</Text>
                    </View>
                    <View style={styles.confirmRow}>
                      <Text style={[styles.confirmText, { color: theme.textSecondary }]}>Total:</Text>
                      <Text style={[styles.confirmValue, { color: theme.primary, fontWeight: 'bold' }]}>₦{feeInfo.total.toLocaleString()}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={initiatePayout}
                    style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                    disabled={processingPayout}
                  >
                    {processingPayout ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Confirm Transfer</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bank List Modal */}
      <Modal
        visible={showBankList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankList(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!banks || banks.length === 0 ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Loading Banks...</Text>
                </View>
              ) : (
                banks.map((bank, index) => (
                  <TouchableOpacity
                    key={`${bank.code}-${bank.name}-${index}`}
                    onPress={() => {
                      setSelectedBank(bank);
                      setShowBankList(false);
                      setPayoutStep('account');
                    }}
                    style={[styles.bankItem, { borderColor: theme.border }]}
                  >
                    <Text style={[styles.bankItemText, { color: theme.text }]}>{bank.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tabScroll: {
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flex: 1,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  balance: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  currency: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  lockedBalance: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bankName: {
    fontSize: 14,
    marginBottom: 12,
  },
  accountDetail: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    padding: 4,
  },
  createdDate: {
    fontSize: 12,
    marginTop: 8,
  },
  cardItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardBalance: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardType: {
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  // Quick Actions
  quickActions: {
    marginTop: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Create Card Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  modalNote: {
    fontSize: 12,
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  picker: {
    height: 50,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Dropdown Styles
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  // Payout Modal Styles
  bankSelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankSelectorText: {
    fontSize: 16,
  },
  verifyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  accountInfo: {
    backgroundColor: '#248B0B',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  confirmationCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Bank List Modal
  bankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  bankItemText: {
    fontSize: 16,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  kycBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kycBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kycIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kycTextContainer: {
    flex: 1,
  },
  kycTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  kycDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default WalletScreen;
