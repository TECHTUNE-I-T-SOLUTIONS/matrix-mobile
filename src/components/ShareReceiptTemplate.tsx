import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareReceiptTemplateProps {
  transaction: {
    serviceType: string;
    amount: number;
    recipient?: string;
    network?: string;
    status: string;
    transactionId: string;
    timestamp: string;
    meterNumber?: string;
    disco?: string;
    provider?: string;
    plan?: string;
  };
}

const { width } = Dimensions.get('window');

const ShareReceiptTemplate: React.FC<ShareReceiptTemplateProps> = ({ transaction }) => {
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
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Branded Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>MATRIX TECHNOLOGIES</Text>
        <Text style={styles.brandTagline}>Fast & Secure Transactions</Text>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Transaction Amount</Text>
        <Text style={styles.amountValue}>₦{transaction.amount.toLocaleString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
            {transaction.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Details Section */}
      <View style={styles.detailsContainer}>
        <DetailRow label="Service Type" value={transaction.serviceType.toUpperCase()} />
        <DetailRow label="Transaction ID" value={transaction.transactionId} />
        <DetailRow label="Date & Time" value={formatDate(transaction.timestamp)} />

        {/* Dynamic Rows based on Service Type */}
        {transaction.recipient && (
          <DetailRow 
            label={transaction.serviceType === 'electricity' ? 'Meter Number' : 'Recipient'} 
            value={transaction.recipient} 
          />
        )}

        {transaction.network && (
          <DetailRow label="Network" value={transaction.network.toUpperCase()} />
        )}

        {transaction.plan && (
          <DetailRow label="Plan" value={transaction.plan} />
        )}

        {transaction.disco && (
          <DetailRow label="Provider" value={transaction.disco.toUpperCase()} />
        )}

        {transaction.serviceType === 'electricity' && transaction.provider && (
          <DetailRow label="Token" value={transaction.provider} /> // Often the token is returned in a provider field or similar
        )}

        {transaction.serviceType === 'cabletv' && transaction.plan && (
          <DetailRow label="Package" value={transaction.plan} />
        )}
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.footerText}>Verified Transaction</Text>
        </View>
        <Text style={styles.thankYou}>Thank you for choosing Matrix</Text>
        <Text style={styles.website}>www.matrixtechnologies.tech</Text>
      </View>

      {/* Watermark */}
      <Text style={styles.watermark}>MATRIX RECEIPT</Text>
    </View>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: 400, // Fixed width for consistent capture
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  thankYou: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  website: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  watermark: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    fontSize: 40,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.03)',
    textAlign: 'center',
    transform: [{ rotate: '-30deg' }],
    zIndex: -1,
  },
});

export default ShareReceiptTemplate;
