// src/screens/dashboard/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import * as Application from 'expo-application'
import ApkInstaller from '../../components/ApkInstaller'
import { isAutoCheckEnabled } from '../../hooks/useAutoUpdateCheck'
import { useSession } from '../../contexts/SessionContext';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
import CustomAlert from '../../components/CustomAlert';
import { useNavigation } from '@react-navigation/native';
import { isUpdateAvailable } from '../../utils/versionUtils';
import { SkeletonLoader } from '../../components/SkeletonLoader';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  accountBalance: number;
  totalTransactions: number;
  referralCode: string;
}

const ProfileScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { signOut, session } = useSession();
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestRelease, setLatestRelease] = useState<any>(null)
  const [proxiedAvatarUri, setProxiedAvatarUri] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
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

  const fetchProfileData = async () => {
    try {
      // Use session user data combined with real API data
      if (session.user) {
        // fetch user's transactions to determine count (same logic as TransactionsScreen)
        let totalTx = 0
        try {
          const txRes = await apiClient.get('/transactions/all')
          if (txRes && txRes.success && txRes.data) {
            const list = (txRes.data as any).data?.transactions || []
            totalTx = Array.isArray(list) ? list.length : 0
          }
        } catch (e) {
          totalTx = 0
        }
        // Fetch real profile data from API
        const profileResponse = await apiClient.get('/user/profile');
        const user = profileResponse.success ? (profileResponse.data as any).user : session.user;

        const profileData: ProfileData = {
          id: user.id,
          firstName: user.first_name || user.full_name?.split(' ')[0] || 'User',
          lastName: user.last_name || user.full_name?.split(' ')[1] || '',
          email: user.email,
          phone: user.mobile || user.phone || '+234 810 981 6653',
          avatar: user.photo_url || user.avatar_url || undefined,
          kycStatus: user.kyc_verified ? 'verified' : 'pending',
          accountBalance: parseFloat(user.wallet_balance || 0),
          totalTransactions: totalTx,
          referralCode: 'MATRIX1234',
        };
        setProfileData(profileData);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Fallback to session data if API fails
      if (session.user) {
        const fallbackData: ProfileData = {
          id: session.user.id,
          firstName: session.user.full_name?.split(' ')[0] || 'User',
          lastName: session.user.full_name?.split(' ')[1] || '',
          email: session.user.email,
          phone: session.user.phone || '+234 810 981 6653',
          avatar: session.user.avatar_url || undefined,
          kycStatus: (session.user as any).kyc_verified ? 'verified' : 'pending',
          accountBalance: parseFloat((session.user as any).wallet_balance || 0),
          totalTransactions: 0,
          referralCode: 'MATRIX1234',
        };
        setProfileData(fallbackData);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    // run auto-update check only while on Profile screen
    (async () => {
      try {
        const enabled = await isAutoCheckEnabled()
        if (enabled) {
          const has = await fetchLatestRelease()
          if (has) {
            // show custom styled alert modal
            setShowUpdateModal(true)
          }
        }
      } catch (e) {
        // ignore
      }
    })()
  }, []);

  const fetchLatestRelease = async (): Promise<boolean> => {
    try {
      setIsCheckingUpdate(true)
      const websiteApi = process.env.EXPO_PUBLIC_DOWNLOAD_APK_URL || (process.env.EXPO_PUBLIC_APP_URL ? `${process.env.EXPO_PUBLIC_APP_URL.replace(/\/$/, '')}/api/latest-release` : '')

      let data: any = null

      // Prefer the website proxy which uses a server-side GitHub token
      if (websiteApi) {
        const res = await fetch(websiteApi, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch latest release from website')
        data = await res.json()
      } else {
        const OWNER = 'TECHTUNE-I-T-SOLUTIONS'
        const REPO = 'matrix-mobile'
        const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch release')
        data = await res.json()
      }
      setLatestRelease(data)
      const tag = data.tag_name || data.name
      
      if (tag && isUpdateAvailable(tag)) {
        setUpdateAvailable(true)
        return true
      } else {
        setUpdateAvailable(false)
        return false
      }
    } catch (err) {
      console.warn('Update check failed', err)
      return false
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleInstallUpdate = async () => {
    showAlert(
      'Download App',
      'Tap Update App below to download and install the latest APK directly on this device.',
      'info'
    )
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      showAlert('Error', 'Failed to logout. Please try again.', 'error');
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#047603';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return theme.textSecondary;
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.primary, paddingBottom: 30 },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Profile</Text>
              <Text style={styles.subGreeting}>
                Manage your account settings
              </Text>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingSkeletonWrap}>
            <View style={[styles.loadingSkeletonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.loadingAvatarRow}>
                <SkeletonLoader width={76} height={76} borderRadius={38} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width="58%" height={18} marginBottom={10} />
                  <SkeletonLoader width="78%" height={14} marginBottom={8} />
                  <SkeletonLoader width="44%" height={14} />
                </View>
              </View>
              <View style={styles.loadingActionRow}>
                <SkeletonLoader width={110} height={36} borderRadius={18} />
                <SkeletonLoader width={110} height={36} borderRadius={18} />
              </View>
            </View>

            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={[styles.loadingMenuRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <SkeletonLoader width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width="52%" height={14} marginBottom={8} />
                  <SkeletonLoader width="34%" height={12} />
                </View>
                <SkeletonLoader width={20} height={20} borderRadius={10} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {profileData && (
              <>
                {/* Profile Header */}
                <View
                  style={[
                    styles.profileCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.avatarContainer}>
                    {profileData.avatar ? (
                      <Image
                        source={{ uri: proxiedAvatarUri || profileData.avatar }}
                        style={styles.avatar}
                        onError={(e) => {
                          console.warn('Avatar load error', e.nativeEvent)
                          // If original host cannot be resolved from device, try proxy via website
                          if (!proxiedAvatarUri && process.env.EXPO_PUBLIC_APP_URL) {
                            try {
                              const base = process.env.EXPO_PUBLIC_APP_URL.replace(/\/$/, '')
                              const proxy = `${base}/api/proxy-image?url=${encodeURIComponent(String(profileData.avatar))}`
                              setProxiedAvatarUri(proxy)
                              return
                            } catch (err) {
                              // ignore
                            }
                          }

                          // Fallback to placeholder if proxy also fails
                          setProfileData(prev => prev ? { ...prev, avatar: undefined } : null);
                        }}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarPlaceholder,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {profileData.firstName[0]}
                          {profileData.lastName[0]}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={[styles.fullName, { color: theme.text }]}>
                      {profileData.firstName} {profileData.lastName}
                    </Text>
                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                      <TouchableOpacity onPress={fetchLatestRelease} style={{ marginRight: 12 }}>
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>{isCheckingUpdate ? 'Checking...' : 'Check for update'}</Text>
                      </TouchableOpacity>
                      {updateAvailable && (
                        <>
                          <TouchableOpacity onPress={handleInstallUpdate}>
                            <Text style={{ color: '#047603', fontWeight: '700' }}>Update Info</Text>
                          </TouchableOpacity>
                          <ApkInstaller />
                        </>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.email,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {profileData.email}
                    </Text>
                    <Text
                      style={[
                        styles.phone,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {profileData.phone}
                    </Text>
                  </View>
                </View>

                {/* KYC Status */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.text }]}
                  >
                    Verification Status
                  </Text>
                  <View
                    style={[
                      styles.kycCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.kycContent}>
                      <Ionicons
                        name={
                          profileData.kycStatus === 'verified'
                            ? 'checkmark-circle'
                            : 'alert-circle'
                        }
                        size={24}
                        color={getKYCStatusColor(
                          profileData.kycStatus
                        )}
                      />
                      <View style={styles.kycInfo}>
                        <Text
                          style={[
                            styles.kycLabel,
                            { color: theme.text },
                          ]}
                        >
                          KYC Status
                        </Text>
                        <Text
                          style={[
                            styles.kycStatus,
                            {
                              color: getKYCStatusColor(
                                profileData.kycStatus
                              ),
                            },
                          ]}
                        >
                          {profileData.kycStatus
                            .charAt(0)
                            .toUpperCase() +
                            profileData.kycStatus.slice(1)}
                        </Text>
                      </View>
                    </View>
                    {profileData.kycStatus !== 'verified' && (
                      <TouchableOpacity
                        style={[
                          styles.kycButton,
                          { backgroundColor: theme.primary },
                        ]}
                        onPress={() => navigation.navigate('KYC')}
                      >
                        <Text style={styles.kycButtonText}>
                          Complete KYC
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Account Info */}
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.text }]}
                  >
                    Account Information
                  </Text>
                  <View
                    style={[
                      styles.infoCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.infoRow}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Phone
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: theme.text }]}>
                        {profileData.phone}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.border },
                      ]}
                    />
                    <View style={styles.infoRow}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Account Balance
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: theme.primary }]}>
                        {formatCurrency(profileData.accountBalance)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.border },
                      ]}
                    />
                    <View style={styles.infoRow}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Total Transactions
                      </Text>
                      <Text
                        style={[styles.infoValue, { color: theme.text }]}>
                        {profileData.totalTransactions}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Rewards Ecosystem */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Ecosystem</Text>
                  
                  <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('PriceComparison')}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons name="pricetags" size={20} color={theme.primary} />
                      <Text style={[styles.menuText, { color: theme.text }]}>Price Comparison</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('Referrals')}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons name="people" size={20} color={theme.primary} />
                      <Text style={[styles.menuText, { color: theme.text }]}>Referrals</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('SpendAnalytics')}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons name="pie-chart" size={20} color={theme.primary} />
                      <Text style={[styles.menuText, { color: theme.text }]}>Spend Analytics</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                  
                </View>

                {/* Settings & Logout */}
                <View style={styles.section}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons
                        name="settings"
                        size={20}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.menuText,
                          { color: theme.text },
                        ]}
                      >
                        Settings
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => navigation.navigate('About')}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.menuText,
                          { color: theme.text },
                        ]}
                      >
                        About Matrix
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => navigation.navigate('NetworkStatus')}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons
                        name="pulse"
                        size={20}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.menuText,
                          { color: theme.text },
                        ]}
                      >
                        Network Status
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => navigation.navigate('Support')}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons
                        name="help-circle"
                        size={20}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.menuText,
                          { color: theme.text },
                        ]}
                      >
                        Help & Support
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      styles.logoutItem,
                      { borderColor: '#ef4444' },
                    ]}
                    onPress={handleLogout}
                  >
                    <View style={styles.menuContent}>
                      <Ionicons
                        name="log-out"
                        size={20}
                        color="#ef4444"
                      />
                      <Text
                        style={[
                          styles.menuText,
                          { color: '#ef4444' },
                        ]}
                      >
                        Logout
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons
                name="log-out"
                size={48}
                color="#ef4444"
                style={styles.modalIcon}
              />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Confirm Logout
              </Text>
              <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
                Are you sure you want to logout? You'll need to sign in again to access your account.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: theme.border },
                ]}
                onPress={cancelLogout}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update available modal (styled) */}
      <CustomAlert
        visible={showUpdateModal}
        title="Update available"
        message="A new release is available. Use the Update App button to download it directly on this device."
        type="info"
        buttons={[
          { text: 'LATER', onPress: () => setShowUpdateModal(false), style: 'cancel' },
          { text: 'OK', onPress: () => { setShowUpdateModal(false); handleInstallUpdate() } },
        ]}
        onClose={() => setShowUpdateModal(false)}
      />
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={closeAlert} />
    </>
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
    paddingTop: 60,
  },
  headerLeft: {
    flex: 1,
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
  loadingSkeletonWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingSkeletonCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  loadingAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  loadingActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginTop: -10,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    fontSize: 14,
    flex: 1,
  },
  kycCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  kycContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kycInfo: {
    marginLeft: 12,
    flex: 1,
  },
  kycLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  kycStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  kycButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  kycButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  referralCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  referralCode: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutItem: {
    backgroundColor: '#ef444410',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
