import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import CustomAlert from '../../components/CustomAlert';

const BulkSmsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('Hello from Matrix');
  const [senderId, setSenderId] = useState('Pscribe');
  const [loading, setLoading] = useState(false);
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
  ) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const closeAlert = () => setAlertConfig((c) => ({ ...c, visible: false }));

  const sendSms = async () => {
    if (!to.trim() || !message.trim()) {
      showAlert('Error', 'Please enter recipient numbers and a message', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/sms/bulk', {
        to,
        message,
        sender_id: senderId,
      });

      if (response.success) {
        navigation.navigate('Success', {
          data: {
            serviceType: 'bulk_sms',
            amount: Number((response.data as any)?.amount || 0),
            recipient: to,
            transactionId: (response.data as any)?.trans_id || `SMS_${Date.now()}`,
            status: 'processing',
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        showAlert('Error', response.error || 'Bulk SMS failed', 'error');
      }
    } catch {
      showAlert('Error', 'Failed to send bulk SMS', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubbles" size={32} color="white" />
          <Text style={styles.serviceTitle}>Bulk SMS</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: theme.text }]}>Recipients</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
          value={to}
          onChangeText={setTo}
          placeholder="08123456789, 08098765432"
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
          multiline
        />

        <Text style={[styles.helper, { color: theme.textSecondary }]}>Separate multiple numbers with commas.</Text>

        <Text style={[styles.label, { color: theme.text }]}>Sender ID</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
          value={senderId}
          onChangeText={setSenderId}
          placeholder="Pscribe"
          placeholderTextColor={theme.textSecondary}
        />

        <Text style={[styles.label, { color: theme.text }]}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
          value={message}
          onChangeText={setMessage}
          placeholder="Write your SMS..."
          placeholderTextColor={theme.textSecondary}
          multiline
        />

        <Text style={[styles.helper, { color: theme.textSecondary }]}>{message.length}/160 characters per page</Text>

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.primary }]} onPress={sendSms} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Send SMS</Text>}
        </TouchableOpacity>
      </ScrollView>
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={closeAlert}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingTop: 40, paddingBottom: 24, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minHeight: 140 },
  backButton: { position: 'absolute', left: 20, top: 50 },
  headerContent: { alignItems: 'center', gap: 6 },
  serviceTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  messageInput: { minHeight: 160, textAlignVertical: 'top' },
  helper: { fontSize: 12, marginTop: 2 },
  submitButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default BulkSmsScreen;