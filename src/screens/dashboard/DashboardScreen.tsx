// src/screens/dashboard/DashboardScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
import AnnouncementsBanner from '../../components/AnnouncementsBanner';
import CustomAlert from '../../components/CustomAlert';
import SubscriptionReminderBanner from '../../components/SubscriptionReminderBanner';
import { SkeletonLoader } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;
const vaCardWidth = width * 0.75;
const DASHBOARD_PROMO_KEY = 'matrix_dashboard_promo_seen_at';
const DASHBOARD_PROMO_COOLDOWN = 1000 * 60 * 60 * 24 * 3;

interface VirtualAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  status: string;
  created_at: string;
}

interface DashboardData {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
    kyc_verified: boolean;
    wallet_balance: number;
    card_balance: number;
    locked_balance: number;
  };
  wallet: {
    balance: number;
    locked_balance: number;
    total_funded: number;
    total_spent: number;
    currency: string;
  };
  virtualAccounts: VirtualAccount[];
  recentTransactions: Array<{
    id: string;
    transaction_reference: string;
    transaction_type: string;
    service_type: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    recipient?: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
  }>;
  unreadNotificationsCount: number;
}

const DashboardScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { session } = useSession();
  const navigation = useNavigation<any>();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [copyingAccount, setCopyingAccount] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
  const [promo, setPromo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    cta: string;
    route?: 'Rewards' | 'Referrals';
    icon: 'gift' | 'people';
  }>({
    visible: false,
    title: '',
    message: '',
    cta: '',
    icon: 'gift',
  });
  const promoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [clipboardModalVisible, setClipboardModalVisible] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState('');
  const appState = useRef(AppState.currentState);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch user profile first as it might be critical
      const profileResponse = await apiClient.get('/user/profile');
      if (!profileResponse.success) {
        throw new Error('Failed to fetch profile');
      }

      // Fetch remaining data in parallel for better performance
      const [transactionsRes, notificationsRes, unreadCountRes, accountsRes] = await Promise.all([
        apiClient.get('/transactions/all?limit=5'),
        apiClient.get('/notifications'),
        apiClient.get('/notifications/unread-count'),
        apiClient.get('/payscribe/virtual-accounts')
      ]);

      const user = (profileResponse.data as any).user;
      const wallet = (profileResponse.data as any).wallet;

      // Extract virtual accounts safely
      let accounts: VirtualAccount[] = [];
      const accountsData = accountsRes.data as any;
      if (Array.isArray(accountsData)) {
        accounts = accountsData;
      } else if (accountsData?.data && Array.isArray(accountsData.data)) {
        accounts = accountsData.data;
      }

      setDashboardData({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          phone: user.mobile || user.phone || '',
          avatar_url: user.photo_url || user.avatar_url,
          kyc_verified: user.kyc_verified,
          wallet_balance: parseFloat(user.wallet_balance || 0),
          card_balance: parseFloat(user.card_balance || 0),
          locked_balance: parseFloat(user.locked_balance || 0),
        },
        wallet: {
          balance: parseFloat(wallet?.balance || 0),
          locked_balance: parseFloat(wallet?.locked_balance || 0),
          total_funded: parseFloat(wallet?.total_funded || 0),
          total_spent: parseFloat(wallet?.total_spent || 0),
          currency: wallet?.currency || 'NGN',
        },
        virtualAccounts: accounts,
        recentTransactions: transactionsRes.success
          ? (transactionsRes.data as any).data.transactions.slice(0, 5)
          : [],
        notifications: notificationsRes.success
          ? (notificationsRes.data as any).notifications.slice(0, 3)
          : [],
        unreadNotificationsCount: unreadCountRes.success
          ? (unreadCountRes.data as any).count
          : 0,
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const kycNavigated = useRef(false);

  useEffect(() => {
    if (session.user?.kyc_required && session.user?.kyc_status === 'not_started' && !kycNavigated.current) {
      console.log('[Dashboard] KYC required. Navigating...');
      kycNavigated.current = true;
      navigation.navigate('KYC', { user: session.user });
      return;
    }
    fetchDashboardData();
  }, [session.user]);

  useEffect(() => {
    const maybeShowPromo = async () => {
      try {
        const lastSeenRaw = await AsyncStorage.getItem(DASHBOARD_PROMO_KEY);
        const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : 0;
        if (lastSeen && Date.now() - lastSeen < DASHBOARD_PROMO_COOLDOWN) return;
        if (Math.random() > 0.4) return;

        if (promoTimerRef.current) {
          clearTimeout(promoTimerRef.current);
        }

        promoTimerRef.current = setTimeout(async () => {
          const isSpinPromo = Math.random() < 0.5;
          setPromo({
            visible: true,
            title: isSpinPromo ? 'Spin and Earn' : 'Invite and Grow',
            message: isSpinPromo
              ? 'Your spin wheel can unlock surprise rewards. Tap Rewards to check your daily spin and see what you can win today.'
              : 'Your referral code can help you grow your balance through active invites. Tap Referrals to share your code and follow your progress.',
            cta: isSpinPromo ? 'Open Rewards' : 'Open Referrals',
            route: isSpinPromo ? 'Rewards' : 'Referrals',
            icon: isSpinPromo ? 'gift' : 'people',
          });
          await AsyncStorage.setItem(DASHBOARD_PROMO_KEY, String(Date.now()));
        }, 4500);
      } catch {
        // silent
      }
    };

    maybeShowPromo();
    return () => {
      if (promoTimerRef.current) {
        clearTimeout(promoTimerRef.current);
      }
    };
  }, []);

  const checkClipboardForPhone = async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (hasString) {
        const content = await Clipboard.getStringAsync();
        const cleanNumber = content.replace(/[\s-()]/g, '');
        const phoneRegex = /^(?:\+234|234|0)[789][01]\d{8}$/;

        if (phoneRegex.test(cleanNumber)) {
          const lastPrompted = await AsyncStorage.getItem('last_prompted_clipboard_phone');
          if (lastPrompted !== cleanNumber) {
            setCopiedPhone(cleanNumber);
            setClipboardModalVisible(true);
          }
        }
      }
    } catch (e) {
      console.log('Clipboard check error:', e);
    }
  };

  useEffect(() => {
    checkClipboardForPhone();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkClipboardForPhone();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleClipboardAction = async (type: 'airtime' | 'data' | 'ignore') => {
    setClipboardModalVisible(false);
    if (copiedPhone) {
      await AsyncStorage.setItem('last_prompted_clipboard_phone', copiedPhone);
    }

    if (type === 'airtime') {
      navigation.navigate('Airtime', { prefilledNumber: copiedPhone });
    } else if (type === 'data') {
      navigation.navigate('Data', { prefilledNumber: copiedPhone });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      setCopyingAccount(label);
      setTimeout(() => setCopyingAccount(null), 2000);
      setAlert({
        visible: true,
        title: 'Copied',
        message: `${label} copied to clipboard!`,
        type: 'success',
      });
    } catch (error) {
      setAlert({
        visible: true,
        title: 'Error',
        message: 'Failed to copy to clipboard',
        type: 'error',
      });
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

  const getTransactionIcon = (type: string, serviceType?: string) => {
    switch (serviceType?.toLowerCase()) {
      case 'airtime': return 'phone-portrait';
      case 'data': return 'wifi';
      case 'electricity': return 'flash';
      case 'cable': return 'tv';
      case 'transfer': return 'swap-horizontal';
      default: return type === 'credit' ? 'add-circle' : 'remove-circle';
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' || type === 'wallet_funding' ? '#10B981' : '#EF4444';
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase();
  };

  const quickActions = [
    { id: 'fund', title: 'Fund', icon: 'wallet', color: theme.primary, onPress: () => navigation.navigate('FundWallet') },
    { id: 'send', title: 'Send', icon: 'swap-horizontal', color: '#10B981', onPress: () => navigation.navigate('Wallet') },
    { id: 'topup', title: 'Top Up', icon: 'phone-portrait', color: '#3B82F6', onPress: () => navigation.navigate('Airtime') },
    { id: 'bills', title: 'Bills', icon: 'flash', color: '#F59E0B', onPress: () => navigation.navigate('Electricity') },
  ];

  const services = [
    { id: 'airtime', name: 'Airtime', icon: 'call' as keyof typeof Ionicons.glyphMap },
    { id: 'data', name: 'Data', icon: 'wifi' as keyof typeof Ionicons.glyphMap },
    { id: 'electricity', name: 'Electricity', icon: 'flash' as keyof typeof Ionicons.glyphMap },
    { id: 'cable', name: 'Cable TV', icon: 'tv-outline' as keyof typeof Ionicons.glyphMap },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header Profile Section */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerProfileRow}>
            <View style={styles.avatarContainer}>
              {dashboardData?.user?.avatar_url ? (
                <Image source={{ uri: dashboardData.user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.background + '40' }]}>
                  <Text style={styles.avatarInitials}>
                    {getInitials(dashboardData?.user?.full_name || session.user?.full_name || 'User')}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>
                Hi, {dashboardData?.user?.full_name?.split(' ')[0] || session.user?.full_name?.split(' ')[0] || 'User'} 👋
              </Text>
              <Text style={styles.subGreeting}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Rewards')}>
              <Ionicons name="gift-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={26} color="white" />
              {dashboardData && dashboardData.unreadNotificationsCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {dashboardData.unreadNotificationsCount > 99 ? '99+' : dashboardData.unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <ThemeToggle />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {isLoading ? (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={[styles.bannerSkeleton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <SkeletonLoader width="45%" height={14} marginBottom={12} />
              <SkeletonLoader width="75%" height={26} marginBottom={10} />
              <SkeletonLoader width="60%" height={14} />
            </View>

            <View style={[styles.quickActionsSkeleton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.quickActionSkeletonItem}>
                  <SkeletonLoader width={48} height={48} borderRadius={24} marginBottom={10} />
                  <SkeletonLoader width="70%" height={12} />
                </View>
              ))}
            </View>

            <View style={styles.sectionSkeletonBlock}>
              <SkeletonLoader width="28%" height={16} marginBottom={12} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vaScrollContainer}>
                {Array.from({ length: 2 }).map((_, index) => (
                  <View key={index} style={[styles.vaSkeletonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SkeletonLoader width="55%" height={12} marginBottom={18} />
                    <SkeletonLoader width="75%" height={20} marginBottom={10} />
                    <SkeletonLoader width="45%" height={12} />
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionSkeletonBlock}>
              <SkeletonLoader width="20%" height={16} marginBottom={12} />
              <View style={styles.servicesSkeletonGrid}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <View key={index} style={[styles.serviceSkeletonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <SkeletonLoader width={36} height={36} borderRadius={18} marginBottom={10} />
                    <SkeletonLoader width="70%" height={12} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionSkeletonBlock}>
              <SkeletonLoader width="34%" height={16} marginBottom={12} />
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={[styles.dashboardTransactionSkeletonRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <SkeletonLoader width={44} height={44} borderRadius={22} />
                  <View style={{ flex: 1 }}>
                    <SkeletonLoader width="60%" height={14} marginBottom={8} />
                    <SkeletonLoader width="38%" height={12} />
                  </View>
                  <View style={{ alignItems: 'flex-end', width: 84 }}>
                    <SkeletonLoader width="78%" height={14} marginBottom={8} />
                    <SkeletonLoader width="55%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchDashboardData}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
            <AnnouncementsBanner />
            <SubscriptionReminderBanner />

            {/* Main Balance Card */}
            <LinearGradient
              colors={[theme.primary, theme.primary + 'E6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={styles.eyeIconWrapper}>
                  <Ionicons name={showBalance ? 'eye-outline' : 'eye-off-outline'} size={20} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>
                {showBalance ? formatCurrency(dashboardData?.wallet?.balance || 0) : '****'}
              </Text>

              <View style={styles.balanceDetailsDivider} />

              <View style={styles.balanceDetails}>
                <View>
                  <Text style={styles.balanceDetailLabel}>Available</Text>
                  <Text style={styles.balanceDetailValue}>
                    {formatCurrency((dashboardData?.wallet?.balance || 0) - (dashboardData?.wallet?.locked_balance || 0))}
                  </Text>
                </View>
                {(dashboardData?.wallet?.locked_balance || 0) > 0 && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.balanceDetailLabel}>Locked Funds</Text>
                    <Text style={styles.balanceDetailValue}>
                      {formatCurrency(dashboardData?.wallet?.locked_balance || 0)}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Unified Quick Actions Surface */}
            <View style={[styles.unifiedActionsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {quickActions.map((action) => (
                <TouchableOpacity key={action.id} style={styles.unifiedActionBtn} onPress={action.onPress}>
                  <View style={[styles.actionIconWrapper, { backgroundColor: action.color + '15' }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={[styles.unifiedActionLabel, { color: theme.text }]}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Virtual Accounts Horizontal Scroll */}
            {dashboardData?.virtualAccounts && dashboardData.virtualAccounts.length > 0 && (
              <View style={styles.vaSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Receiving Accounts</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vaScrollContainer}
                  snapToInterval={vaCardWidth + 16}
                  decelerationRate="fast"
                >
                  {dashboardData.virtualAccounts.map((account) => (
                    <View key={account.id} style={[styles.vaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={styles.vaCardTop}>
                        <Text style={[styles.vaBankName, { color: theme.textSecondary }]}>{account.bank_name}</Text>
                        <View style={[styles.vaStatusBadge, { backgroundColor: account.status === 'active' ? '#10B98120' : '#F59E0B20' }]}>
                          <Text style={[styles.vaStatusText, { color: account.status === 'active' ? '#10B981' : '#F59E0B' }]}>
                            {account.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.vaNumberRow}>
                        <Text style={[styles.vaAccountNumber, { color: theme.text }]}>{account.account_number}</Text>
                        <TouchableOpacity
                          style={[styles.vaCopyBtn, { backgroundColor: theme.primary + '15' }]}
                          onPress={() => copyToClipboard(account.account_number, 'Account Number')}
                        >
                          <Ionicons
                            name={copyingAccount === 'Account Number' ? "checkmark" : "copy-outline"}
                            size={18}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.vaAccountName, { color: theme.textSecondary }]}>{account.account_name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Services Grid */}
            <View style={styles.servicesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Services</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Services')}>
                  <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.servicesGrid}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('Services')}
                  >
                    <View style={[styles.serviceIconContainer, { backgroundColor: theme.primary + '10' }]}>
                      <Ionicons name={service.icon} size={26} color={theme.primary} />
                    </View>
                    <Text style={[styles.serviceName, { color: theme.text }]}>{service.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Transactions */}
            {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
              <View style={styles.transactionsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                    <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
                  </TouchableOpacity>
                </View>

                {dashboardData.recentTransactions.map((tx) => (
                  <View key={tx.id} style={[styles.transactionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.txIconContainer, { backgroundColor: getTransactionColor(tx.transaction_type) + '15' }]}>
                      <Ionicons
                        name={getTransactionIcon(tx.transaction_type, tx.service_type)}
                        size={20}
                        color={getTransactionColor(tx.transaction_type)}
                      />
                    </View>

                    <View style={styles.txDetails}>
                      <Text style={[styles.txDescription, { color: theme.text }]} numberOfLines={1}>
                        {tx.service_type || tx.transaction_type}
                      </Text>
                      <Text style={[styles.txDate, { color: theme.textSecondary }]}>
                        {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.txAmount, { color: getTransactionColor(tx.transaction_type) }]}>
                        {tx.transaction_type === 'credit' || tx.transaction_type === 'wallet_funding' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </Text>
                      <Text style={[styles.txStatus, { color: theme.textSecondary }]}>{tx.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Notifications */}
            {dashboardData?.notifications && dashboardData.notifications.length > 0 && (
              <View style={styles.notificationsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Notifications</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                    <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
                  </TouchableOpacity>
                </View>

                {dashboardData.notifications.map((notification) => (
                  <View key={notification.id} style={[styles.notificationItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.notificationContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={[styles.notificationTitle, { color: theme.text }]} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        {!notification.is_read && (
                          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                        )}
                      </View>
                      <Text style={[styles.notificationMessage, { color: theme.textSecondary }]} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationDate, { color: theme.textSecondary }]}>
                        {new Date(notification.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={promo.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPromo((current) => ({ ...current, visible: false }))}
      >
        <View style={styles.promoModalBackdrop}>
          <View style={[styles.promoModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.promoIconWrap, { backgroundColor: `${theme.primary}15` }]}>
              <Ionicons
                name={promo.icon === 'gift' ? 'gift-outline' : 'people-outline'}
                size={28}
                color={theme.primary}
              />
            </View>
            <Text style={[styles.promoTitle, { color: theme.text }]}>{promo.title}</Text>
            <Text style={[styles.promoMessage, { color: theme.textSecondary }]}>{promo.message}</Text>
            <View style={styles.promoActions}>
              <TouchableOpacity
                style={[styles.promoSecondaryBtn, { borderColor: theme.border }]}
                activeOpacity={0.85}
                onPress={() => setPromo((current) => ({ ...current, visible: false }))}
              >
                <Text style={[styles.promoSecondaryText, { color: theme.textSecondary }]}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promoPrimaryBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.9}
                onPress={() => {
                  const nextRoute = promo.route;
                  setPromo((current) => ({ ...current, visible: false }));
                  if (nextRoute) navigation.navigate(nextRoute);
                }}
              >
                <Text style={styles.promoPrimaryText}>{promo.cta}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
      />

      <Modal
        visible={clipboardModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => handleClipboardAction('ignore')}
      >
        <View style={styles.promoModalBackdrop}>
          <View style={[styles.promoModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.promoIconWrap, { backgroundColor: `${theme.primary}15` }]}>
              <Ionicons name="call-outline" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.promoTitle, { color: theme.text }]}>Phone Number Detected</Text>
            <Text style={[styles.promoMessage, { color: theme.textSecondary }]}>
              We noticed you copied a phone number: {copiedPhone}. Would you like to buy airtime or data for this number?
            </Text>

            <View style={styles.clipboardModalButtonsContainer}>
              <TouchableOpacity
                style={[styles.clipboardModalPrimaryBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
                onPress={() => handleClipboardAction('airtime')}
              >
                <Ionicons name="phone-portrait-outline" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.clipboardModalPrimaryBtnText}>Buy Airtime</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.clipboardModalPrimaryBtn, { backgroundColor: '#00D084' }]}
                activeOpacity={0.8}
                onPress={() => handleClipboardAction('data')}
              >
                <Ionicons name="wifi-outline" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.clipboardModalPrimaryBtnText}>Buy Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.clipboardModalSecondaryBtn, { borderColor: theme.textSecondary, backgroundColor: theme.background }]}
                activeOpacity={0.7}
                onPress={() => handleClipboardAction('ignore')}
              >
                <Text style={[styles.clipboardModalSecondaryBtnText, { color: theme.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 54,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitials: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  loadingSkeletonWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingHero: {
    borderRadius: 24,
    backgroundColor: 'rgba(148,163,184,0.08)',
    padding: 20,
    marginBottom: 20,
  },
  quickActionSkeletonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickActionSkeletonCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(148,163,184,0.08)',
    padding: 14,
    alignItems: 'center',
  },
  sectionSkeleton: {
    marginBottom: 24,
  },
  cardSkeletonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  cardSkeleton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(148,163,184,0.08)',
    padding: 16,
  },
  dashboardTransactionSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  transactionSkeletonDetails: {
    flex: 1,
  },
  transactionSkeletonAmount: {
    width: 88,
    alignItems: 'flex-end',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  bannerSkeleton: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  quickActionsSkeleton: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickActionSkeletonItem: {
    flex: 1,
    alignItems: 'center',
  },
  sectionSkeletonBlock: {
    marginBottom: 22,
  },
  vaSkeletonCard: {
    width: vaCardWidth,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginRight: 16,
  },
  servicesSkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceSkeletonCard: {
    width: cardWidth,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 80,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: -4,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eyeIconWrapper: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -1,
  },
  balanceDetailsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceDetailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  balanceDetailValue: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
  },
  unifiedActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  unifiedActionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  unifiedActionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  vaSection: {
    marginBottom: 24,
  },
  vaScrollContainer: {
    paddingRight: 16,
    gap: 12,
  },
  vaCard: {
    width: vaCardWidth,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vaBankName: {
    fontSize: 13,
    fontWeight: '500',
  },
  vaStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vaStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vaNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vaAccountNumber: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  vaCopyBtn: {
    padding: 8,
    borderRadius: 8,
  },
  vaAccountName: {
    fontSize: 12,
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    width: cardWidth,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  txIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txDetails: {
    flex: 1,
    marginRight: 8,
  },
  txDescription: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  txStatus: {
    fontSize: 11,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  notificationsSection: {
    marginBottom: 20,
  },
  notificationItem: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  promoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  promoModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  promoIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  promoMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  promoActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  promoSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  promoPrimaryBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
  },
  clipboardModalButtonsContainer: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  clipboardModalPrimaryBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  clipboardModalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  clipboardModalSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboardModalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DashboardScreen;