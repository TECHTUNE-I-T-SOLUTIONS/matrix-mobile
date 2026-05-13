// src/screens/dashboard/RewardsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useRewards } from '../../hooks/useRewards';
import { useWalletBalance } from '../../contexts/WalletBalanceContext';
import SpinWheelModal from './SpinWheelModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import { SkeletonLoader } from '../../components/SkeletonLoader';

type RewardTx = {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
};

const RewardsScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { walletBalance: walletState, refreshBalance, updateBalance } = useWalletBalance();
  const { totalReward, transactions, loading, spinReward, fetchRewards, canSpinNow, nextSpinAt } = useRewards();
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [nextSpinCountdown, setNextSpinCountdown] = useState('');
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [refreshing, setRefreshing] = useState(false);
  const [optimisticBalance, setOptimisticBalance] = useState<number | null>(null);
  const [optimisticTransactions, setOptimisticTransactions] = useState<RewardTx[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchRewards();
      refreshBalance();
    }, [fetchRewards, refreshBalance])
  );

  React.useEffect(() => {
    if (!canSpinNow && nextSpinAt) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const nextSpin = new Date(nextSpinAt).getTime();
        const diff = nextSpin - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setNextSpinCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setNextSpinCountdown('');
          fetchRewards();
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [canSpinNow, nextSpinAt, fetchRewards]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRewards(), refreshBalance()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRewards, refreshBalance]);

  const handleSpinComplete = async (amount: number): Promise<number | void> => {
    setOptimisticBalance(Number(walletState.balance || 0) + amount);
    setOptimisticTransactions((prev) => [
      {
        id: `optimistic-${Date.now()}`,
        type: 'spin',
        amount,
        description: 'Daily spin wheel reward',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    const result = await spinReward(amount);
    if (result && typeof result === 'object') {
      updateBalance(result.newBalance);
      await fetchRewards();
      await refreshBalance();
    }

    setOptimisticBalance(null);
    setOptimisticTransactions([]);
    return result && typeof result === 'object' ? result.amount : 0;
  };

  const handleSpinCardPress = () => {
    if (!canSpinNow) {
      setAlertData({
        title: 'Come Back Tomorrow!',
        message: `You can spin again in:\n\n${nextSpinCountdown || 'calculating...'}`,
        type: 'info',
      });
      setAlertVisible(true);
    } else {
      setShowSpinModal(true);
    }
  };

  const renderTransaction = ({ item }: { item: RewardTx }) => {
    const isPositive = item.amount > 0;
    return (
      <View style={[styles.transactionItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }]}>
        <View style={styles.transactionIconContainer}>
          <Ionicons
            name={item.type === 'spin' ? 'aperture' : item.type === 'referral' ? 'people' : 'gift'}
            size={24}
            color={theme.primary}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionType, { color: theme.text }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Reward
          </Text>
          <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.transactionAmount, { color: isPositive ? '#10B981' : theme.text }]}>
          +₦{item.amount}
        </Text>
      </View>
    );
  };

  const walletDisplay = optimisticBalance ?? walletState.balance;
  const mergedTransactions = [...optimisticTransactions, ...transactions];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, isDark ? '#111827' : '#f3f4f6']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Rewards</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          {loading || walletState.isLoading ? (
            <Text style={styles.balanceAmount}>Loading...</Text>
          ) : (
            <Text style={styles.balanceAmount}>₦{Number(walletDisplay || 0).toLocaleString()}</Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
      >
        <TouchableOpacity
          style={[styles.actionCard, !canSpinNow && styles.actionCardDisabled]}
          onPress={handleSpinCardPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canSpinNow ? ['#10B981', '#059669'] : ['#d1d5db', '#9ca3af']}
            style={styles.actionCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.actionCardContent}>
              <View>
                <Text style={styles.actionCardTitle}>{canSpinNow ? 'Daily Spin Wheel' : 'Come Back Later'}</Text>
                <Text style={styles.actionCardSubtitle}>
                  {canSpinNow ? 'Spin daily and win rewards' : `Spin again in ${nextSpinCountdown || 'calculating...'}`}
                </Text>
              </View>
              <View style={styles.actionCardIcon}>
                <Ionicons name={canSpinNow ? 'color-filter' : 'time'} size={32} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Rewards</Text>
          <Text style={[styles.totalEarnedText, { color: theme.textSecondary }]}>
            Total earned: ₦{(totalReward || 0).toLocaleString()}
          </Text>
          {loading ? (
            <View style={styles.loadingSkeletonWrap}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={[styles.loadingRewardRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }]}>
                  <SkeletonLoader width={44} height={44} borderRadius={22} />
                  <View style={{ flex: 1 }}>
                    <SkeletonLoader width="52%" height={14} marginBottom={8} />
                    <SkeletonLoader width="36%" height={12} />
                  </View>
                  <SkeletonLoader width={64} height={16} />
                </View>
              ))}
            </View>
          ) : mergedTransactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No reward transactions yet.</Text>
          ) : (
            <View style={styles.listContainer}>
              {mergedTransactions.map((item) => renderTransaction({ item }))}
            </View>
          )}
        </View>
      </ScrollView>

      <SpinWheelModal
        visible={showSpinModal}
        onClose={() => setShowSpinModal(false)}
        onSpinComplete={handleSpinComplete}
        canSpin={canSpinNow}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  balanceContainer: { alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  balanceAmount: { fontSize: 40, fontWeight: '800', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20, marginTop: -20 },
  contentContainer: { paddingBottom: 24, flexGrow: 1 },
  actionCard: { borderRadius: 20, overflow: 'hidden' },
  actionCardDisabled: { opacity: 0.8 },
  actionCardGradient: { padding: 20 },
  actionCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  actionCardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historySection: { flex: 1, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  totalEarnedText: { fontSize: 13, marginBottom: 12 },
  loadingSkeletonWrap: { marginTop: 16 },
  loadingRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  transactionDetails: { flex: 1 },
  transactionType: { fontSize: 15, fontWeight: '700' },
  transactionDate: { fontSize: 12, marginTop: 2 },
  transactionAmount: { fontSize: 15, fontWeight: '800' },
  listContainer: { paddingBottom: 24 },
  emptyText: { fontSize: 14 },
});

export default RewardsScreen;
