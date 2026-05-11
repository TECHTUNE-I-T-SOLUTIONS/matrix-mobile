// src/screens/dashboard/RewardsScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useRewards } from '../../hooks/useRewards';
import SpinWheelModal from './SpinWheelModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';

const RewardsScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { rewardBalance, transactions, loading, spinReward, fetchRewards, canSpinNow, nextSpinAt } = useRewards();
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [nextSpinCountdown, setNextSpinCountdown] = useState('');
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' | 'warning' | 'info' });

  // Refresh data when screen comes into focus (empty deps array to prevent infinite loops)
  useFocusEffect(
    React.useCallback(() => {
      fetchRewards();
    }, [])
  );

  // Update countdown timer
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
          // Refresh to update canSpinNow
          fetchRewards();
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [canSpinNow, nextSpinAt]);

  const handleSpinComplete = async () => {
    // Call the spin reward API
    const result = await spinReward();
    if (result > 0) {
      // Refresh rewards data
      await fetchRewards();
    }

    return result;
  };

  const handleSpinCardPress = () => {
    if (!canSpinNow) {
      // Show countdown alert instead
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

  const renderTransaction = ({ item }: any) => {
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
          +{item.amount}₦
        </Text>
      </View>
    );
  };

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
          <Text style={styles.balanceLabel}>Total Reward Balance</Text>
          {loading ? (
            <Text style={styles.balanceAmount}>Loading...</Text>
          ) : (
            <Text style={styles.balanceAmount}>{(rewardBalance || 0).toLocaleString()}₦</Text>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
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
                <Text style={styles.actionCardTitle}>
                  {canSpinNow ? 'Daily Spin Wheel' : 'Come Back Later'}
                </Text>
                <Text style={styles.actionCardSubtitle}>
                  {canSpinNow 
                    ? 'Spin daily and win rewards' 
                    : `Spin again in ${nextSpinCountdown || 'calculating...'}`
                  }
                </Text>
              </View>
              <View style={styles.actionCardIcon}>
                <Ionicons 
                  name={canSpinNow ? "color-filter" : "time"} 
                  size={32} 
                  color="#fff" 
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Rewards</Text>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No reward transactions yet.</Text>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransaction}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>

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
  container: {
    flex: 1,
  },
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  actionCard: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 24,
  },
  actionCardDisabled: {
    opacity: 0.8,
  },
  actionCardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#f0fdf4',
  },
  actionCardIcon: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    padding: 12,
  },
  historySection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

export default RewardsScreen;
