// src/screens/dashboard/SuccessScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Alert,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useShareReceipt } from '../../hooks/useShareReceipt';
import ShareReceiptTemplate from '../../components/ShareReceiptTemplate';

type ServiceType = 'data' | 'airtime' | 'cabletv' | 'electricity' | 'exampins' | 'international' | 'internet' | 'betting';

interface SuccessData {
  serviceType: ServiceType;
  amount: number;
  recipient?: string;
  planName?: string;
  betId?: string;
  customerName?: string;
  transactionId?: string;
  network?: string;
  provider?: string;
  meterNumber?: string;
  meterType?: string;
  pin?: string;
  serial?: string;
  quantity?: number;
  status?: string;
  timestamp?: string;
  apiResponse?: any;
  pins?: Array<{ name?: string; pin?: string; serial?: string }>;
  pinTitle?: string;
}

interface ExamPinEntry {
  name?: string;
  pin?: string;
  serial?: string;
}

type SuccessScreenRouteProp = RouteProp<{ Success: { data: SuccessData } }, 'Success'>;

const SuccessScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<SuccessScreenRouteProp>();
  const { data } = route.params;
  const { viewShotRef, shareReceipt } = useShareReceipt(data.transactionId);

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
            { label: 'Pin / Token', value: data.pin || data.apiResponse?.token || data.apiResponse?.details?.token || data.apiResponse?.message?.details?.token },
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
            { label: 'Pin Type', value: data.pinTitle },
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
            { label: 'Plan', value: data.planName },
            { label: 'Amount', value: `₦${data.amount.toLocaleString()}` },
            { label: 'Account Number', value: data.recipient },
            {
              label: 'Pin / Token',
              value:
                data.pin ||
                data.apiResponse?.pin ||
                data.apiResponse?.data?.pin ||
                data.apiResponse?.message?.details?.processed?.pin,
            },
            {
              label: 'Serial',
              value:
                data.serial ||
                data.apiResponse?.serial ||
                data.apiResponse?.data?.serial ||
                data.apiResponse?.message?.details?.processed?.serial,
            },
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
            { label: 'Bet ID', value: data.betId },
            { label: 'Customer Name', value: data.customerName || data.planName },
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
  const [copiedPin, setCopiedPin] = useState(false);
  const pins: ExamPinEntry[] = Array.isArray(data.pins)
    ? data.pins
    : Array.isArray(data.apiResponse?.pins)
      ? data.apiResponse.pins
      : Array.isArray(data.apiResponse?.data?.pins)
        ? data.apiResponse.data.pins
        : [];

  const handleCopyPin = async (pin: string) => {
    try {
      await Clipboard.setString(pin);
      setCopiedPin(true);
      Alert.alert('Copied!', 'PIN/Token copied to clipboard');
      setTimeout(() => setCopiedPin(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy PIN/Token');
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
                {(detail.label === 'Pin / Token' || detail.label === 'Serial') && detail.value ? (
                  <View style={styles.pinContainer}>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{detail.value}</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyPin(detail.value)}
                    >
                      <Ionicons name="copy" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.detailValue, { color: theme.text }]}>{detail.value}</Text>
                )}
              </View>
            ))}

            {data.serviceType === 'exampins' && pins.length > 0 && (
              <View style={styles.pinListContainer}>
                <Text style={[styles.pinListTitle, { color: theme.text }]}>Your Pins</Text>
                {pins.map((pinEntry: ExamPinEntry, index: number) => {
                  const pinValue = pinEntry.pin || '';
                  return (
                    <View key={`${pinEntry.name || 'pin'}-${index}`} style={[styles.pinListItem, { borderColor: theme.border, backgroundColor: theme.surfaceVariant }]}>
                      <View style={styles.pinListHeader}>
                        <Text style={[styles.pinListName, { color: theme.text }]}>{pinEntry.name || `PIN ${index + 1}`}</Text>
                        {!!pinEntry.serial && (
                          <Text style={[styles.pinListSerial, { color: theme.textSecondary }]}>Serial: {pinEntry.serial}</Text>
                        )}
                      </View>
                      <View style={styles.pinListValueRow}>
                        <Text style={[styles.pinListValue, { color: theme.text }]} numberOfLines={1} selectable>
                          {pinValue}
                        </Text>
                        {pinValue ? (
                          <TouchableOpacity style={styles.copyButton} onPress={() => handleCopyPin(pinValue)}>
                            <Ionicons name="copy" size={16} color={theme.primary} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Status */}
            {data.status && (
              <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: data.status === 'completed' || data.status === 'success' ? '#10B981' : '#F59E0B' }]}>
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
              onPress={shareReceipt}
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
        </View>

        {/* Hidden Receipt Template for Sharing */}
        <View style={styles.hiddenTemplate}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
            <ShareReceiptTemplate 
              transaction={{
                serviceType: data.serviceType,
                amount: data.amount,
                recipient: data.recipient,
                network: data.network,
                status: data.status || 'completed',
                transactionId: data.transactionId || 'N/A',
                timestamp: data.timestamp || new Date().toISOString(),
                meterNumber: data.meterNumber,
                disco: data.provider,
                plan: data.planName,
              }} 
            />
          </ViewShot>
        </View>
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
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pinListContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  pinListTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  pinListItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  pinListHeader: {
    marginBottom: 10,
  },
  pinListName: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinListSerial: {
    fontSize: 12,
    marginTop: 4,
  },
  pinListValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pinListValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
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
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  copyButton: {
    padding: 6,
    borderRadius: 6,
  },
  hiddenTemplate: {
    position: 'absolute',
    left: -1000, // Move off-screen
    top: 0,
    zIndex: -1,
    opacity: 0,
  },
});

export default SuccessScreen;
