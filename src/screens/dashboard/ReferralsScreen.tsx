import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { apiClient } from '../../services/apiClient';

interface ReferralData {
  referral_code: string;
  current_tier: number;
  badge_name: string;
  completed_referrals: number;
  tier_1_completed: boolean;
  tier_2_completed: boolean;
  tier_3_completed: boolean;
  tier_4_completed: boolean;
  tier_5_completed: boolean;
  tier_6_completed: boolean;
}

interface ReferredUser {
  id: string;
  fullName: string;
  email: string;
  signupCompleted: boolean;
  kycCompleted: boolean;
  walletFunded: boolean;
  firstTransactionCompleted: boolean;
  createdAt: string;
}

const TIER_THRESHOLDS = [
  { tier: 1, name: "Awakening", target: 6, reward: "1GB Free Data" },
  { tier: 2, name: "Connected", target: 16, reward: "2GB Free Data" },
  { tier: 3, name: "Enlightened", target: 26, reward: "3GB Free Data" },
  { tier: 4, name: "Ascended", target: 36, reward: "5GB Free Data" },
  { tier: 5, name: "Architect", target: 46, reward: "10GB Free Data" },
  { tier: 6, name: "The One", target: 56, reward: "20GB Free Data" },
];

const ReferralsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);

      // Fetch referral data
      const referralResponse = await apiClient.get('/referrals') as any;
      console.log('Referral Response:', JSON.stringify(referralResponse, null, 2));
      
      // Handle double-wrapped response: response.data.data contains actual data
      const actualReferralData = referralResponse?.data?.data || referralResponse?.data;
      if (actualReferralData && actualReferralData.referral_code) {
        console.log('✓ Extracted referral data:', actualReferralData);
        setReferralData(actualReferralData as ReferralData);
      } else {
        console.warn('❌ Could not find referral code in response');
        setReferralData(null);
      }

      // Fetch referred users
      const usersResponse = await apiClient.get('/referrals/users') as any;
      console.log('Users Response:', JSON.stringify(usersResponse, null, 2));
      
      // Handle double-wrapped response: response.data.data contains actual array
      const actualUsersData = usersResponse?.data?.data || usersResponse?.data;
      if (Array.isArray(actualUsersData)) {
        console.log('✓ Extracted users array:', actualUsersData);
        setReferredUsers(actualUsersData as ReferredUser[]);
      } else {
        console.warn('❌ Users data is not an array');
        setReferredUsers([]);
      }

    } catch (error) {
      console.error('Error fetching referral data:', error);
      Alert.alert('Error', 'Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (referralData?.referral_code) {
      await Clipboard.setStringAsync(referralData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralCode = async () => {
    if (referralData?.referral_code) {
      try {
        const message = `Join Matrix Technologies! Use my referral code: ${referralData.referral_code} to get started. Download the app now!`;
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied!', 'Referral message copied to clipboard');
      } catch (error) {
        console.error('Error sharing referral code:', error);
      }
    }
  };

  const getCurrentTierProgress = () => {
    if (!referralData) return { progress: 0, remaining: 0, target: 0 };

    const currentTier = referralData.current_tier || 1;
    const completedReferrals = referralData.completed_referrals || 0;
    
    const currentTierIndex = Math.max(0, Math.min(currentTier - 1, TIER_THRESHOLDS.length - 1));
    const currentTierTarget = TIER_THRESHOLDS[currentTierIndex]?.target || 56;
    const previousTarget = currentTierIndex > 0 ? TIER_THRESHOLDS[currentTierIndex - 1].target : 0;
    const progressInTier = Math.max(0, completedReferrals - previousTarget);
    const tierRange = Math.max(1, currentTierTarget - previousTarget);
    const progressPercentage = Math.min((progressInTier / tierRange) * 100, 100);
    const remaining = Math.max(0, currentTierTarget - completedReferrals);

    return { progress: progressPercentage, remaining: Math.floor(remaining), target: currentTierTarget };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const { progress, remaining, target } = getCurrentTierProgress();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referrals</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Referral Progress Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="gift" size={24} color={theme.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Referral Program</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                {referralData?.badge_name || 'Loading...'}
              </Text>
            </View>
            <View style={styles.trophyContainer}>
              <Ionicons name="trophy" size={20} color={theme.primary} />
            </View>
          </View>

          {/* Referral Code Section */}
          <View style={styles.codeSection}>
            <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>Your Referral Code</Text>
            <View style={styles.codeContainer}>
              <Text style={[styles.referralCode, { color: theme.primary }]}>
                {referralData?.referral_code || 'Loading...'}
              </Text>
              <TouchableOpacity onPress={copyReferralCode} style={styles.copyButton}>
                <Ionicons
                  name={copied ? "checkmark" : "copy"}
                  size={20}
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={shareReferralCode}
              style={[styles.shareButton, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="share-social" size={20} color="white" />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ReferralProgress')}
              style={[styles.progressButton, { borderColor: theme.primary }]}
            >
              <Ionicons name="analytics" size={20} color={theme.primary} />
              <Text style={[styles.progressButtonText, { color: theme.primary }]}>View Referral Progress</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.text }]}>
                Tier {referralData?.current_tier || 1} Progress
              </Text>
              <Text style={[styles.progressCount, { color: theme.primary }]}>
                {referralData?.completed_referrals || 0}/{target}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.primary, width: `${progress}%` }
                ]}
              />
            </View>

            {/* Progress Info */}
            <View style={[styles.progressInfo, { backgroundColor: theme.surface }]}>
              <Ionicons name="gift" size={16} color={theme.primary} />
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {referralData?.current_tier === 6 ? (
                  "You've reached the highest tier! Keep referring to earn more bonuses."
                ) : (
                  `${remaining} more referrals to unlock 2GB Free Data`
                )}
              </Text>
            </View>
          </View>

          {/* Tier Rewards */}
          <View style={styles.tiersSection}>
            <Text style={[styles.tiersTitle, { color: theme.textSecondary }]}>Tier Rewards</Text>
            <View style={styles.tiersList}>
              {TIER_THRESHOLDS.map((tier) => {
                const isCompleted = (referralData?.completed_referrals || 0) >= tier.target;
                const isCurrent = referralData?.current_tier === tier.tier;

                return (
                  <View
                    key={tier.tier}
                    style={[
                      styles.tierItem,
                      {
                        backgroundColor: isCompleted
                          ? theme.primary + '20'
                          : isCurrent
                          ? theme.surface
                          : theme.surface + '80',
                        borderColor: isCompleted
                          ? theme.primary + '40'
                          : isCurrent
                          ? theme.primary + '60'
                          : 'transparent',
                      }
                    ]}
                  >
                    <View style={styles.tierLeft}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                      )}
                      {isCurrent && !isCompleted && (
                        <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                      )}
                      <Text style={[
                        styles.tierName,
                        {
                          color: isCurrent ? theme.primary : theme.text,
                          fontWeight: isCurrent ? '600' : '500'
                        }
                      ]}>
                        {tier.name}
                      </Text>
                    </View>
                    <View style={styles.tierRight}>
                      <Text style={[styles.tierTarget, { color: theme.textSecondary }]}>
                        {tier.target} refs
                      </Text>
                      <Text style={[styles.tierReward, { color: theme.primary }]}>
                        {tier.reward}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Referred Users Card */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Referrals</Text>
          {referredUsers.length > 0 ? (
            referredUsers.map((user) => {
              // Calculate status based on completion flags
              const isActive = user.signupCompleted && (user.kycCompleted || user.walletFunded || user.firstTransactionCompleted);
              const status = isActive ? 'active' : 'inactive';

              return (
                <View key={user.id} style={styles.referralItem}>
                  <View style={styles.referralInfo}>
                    <Text style={[styles.referralName, { color: theme.text }]}>{user.fullName}</Text>
                    <Text style={[styles.referralEmail, { color: theme.textSecondary }]}>{user.email}</Text>
                    <Text style={[styles.referralDate, { color: theme.textSecondary }]}>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.referralProgress}>
                      <Text style={[styles.referralProgressText, { color: theme.textSecondary }]}>
                        Progress: {[
                          user.signupCompleted && '✓ Signed up',
                          user.kycCompleted && '✓ KYC completed',
                          user.walletFunded && '✓ Wallet funded',
                          user.firstTransactionCompleted && '✓ First transaction'
                        ].filter(Boolean).join(' • ') || 'In progress...'}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: status === 'active' ? '#10B981' : '#6B7280'
                    }
                  ]}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No referrals yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Share your referral code to start earning rewards
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  trophyContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeSection: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  progressButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  tiersSection: {
    marginBottom: 0,
  },
  tiersTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tiersList: {
    gap: 8,
  },
  tierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tierName: {
    fontSize: 14,
    marginLeft: 8,
  },
  tierRight: {
    alignItems: 'flex-end',
  },
  tierTarget: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierReward: {
    fontSize: 10,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  referralEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  referralDate: {
    fontSize: 12,
  },
  referralProgress: {
    marginTop: 4,
  },
  referralProgressText: {
    fontSize: 11,
    lineHeight: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ReferralsScreen;