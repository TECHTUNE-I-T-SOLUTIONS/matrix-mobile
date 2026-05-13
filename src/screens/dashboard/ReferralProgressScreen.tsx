// src/screens/dashboard/ReferralProgressScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useReferralProgress } from '../../hooks/useReferralProgress';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SkeletonLoader } from '../../components/SkeletonLoader';

const ReferralProgressScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { referrals, completedCount, walletFundedCount, totalCount, minimumFundingAmount, bonusUnlocked, loading } = useReferralProgress();

  const requiredForBonus = 5;
  const progressPercent = Math.min((completedCount / requiredForBonus) * 100, 100);

  const renderReferral = ({ item }: any) => {
    let iconName = 'time-outline';
    let iconColor = theme.textSecondary;
    let statusText = 'Pending funding';

    if (item.isCounted) {
      iconName = 'checkmark-circle';
      iconColor = '#10B981';
      statusText = 'Counted referral';
    } else if (item.walletFunded) {
      iconName = 'wallet-outline';
      iconColor = '#3B82F6';
      statusText = `Wallet funded (₦${minimumFundingAmount}+ required)`;
    }

    return (
      <View style={[styles.referralItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.referralInfo}>
          <Text style={[styles.referralName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.referralDate, { color: theme.textSecondary }]}>Code used: {item.referralCodeUsed || 'N/A'}</Text>
          <Text style={[styles.referralDate, { color: theme.textSecondary }]}>
            Joined {new Date(item.joinedAt).toLocaleDateString()}
          </Text>
          {item.walletFundedAt && (
            <Text style={[styles.referralDate, { color: theme.textSecondary }]}>Funded {new Date(item.walletFundedAt).toLocaleDateString()}</Text>
          )}
        </View>
        <View style={styles.statusContainer}>
          <Ionicons name={iconName as any} size={20} color={iconColor} />
          <Text style={[styles.statusText, { color: iconColor }]}>
            {statusText}
          </Text>
        </View>
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
          <Text style={styles.headerTitle}>Referral Progress</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>2GB Data Bonus Unlock</Text>
          <Text style={styles.progressSubtitle}>Wallet funding of at least ₦{minimumFundingAmount} counts as completed.</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: '#fff' }]} />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>{completedCount} / {requiredForBonus} Completed</Text>
            {bonusUnlocked && (
              <Text style={styles.unlockedText}>Bonus Unlocked! 🎉</Text>
            )}
          </View>
          <Text style={styles.progressMeta}>{walletFundedCount} users funded their wallet • {totalCount} total invitees</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Network</Text>
        {loading ? (
          <View style={styles.loadingSkeletonWrap}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={[styles.loadingReferralRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' }]}>
                <SkeletonLoader width={44} height={44} borderRadius={22} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width="52%" height={14} marginBottom={8} />
                  <SkeletonLoader width="66%" height={12} marginBottom={6} />
                  <SkeletonLoader width="38%" height={12} />
                </View>
              </View>
            ))}
          </View>
        ) : referrals.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You haven't referred anyone yet.</Text>
        ) : (
          <FlatList
            data={referrals}
            keyExtractor={(item) => item.id}
            renderItem={renderReferral}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
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
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  unlockedText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
  },
  progressMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingSkeletonWrap: {
    marginTop: 20,
  },
  loadingReferralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

export default ReferralProgressScreen;
