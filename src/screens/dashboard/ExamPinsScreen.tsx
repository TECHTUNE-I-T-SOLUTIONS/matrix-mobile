// src/screens/dashboard/ExamPinsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';
import { useWalletBalance } from '../../contexts/WalletBalanceContext';

interface ExamPin {
  id: string;
  product_code?: string;
  name: string;
  amount: number;
  description: string;
  available: boolean;
  renderKey: string;
}

const EXAM_TYPES = [
  { id: 'waec', name: 'WAEC', description: 'West African Examinations Council' },
  { id: 'neco', name: 'NECO', description: 'National Examinations Council' },
  { id: 'jamb', name: 'JAMB', description: 'Joint Admissions and Matriculation Board' },
  { id: 'nabteb', name: 'NABTEB', description: 'National Business and Technical Examinations Board' },
];

const ExamPinsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { walletBalance, refreshBalance } = useWalletBalance();
  const [selectedExam, setSelectedExam] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [examPins, setExamPins] = useState<ExamPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<ExamPin | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);
  const [jambAccount, setJambAccount] = useState('');
  const [phone, setPhone] = useState('');
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
    if (selectedExam) {
      fetchExamPins();
    }
  }, [selectedExam]);

  useEffect(() => {
    refreshBalance().catch((error) => {
      console.error('Failed to refresh wallet balance:', error);
    });
  }, [refreshBalance]);

  const fetchExamPins = async () => {
    try {
      setLoadingPins(true);
      const response = await apiClient.get('/services/epins');
      if (response.success) {
        const pins = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
        
        // Get valid pin IDs for the selected exam type
        const validPinIds = EXAM_PIN_MAPPING[selectedExam.toLowerCase()] || [];
        
        // Filter pins to only show those matching the selected exam type
        const filteredPins = pins.filter((pin: any) => {
          const pinId = pin.id || pin.product_code;
          return validPinIds.includes(pinId);
        });

        const seenKeys = new Set<string>();
        const mappedPins = filteredPins
          .map((pin: any, index: number) => {
            const id = String(pin.id || pin.product_code || '').trim();
            const productCode = String(pin.product_code || pin.code || pin.id || '').trim();
            const name = String(pin.name || '').trim();
            const amount = parseFloat(pin.amount) || 0;
            const renderKey = [id, productCode, name, amount, index].join('::').toLowerCase();

            return {
              id,
              product_code: productCode,
              name,
              amount,
              description: pin.description || pin.type || selectedExam.toUpperCase(),
              available: pin.available !== false && Number(pin.amount || 0) > 0,
              renderKey,
            };
          })
          .filter((pin: ExamPin) => {
            if (seenKeys.has(pin.renderKey)) return false;
            seenKeys.add(pin.renderKey);
            return true;
          });

        if (mappedPins.length === 0) {
          const examLabel = EXAM_TYPES.find((exam) => exam.id === selectedExam)?.name || selectedExam.toUpperCase();
          setExamPins([
            {
              id: selectedExam,
              product_code: selectedExam,
              name: examLabel,
              amount: 0,
              description: `${examLabel} pin types are currently unavailable. Please check back later.`,
              available: false,
              renderKey: `${selectedExam}-unavailable`,
            },
          ]);
          setSelectedPin(null);
          return;
        }
        
        setExamPins(mappedPins);
        setSelectedPin(null);
      } else {
        showAlert('Error', 'Failed to load exam pins', 'error');
      }
    } catch (error) {
      console.error('Fetch exam pins error:', error);
      showAlert('Error', 'Failed to load exam pins', 'error');
    } finally {
      setLoadingPins(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedExam || !selectedPin || !quantity) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    // Validate JAMB-specific fields
    const isJamb = selectedExam.toLowerCase().includes('jamb') || selectedPin.id.toLowerCase().includes('jamb');
    if (isJamb) {
      if (!jambAccount.trim()) {
        showAlert('Error', 'Please enter your JAMB registration number', 'error');
        return;
      }
      if (!phone.trim()) {
        showAlert('Error', 'Please enter your phone number', 'error');
        return;
      }
      if (phone.trim().length < 10) {
        showAlert('Error', 'Please enter a valid phone number', 'error');
        return;
      }
    }

    const qty = parseInt(quantity);
    if (qty < 1 || qty > 10) {
      showAlert('Error', 'Quantity must be between 1 and 10', 'error');
      return;
    }

    const totalCost = selectedPin.amount * qty;
    if (walletBalance.balance < totalCost) {
      showAlert(
        'Insufficient Balance',
        `You need ₦${totalCost.toLocaleString()} but your wallet has ₦${walletBalance.balance.toLocaleString()}. Please fund your wallet.`,
        'error'
      );
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        epin_type: selectedExam,
        product_code: selectedPin.product_code || selectedPin.id,
        quantity: qty,
      };

      // Add JAMB-specific fields if applicable
      if (isJamb) {
        payload.jamb_account = jambAccount.trim();
        payload.phone = phone.trim();
      }

      const response = await apiClient.post('/services/epins', payload);

      if (response.success) {
        await refreshBalance();
        const purchaseData = (response as any).data || {};
        const returnedPins = Array.isArray(purchaseData.pins) ? purchaseData.pins : [];
        showAlert('Success', 'Exam pins purchase successful!', 'success', [
          {
            text: 'View Receipt',
            onPress: () =>
              navigation.navigate('Success', {
                data: {
                  serviceType: 'exampins',
                  amount: purchaseData.amount || totalCost,
                  planName: `${selectedPin.name} (${qty} pin${qty > 1 ? 's' : ''})`,
                  provider: selectedExam.toUpperCase(),
                  quantity: qty,
                  transactionId: purchaseData.transaction_id || purchaseData.transaction_reference || `TXN_${Date.now()}`,
                  status: purchaseData.status || 'completed',
                  timestamp: new Date().toISOString(),
                  pins: returnedPins,
                  pinTitle: purchaseData.pin_title || selectedPin.name,
                  apiResponse: purchaseData,
                },
              }),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]);
      } else {
        showAlert('Error', response.error || (response.data as any)?.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showAlert('Error', error instanceof Error ? error.message : 'Failed to complete purchase', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <LinearGradient
          colors={[theme.primary, theme.primary + 'DD']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="school" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Exam Pins</Text>
            <Text style={styles.serviceDescription}>
              Purchase WAEC, NECO, JAMB, NABTEB pins
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Select Exam Type</Text>

          {/* Exam Type Selection */}
          <View style={styles.examGrid}>
            {EXAM_TYPES.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.examCard,
                  {
                    backgroundColor: selectedExam === exam.id ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  setSelectedExam(exam.id);
                  setSelectedPin(null); // Reset pin selection when exam type changes
                }}
              >
                <Text
                  style={[
                    styles.examName,
                    {
                      color: selectedExam === exam.id ? '#ffffff' : theme.text,
                    },
                  ]}
                >
                  {exam.name}
                </Text>
                <Text
                  style={[
                    styles.examDescription,
                    {
                      color: selectedExam === exam.id ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                    },
                  ]}
                >
                  {exam.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* JAMB Account Number - Conditional */}
          {selectedExam.toLowerCase().includes('jamb') && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>
                JAMB Registration Number <Text style={{ color: '#ff4444' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                placeholder="e.g., 12345678901"
                placeholderTextColor={theme.textSecondary}
                value={jambAccount}
                onChangeText={setJambAccount}
                keyboardType="numeric"
                editable={!loading}
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Your 11-digit JAMB registration number
              </Text>
            </View>
          )}

          {/* Phone Number - Conditional for JAMB */}
          {selectedExam.toLowerCase().includes('jamb') && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>
                Phone Number <Text style={{ color: '#ff4444' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                placeholder="e.g., 08012345678"
                placeholderTextColor={theme.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
                editable={!loading}
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                Your registered mobile number
              </Text>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Quantity</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="1"
              placeholderTextColor={theme.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              maxLength={2}
              editable={!loading}
            />
          </View>

          {/* Exam Pins */}
          {selectedExam && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Select Pin Type</Text>
              {loadingPins ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Loading exam pins...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pinsScrollView}
                >
                  {examPins.map((pin) => (
                    <TouchableOpacity
                      key={pin.renderKey}
                      style={[
                        styles.pinCard,
                        {
                          backgroundColor: pin.available
                            ? selectedPin?.id === pin.id
                              ? theme.primary
                              : theme.surface
                            : theme.surfaceVariant,
                          borderColor: theme.border,
                          opacity: pin.available ? 1 : 0.75,
                        },
                      ]}
                      onPress={() => {
                        if (!pin.available) {
                          showAlert('Unavailable', `${pin.name} is currently unavailable. Please check back later.`, 'warning');
                          return;
                        }
                        setSelectedPin(pin);
                      }}
                    >
                      {pin.available ? (
                        <>
                          <Text
                            style={[
                              styles.pinName,
                              {
                                color: selectedPin?.id === pin.id ? '#ffffff' : theme.text,
                              },
                            ]}
                          >
                            {pin.name}
                          </Text>
                          <Text
                            style={[
                              styles.pinAmount,
                              {
                                color: selectedPin?.id === pin.id ? '#ffffff' : theme.primary,
                              },
                            ]}
                          >
                            ₦{pin.amount}
                          </Text>
                          <Text
                            style={[
                              styles.pinDescription,
                              {
                                color: selectedPin?.id === pin.id ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                              },
                            ]}
                          >
                            {pin.description}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="time-outline" size={22} color={theme.textSecondary} />
                          <Text style={[styles.pinName, { color: theme.text, marginTop: 8 }]}>Not currently available</Text>
                          <Text style={[styles.pinDescription, { color: theme.textSecondary }]}>Check back later</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Purchase Button */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: theme.primary },
              (!selectedExam || !selectedPin || !quantity || loading || (selectedExam.toLowerCase().includes('jamb') && (!jambAccount || !phone))) && styles.disabledButton,
            ]}
            onPress={handlePurchase}
            disabled={!selectedExam || !selectedPin || !quantity || loading || (selectedExam.toLowerCase().includes('jamb') && (!jambAccount || !phone))}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>Purchase Exam Pins</Text>
            )}
          </TouchableOpacity>
        </View>
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={closeAlert} />
      </ScrollView>
    );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  examGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  examCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  examDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  pinsScrollView: {
    marginBottom: 10,
  },
  pinCard: {
    width: 160,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  pinName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  pinAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  pinDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  purchaseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExamPinsScreen;

// Map exam types to their corresponding pin IDs from Payscribe API
const EXAM_PIN_MAPPING: { [key: string]: string[] } = {
  jamb: ['de', 'utme_mock', 'utme'],
  neco: ['neco'],
  waec: ['waec'],
  nabteb: ['nabteb'],
};
