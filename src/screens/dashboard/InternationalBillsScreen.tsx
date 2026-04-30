// src/screens/dashboard/InternationalBillsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';

const INTERNATIONAL_SERVICES = [
  { id: 'google-play', name: 'Google Play', description: 'Gift Cards & Credits', color: '#4285F4' },
  { id: 'steam', name: 'Steam', description: 'Gaming Credits', color: '#171A21' },
  { id: 'amazon', name: 'Amazon', description: 'Gift Cards', color: '#FF9900' },
  { id: 'itunes', name: 'iTunes', description: 'App Store & Music', color: '#007AFF' },
  { id: 'netflix', name: 'Netflix', description: 'Streaming Subscription', color: '#E50914' },
  { id: 'spotify', name: 'Spotify', description: 'Music Subscription', color: '#1DB954' },
];

const InternationalBillsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [selectedService, setSelectedService] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedService || !recipientEmail || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (parseFloat(amount) < 10) {
      Alert.alert('Error', 'Minimum amount is ₦10');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/international-bills', {
        service: selectedService,
        recipient_email: recipientEmail,
        amount: parseFloat(amount),
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'International bill payment successful!',
          [
            {
              text: 'View Receipt',
              onPress: () => navigation.navigate('Success', {
                data: {
                  serviceType: 'international',
                  amount: parseFloat(amount),
                  recipient: recipientEmail,
                  provider: selectedService,
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
              <Ionicons name="earth" size={32} color="white" />
            </View>
            <Text style={styles.serviceTitle}>International Bills</Text>
            <Text style={styles.serviceDescription}>
              Pay for Google Play, Steam, Amazon, iTunes, Netflix, Spotify
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Select Service</Text>

          {/* Service Selection */}
          <View style={styles.serviceGrid}>
            {INTERNATIONAL_SERVICES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: selectedService === service.id ? service.color : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setSelectedService(service.id)}
              >
                <Text
                  style={[
                    styles.serviceName,
                    {
                      color: selectedService === service.id ? '#ffffff' : theme.text,
                    },
                  ]}
                >
                  {service.name}
                </Text>
                <Text
                  style={[
                    styles.serviceCardDescription,
                    {
                      color: selectedService === service.id ? 'rgba(255,255,255,0.8)' : theme.textSecondary,
                    },
                  ]}
                >
                  {service.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recipient Email */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Recipient Email</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="recipient@example.com"
              placeholderTextColor={theme.textSecondary}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount (₦)</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="1000"
              placeholderTextColor={theme.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              The gift card or credit will be sent to the recipient's email address. Make sure the email address is correct.
            </Text>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: theme.primary }]}
            onPress={handlePurchase}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.purchaseText}>Processing...</Text>
            ) : (
              <Text style={styles.purchaseText}>Purchase International Bill</Text>
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
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  serviceCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceCardDescription: {
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  purchaseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InternationalBillsScreen;
