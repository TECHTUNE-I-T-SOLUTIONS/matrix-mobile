// src/screens/dashboard/ExamPinsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';

interface ExamPin {
  id: string;
  name: string;
  amount: number;
  description: string;
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
  const [selectedExam, setSelectedExam] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [examPins, setExamPins] = useState<ExamPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<ExamPin | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);

  useEffect(() => {
    if (selectedExam) {
      fetchExamPins();
    }
  }, [selectedExam]);

  const fetchExamPins = async () => {
    try {
      setLoadingPins(true);
      const response = await apiClient.get(`/epins/${selectedExam}`);
      if (response.success) {
        setExamPins((response.data as ExamPin[]) || []);
      } else {
        Alert.alert('Error', 'Failed to load exam pins');
      }
    } catch (error) {
      console.error('Fetch exam pins error:', error);
      Alert.alert('Error', 'Failed to load exam pins');
    } finally {
      setLoadingPins(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedExam || !selectedPin || !quantity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const qty = parseInt(quantity);
    if (qty < 1 || qty > 10) {
      Alert.alert('Error', 'Quantity must be between 1 and 10');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/exam-pins/vend', {
        id: selectedExam,
        qty: qty,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Exam pins purchase successful!',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'exampins',
                  amount: selectedPin.amount * qty,
                  planName: `${selectedPin.name} (${qty} pin${qty > 1 ? 's' : ''})`,
                  provider: selectedExam.toUpperCase(),
                  quantity: qty,
                  transactionId: (response as any).transactionId || (response as any).data?.reference || `TXN_${Date.now()}`,
                  status: (response as any).status || 'completed',
                  timestamp: new Date().toISOString(),
                  ...(response as any).data && { apiResponse: (response as any).data },
                }
              })
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to complete purchase');
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
                onPress={() => setSelectedExam(exam.id)}
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
                      key={pin.id}
                      style={[
                        styles.pinCard,
                        {
                          backgroundColor: selectedPin?.id === pin.id ? theme.primary : theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => setSelectedPin(pin)}
                    >
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
              (!selectedExam || !selectedPin || !quantity || loading) && styles.disabledButton,
            ]}
            onPress={handlePurchase}
            disabled={!selectedExam || !selectedPin || !quantity || loading}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>Purchase Exam Pins</Text>
            )}
          </TouchableOpacity>
        </View>
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
