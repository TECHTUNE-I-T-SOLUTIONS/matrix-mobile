// src/screens/dashboard/FundWalletScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../../navigation/types';
import CustomAlert from '../../components/CustomAlert';
import { SkeletonLoader } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

type FundWalletScreenNavigationProp = StackNavigationProp<DashboardStackParamList, 'FundWallet'>;

interface VirtualAccount {
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
}

const FundWalletScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { session } = useSession();
  const navigation = useNavigation<FundWalletScreenNavigationProp>();
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchVirtualAccount();
  }, []);

  const fetchVirtualAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.accessToken) {
        console.error('[FundWallet] No access token available');
        setError('Authentication error. Please log in again.');
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';
      console.log('[FundWallet] Fetching from:', `${apiUrl}/payscribe/virtual-accounts`);
      console.log('[FundWallet] Token available:', !!session.accessToken);

      const response = await fetch(`${apiUrl}/payscribe/virtual-accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[FundWallet] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[FundWallet] Full Response data:', JSON.stringify(data, null, 2));
        
        // API returns: { success: true, data: [...] }
        // Extract the accounts array from data.data
        const accounts = data?.data || data;
        
        console.log('[FundWallet] Extracted accounts:', JSON.stringify(accounts, null, 2));
        console.log('[FundWallet] Is array?', Array.isArray(accounts));
        console.log('[FundWallet] Array length:', Array.isArray(accounts) ? accounts.length : 'N/A');

        if (Array.isArray(accounts) && accounts.length > 0) {
          console.log('[FundWallet] ✓ Virtual accounts retrieved:', accounts.length);
          console.log('[FundWallet] Setting first account:', accounts[0]);
          setVirtualAccount(accounts[0]);
        } else {
          console.warn('[FundWallet] ❌ No accounts in response. Accounts:', accounts);
          setError('No virtual account found. Please contact support.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[FundWallet] API error response:', response.status, errorData);
        setError(errorData.error || `Failed to fetch virtual account (${response.status})`);
      }
    } catch (err) {
      console.error('[FundWallet] Fetch error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      showAlert('Copied', `${label} copied to clipboard!`, 'success');
    } catch (error) {
      showAlert('Error', 'Failed to copy to clipboard', 'error');
    }
  };

  const handleRefresh = () => {
    fetchVirtualAccount();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#012201', '#023502'] : ['#49EE49', '#89EB89']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fund Wallet</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            disabled={loading}
          >
            <Ionicons
              name="refresh"
              size={24}
              color="white"
              style={loading ? styles.spinning : undefined}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            Transfer any amount to the account details below. Your wallet will be credited within 2-5 minutes.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingSkeletonWrap}>
            <View style={[styles.loadingInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <SkeletonLoader width="42%" height={14} marginBottom={12} />
              <SkeletonLoader width="78%" height={22} marginBottom={10} />
              <SkeletonLoader width="62%" height={14} />
            </View>
            <View style={[styles.loadingAccountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <SkeletonLoader width="36%" height={12} marginBottom={10} />
              <SkeletonLoader width="72%" height={20} marginBottom={14} />
              <SkeletonLoader width="46%" height={12} marginBottom={10} />
              <SkeletonLoader width="88%" height={18} />
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.error || '#ef4444'} />
            <Text style={[styles.errorText, { color: theme.text }]}>
              {session.user?.kyc_required && session.user?.kyc_status === 'not_started' 
                ? 'Your virtual accounts will be available once you complete your KYC verification.' 
                : error}
            </Text>
            
            {session.user?.kyc_required && session.user?.kyc_status === 'not_started' ? (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary, width: '100%' }]}
                onPress={() => navigation.navigate('KYC' as any)}
              >
                <Text style={styles.retryButtonText}>Complete KYC Now</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={fetchVirtualAccount}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : virtualAccount ? (
          <View style={styles.accountDetailsContainer}>
            {/* Account Name */}
            {virtualAccount.account_name && (
              <View style={[styles.accountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Account Name</Text>
                <View style={styles.accountRow}>
                  <Text style={[styles.accountValue, { color: theme.text }]} numberOfLines={1}>
                    {virtualAccount.account_name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(virtualAccount.account_name, 'Account name')}
                    style={styles.copyButton}
                  >
                    <Ionicons name="copy" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Account Number */}
            <View style={[styles.accountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Account Number</Text>
              <View style={styles.accountRow}>
                <Text style={[styles.accountNumber, { color: theme.primary }]}>
                  {virtualAccount.account_number}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(virtualAccount.account_number, 'Account number')}
                  style={styles.copyButton}
                >
                  <Ionicons name="copy" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bank Name */}
            <View style={[styles.accountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Bank Name</Text>
              <View style={styles.accountRow}>
                <Text style={[styles.accountValue, { color: theme.text }]}>
                  {virtualAccount.bank_name}
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(virtualAccount.bank_name, 'Bank name')}
                  style={styles.copyButton}
                >
                  <Ionicons name="copy" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.instructionsTitle, { color: theme.text }]}>How to Fund Your Wallet</Text>
              <View style={styles.instructionList}>
                <View style={styles.instructionItem}>
                  <Text style={[styles.instructionNumber, { backgroundColor: theme.primary }]}>1</Text>
                  <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                    Copy the account details above
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={[styles.instructionNumber, { backgroundColor: theme.primary }]}>2</Text>
                  <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                    Open your banking app and transfer any amount
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Text style={[styles.instructionNumber, { backgroundColor: theme.primary }]}>3</Text>
                  <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                    Your wallet will be credited automatically within 2-5 minutes
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={closeAlert} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  refreshButton: {
    padding: 8,
  },
  spinning: {
    transform: [{ rotate: '45deg' }],
  },
  container: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  loadingSkeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingInfoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  loadingAccountCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  accountDetailsContainer: {
    gap: 16,
  },
  accountCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  accountNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  instructionsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginTop: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instructionList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});

export default FundWalletScreen;