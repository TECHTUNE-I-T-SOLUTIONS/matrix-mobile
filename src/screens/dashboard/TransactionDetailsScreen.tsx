import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useShareReceipt } from '../../hooks/useShareReceipt';
import ShareReceiptTemplate from '../../components/ShareReceiptTemplate';
import { DashboardStackParamList } from '../../navigation/types';

type TransactionDetailsRouteProp = RouteProp<DashboardStackParamList, 'TransactionDetails'>;

const TransactionDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<TransactionDetailsRouteProp>();
  const { transaction } = route.params;
  const { viewShotRef, shareReceipt } = useShareReceipt(transaction.transaction_id);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      default:
        return '#EF4444';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const metadata = transaction.metadata || {};

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="receipt" size={32} color={theme.primary} />
          </View>

          <Text style={[styles.amount, { color: theme.text }]}>
            ₦{Math.abs(transaction.amount).toLocaleString()}
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {transaction.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <DetailRow label="Service" value={transaction.service_type?.toUpperCase() || 'TRANSACTION'} theme={theme} />
            <DetailRow label="Reference" value={transaction.transaction_reference} theme={theme} />
            <DetailRow label="Date" value={formatDate(transaction.created_at)} theme={theme} />
            
            {transaction.recipient && (
              <DetailRow label="Recipient" value={transaction.recipient} theme={theme} />
            )}

            {metadata.network && (
              <DetailRow label="Network" value={metadata.network.toUpperCase()} theme={theme} />
            )}

            {metadata.plan_name || metadata.plan && (
              <DetailRow label="Plan" value={metadata.plan_name || metadata.plan} theme={theme} />
            )}

            {metadata.meter_number && (
              <DetailRow label="Meter Number" value={metadata.meter_number} theme={theme} />
            )}

            {metadata.disco && (
              <DetailRow label="Provider" value={metadata.disco.toUpperCase()} theme={theme} />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.primary }]}
          onPress={shareReceipt}
        >
          <Ionicons name="share-social" size={20} color="white" />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Hidden Receipt Template for Sharing */}
      <View style={styles.hiddenTemplate}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          <ShareReceiptTemplate 
            transaction={{
              serviceType: transaction.service_type || 'Transaction',
              amount: Math.abs(transaction.amount),
              recipient: transaction.recipient,
              network: metadata.network,
              status: transaction.status,
              transactionId: transaction.transaction_reference,
              timestamp: transaction.created_at,
              meterNumber: metadata.meter_number,
              disco: metadata.disco,
              plan: metadata.plan_name || metadata.plan,
            }} 
          />
        </ViewShot>
      </View>
    </View>
  );
};

const DetailRow = ({ label, value, theme }: { label: string; value: string; theme: any }) => (
  <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hiddenTemplate: {
    position: 'absolute',
    left: -1000,
    top: 0,
    opacity: 0,
  },
});

export default TransactionDetailsScreen;
