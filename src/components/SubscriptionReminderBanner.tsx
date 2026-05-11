// src/components/SubscriptionReminderBanner.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../services/apiClient';

interface Reminder {
  id: string;
  service_type: string;
  remind_at: string;
}

const SubscriptionReminderBanner = () => {
  const { theme, isDark } = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await apiClient.get('/subscription-reminders');
        if (res && res.success && res.data) {
          setReminders((res.data as any).reminders || []);
        } else {
          // Dummy data for visual presentation if API not ready
          setReminders([
            { id: '1', service_type: 'Data Plan', remind_at: new Date(Date.now() + 86400000).toISOString() }
          ]);
        }
      } catch (e) {
        console.warn('Failed to fetch reminders', e);
      }
    };

    fetchReminders();
  }, []);

  if (reminders.length === 0) return null;

  const nextReminder = reminders[0];
  const isDueSoon = new Date(nextReminder.remind_at).getTime() - Date.now() < 86400000; // less than 24 hrs

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDueSoon ? ['#FEF2F2', '#FEE2E2'] : ['#EFF6FF', '#DBEAFE']}
        style={[styles.banner, { borderColor: isDueSoon ? '#F87171' : '#60A5FA' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={[styles.iconContainer, { backgroundColor: isDueSoon ? '#EF4444' : '#3B82F6' }]}>
          <Ionicons name="notifications" size={20} color="#fff" />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDueSoon ? '#991B1B' : '#1E3A8A' }]}>
            Subscription Renewal
          </Text>
          <Text style={[styles.subtitle, { color: isDueSoon ? '#B91C1C' : '#2563EB' }]}>
            Your {nextReminder.service_type} is due soon.
          </Text>
        </View>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDueSoon ? '#EF4444' : '#3B82F6' }]}>
          <Text style={styles.actionText}>Renew</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SubscriptionReminderBanner;
