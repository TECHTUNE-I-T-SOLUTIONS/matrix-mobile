// src/screens/dashboard/SuccessScreen.tsx
import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type ServiceType = 'data' | 'airtime' | 'cabletv' | 'electricity' | 'exampins' | 'international' | 'internet' | 'betting';

interface SuccessData {
  serviceType: ServiceType;
  amount: number;
  recipient?: string;
  planName?: string;
  transactionId?: string;
  network?: string;
  provider?: string;
  meterNumber?: string;
  meterType?: string;
  quantity?: number;
  status?: string;
  timestamp?: string;
  apiResponse?: any;
}

type SuccessScreenRouteProp = RouteProp<{ Success: { data: SuccessData } }, 'Success'>;

const SuccessScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<SuccessScreenRouteProp>();
  const { data } = route.params;
  const viewShotRef = useRef<ViewShot>(null);

  const getServiceConfig = (serviceType: ServiceType) => {
    switch (serviceType) {
      case 'data':
        return {
          title: 'Data Purchase Successful!',
          subtitle: 'Your data bundle has been activated',
          icon: 'wifi',
          color: '#10B981',
          details: [
            { label: 'Network', value: data.network?.toUpperCase() },
            { label: 'Plan', value: data.planName },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Phone Number', value: data.recipient },
          ],
        };
      case 'airtime':
        return {
          title: 'Airtime Purchase Successful!',
          subtitle: 'Your airtime has been credited',
          icon: 'call',
          color: '#F59E0B',
          details: [
            { label: 'Network', value: data.network?.toUpperCase() },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Phone Number', value: data.recipient },
          ],
        };
      case 'cabletv':
        return {
          title: 'Cable TV Purchase Successful!',
          subtitle: 'Your subscription has been activated',
          icon: 'tv',
          color: '#8B5CF6',
          details: [
            { label: 'Provider', value: data.provider },
            { label: 'Plan', value: data.planName },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Smart Card Number', value: data.recipient },
            { label: 'Quantity', value: data.quantity?.toString() },
          ].filter(item => item.value), // Remove undefined values
        };
      case 'electricity':
        return {
          title: 'Electricity Bill Paid!',
          subtitle: 'Your electricity bill has been paid successfully',
          icon: 'flash',
          color: '#EF4444',
          details: [
            { label: 'Provider', value: data.provider },
            { label: 'Meter Type', value: data.meterType },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Meter Number', value: data.meterNumber },
          ],
        };
      case 'exampins':
        return {
          title: 'Exam Pins Purchased!',
          subtitle: 'Your exam pins have been generated successfully',
          icon: 'school',
          color: '#6366F1',
          details: [
            { label: 'Exam Type', value: data.provider },
            { label: 'Plan', value: data.planName },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Quantity', value: data.quantity?.toString() },
          ].filter(item => item.value),
        };
      case 'international':
        return {
          title: 'International Bill Paid!',
          subtitle: 'Your international bill has been paid successfully',
          icon: 'globe',
          color: '#059669',
          details: [
            { label: 'Service', value: data.provider },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Email', value: data.recipient },
          ],
        };
      case 'internet':
        return {
          title: 'Internet Subscription Active!',
          subtitle: 'Your internet subscription has been activated',
          icon: 'wifi',
          color: '#0EA5E9',
          details: [
            { label: 'Provider', value: data.provider },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Account Number', value: data.recipient },
          ],
        };
      case 'betting':
        return {
          title: 'Betting Account Funded!',
          subtitle: 'Your betting account has been credited successfully',
          icon: 'trophy',
          color: '#F59E0B',
          details: [
            { label: 'Provider', value: data.provider },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Account ID', value: data.recipient },
          ],
        };
      default:
        return {
          title: 'Purchase Successful!',
          subtitle: 'Your transaction has been completed',
          icon: 'checkmark-circle',
          color: '#10B981',
          details: [
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
          ],
        };
    }
  };

  const config = getServiceConfig(data.serviceType);

  const handleShareReceipt = async () => {
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.share({
          message: `Receipt for ${config.title}`,
          url: uri,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const handleDone = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Success Animation Background */}
        <LinearGradient
          colors={[config.color + '20', config.color + '10', theme.background]}
          style={styles.backgroundGradient}
        />

        {/* Success Card */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
          <View style={[styles.successCard, { backgroundColor: theme.surface, shadowColor: config.color }]}>
          {/* Success Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon as any} size={48} color={config.color} />
            <View style={[styles.checkmarkRing, { borderColor: config.color }]}>
              <Ionicons name="checkmark" size={24} color={config.color} />
            </View>
          </View>

          {/* Title and Subtitle */}
          <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{config.subtitle}</Text>

          {/* Transaction Details */}
          <View style={styles.detailsContainer}>
            {config.details.map((detail, index) => (
              <View key={index} style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{detail.label}:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{detail.value}</Text>
              </View>
            ))}

            {/* Status */}
            {data.status && (
              <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: data.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                  <Text style={styles.statusText}>{data.status.toUpperCase()}</Text>
                </View>
              </View>
            )}

            {/* Timestamp */}
            {data.timestamp && (
              <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Date & Time:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {new Date(data.timestamp).toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Transaction ID */}
          {data.transactionId && (
            <View style={[styles.transactionIdContainer, { backgroundColor: theme.surfaceVariant }]}>
              <Text style={[styles.transactionIdLabel, { color: theme.textSecondary }]}>
                Transaction ID
              </Text>
              <Text style={[styles.transactionId, { color: theme.primary }]}>{data.transactionId}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.shareButton, { borderColor: config.color }]}
              onPress={handleShareReceipt}
            >
              <Ionicons name="share-outline" size={20} color={config.color} />
              <Text style={[styles.shareButtonText, { color: config.color }]}>Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: config.color }]}
              onPress={handleDone}
            >
              <Text style={[styles.doneButtonText, { color: '#ffffff' }]}>Done</Text>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
        </View>
        </ViewShot>
      </View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successCard: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  checkmarkRing: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  transactionIdContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  transactionIdLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  transactionId: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  autoCloseText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SuccessScreen;
