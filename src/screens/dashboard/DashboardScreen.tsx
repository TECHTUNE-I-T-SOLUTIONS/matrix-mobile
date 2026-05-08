// src/screens/dashboard/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
import { SkeletonCard } from '../../components/SkeletonLoader';
import AnnouncementsBanner from '../../components/AnnouncementsBanner';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

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

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch user profile
      const profileResponse = await apiClient.get('/user/profile');
      if (!profileResponse.success) {
        throw new Error('Failed to fetch profile');
      }

      // Fetch recent transactions
      const transactionsResponse = await apiClient.post('/transactions/all', {
        limit: 5,
      });

      // Fetch notifications
      const notificationsResponse = await apiClient.get('/notifications');
      const unreadCountResponse = await apiClient.get('/notifications/unread-count');

      const user = (profileResponse.data as any).user;
      const wallet = (profileResponse.data as any).wallet;

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
        recentTransactions: transactionsResponse.success
          ? (transactionsResponse.data as any).data.transactions.slice(0, 5)
          : [],
        notifications: notificationsResponse.success
          ? (notificationsResponse.data as any).notifications.slice(0, 3)
          : [],
        unreadNotificationsCount: unreadCountResponse.success
          ? (unreadCountResponse.data as any).count
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
      case 'airtime':
        return 'phone-portrait';
      case 'data':
        return 'wifi';
      case 'electricity':
        return 'flash';
      case 'cable':
        return 'tv';
      case 'transfer':
        return 'swap-horizontal';
      default:
        return type === 'credit' ? 'add-circle' : 'remove-circle';
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? '#047603' : type === 'wallet_funding' ? '#047603' : type === 'debit' ? '#ef4444' : '#ef4444';
  };

  const quickActions = [
    {
      id: 'fund',
      title: 'Fund Wallet',
      icon: 'wallet',
      color: theme.primary,
      onPress: () => navigation.navigate('FundWallet'),
    },
    {
      id: 'send',
      title: 'Send Money',
      icon: 'swap-horizontal',
      color: '#047603',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      id: 'topup',
      title: 'Top Up',
      icon: 'phone-portrait',
      color: '#047603',
      onPress: () => navigation.navigate('Airtime'),
    },
    {
      id: 'bills',
      title: 'Pay Bills',
      icon: 'flash',
      color: '#047603',
      onPress: () => navigation.navigate('Electricity'),
    },
  ];

  const services = [
    { id: 'airtime', name: 'Airtime', icon: 'call' as keyof typeof Ionicons.glyphMap },
    { id: 'data', name: 'Data', icon: 'wifi' as keyof typeof Ionicons.glyphMap },
    { id: 'electricity', name: 'Electricity', icon: 'flash' as keyof typeof Ionicons.glyphMap },
    { id: 'cable', name: 'Cable TV', icon: 'tv-outline' as keyof typeof Ionicons.glyphMap },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.primary, paddingBottom: 20 },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Welcome back, {session.user?.full_name?.split(' ')[0] || 'User'}!
            </Text>
            <Text style={styles.subGreeting}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={24} color="white" />
              {dashboardData && dashboardData.unreadNotificationsCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {dashboardData.unreadNotificationsCount > 99
                      ? '99+'
                      : dashboardData.unreadNotificationsCount}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={fetchDashboardData}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {/* Balance Card */}
            {/* Announcements banner */}
            <AnnouncementsBanner />

            <LinearGradient
              colors={[theme.primary, theme.primary + 'DD']}
              style={styles.balanceCard}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                  <Ionicons
                    name={showBalance ? 'eye' : 'eye-off'}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>
                {showBalance
                  ? formatCurrency(dashboardData?.wallet?.balance || 0)
                  : '****'}
              </Text>
              <View style={styles.balanceDetails}>
                <Text style={styles.balanceDetail}>
                  Available: {formatCurrency((dashboardData?.wallet?.balance || 0) - (dashboardData?.wallet?.locked_balance || 0))}
                </Text>
                {(dashboardData?.wallet?.locked_balance || 0) > 0 && (
                  <Text style={styles.balanceDetail}>
                    Locked: {formatCurrency(dashboardData?.wallet?.locked_balance || 0)}
                  </Text>
                )}
              </View>
            </LinearGradient>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionButton,
                    { backgroundColor: action.color },
                  ]}
                  onPress={action.onPress}
                >
                  <Ionicons name={action.icon as any} size={24} color="white" />
                  <Text style={styles.actionLabel}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Services Grid */}
            <View style={styles.servicesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Services
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Services')}>
                  <Text style={[styles.viewAllText, { color: theme.primary }]}>
                    View All
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.servicesGrid}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => navigation.navigate('Services')}
                  >
                    <Ionicons name={service.icon} size={32} color={theme.primary} style={styles.serviceIcon} />
                    <Text style={[styles.serviceName, { color: theme.text }]}>
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Transactions */}
            {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
              <View style={styles.transactionsSection}>
                <View style={styles.transactionsHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Recent Transactions
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                    <Text style={[styles.viewAllText, { color: theme.primary }]}>
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                {dashboardData.recentTransactions.map((tx) => (
                  <View
                    key={tx.id}
                    style={[
                      styles.transactionItem,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.txIconContainer,
                        { backgroundColor: getTransactionColor(tx.transaction_type) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getTransactionIcon(tx.transaction_type, tx.service_type)}
                        size={20}
                        color={getTransactionColor(tx.transaction_type)}
                      />
                    </View>

                    <View style={styles.txDetails}>
                      <Text style={[styles.txDescription, { color: theme.text }]}>
                        {tx.service_type || tx.transaction_type}
                      </Text>
                      <Text
                        style={[
                          styles.txDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {new Date(tx.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: getTransactionColor(tx.transaction_type),
                        },
                      ]}
                    >
                      {tx.transaction_type === 'credit' ? '+' : tx.transaction_type === 'wallet_funding' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Notifications */}
            {dashboardData?.notifications && dashboardData.notifications.length > 0 && (
              <View style={styles.notificationsSection}>
                <View style={styles.transactionsHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Recent Notifications
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                    <Text style={[styles.viewAllText, { color: theme.primary }]}>
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                {dashboardData.notifications.map((notification) => (
                  <View
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: theme.text }]}>
                        {notification.title}
                      </Text>
                      <Text
                        style={[
                          styles.notificationMessage,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {notification.message}
                      </Text>
                      <Text
                        style={[
                          styles.notificationDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {new Date(notification.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {!notification.is_read && (
                      <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginTop: -6,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    marginLeft: -16,
    marginRight: -16,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  servicesSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: cardWidth,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionsSection: {
    marginBottom: 28,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationsSection: {
    marginBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationDate: {
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginLeft: 8,
  },
});

export default DashboardScreen;

