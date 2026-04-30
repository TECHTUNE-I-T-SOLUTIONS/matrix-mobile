// src/screens/NotificationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

const NotificationsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      if (response.success && response.data) {
        setNotifications((response.data as any).notifications || []);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#047603';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return theme.primary;
    }
  };

  return (
    <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.container}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Notifications</Text>
            <ThemeToggle />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
          >
            {/* Filter */}
            <View style={styles.filterContainer}>
              {(['all', 'unread'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterBtn,
                    filter === f && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === f && { color: '#ffffff' },
                      filter !== f && { color: theme.textSecondary },
                    ]}
                  >
                    {f === 'all' ? 'All' : 'Unread'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notifications List */}
            {filteredNotifications.length > 0 ? (
              <View style={styles.notificationsList}>
                {filteredNotifications.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.notificationCard,
                      {
                        backgroundColor: notif.is_read
                          ? theme.surface
                          : `${getNotificationColor(
                              notif.type
                            )}15`,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: `${getNotificationColor(
                          notif.type
                        )}20`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={getNotificationIcon(notif.type) as any}
                        size={24}
                        color={getNotificationColor(notif.type)}
                      />
                    </View>

                    <View style={styles.notifDetails}>
                      <Text
                        style={[
                          styles.notifTitle,
                          { color: theme.text },
                          !notif.is_read && { fontWeight: '700' },
                        ]}
                      >
                        {notif.title}
                      </Text>
                      <Text
                        style={[
                          styles.notifMessage,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {notif.message}
                      </Text>
                      <Text
                        style={[
                          styles.notifDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {new Date(notif.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    {!notif.is_read && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: theme.primary,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-outline"
                  size={48}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {filter === 'unread'
                    ? 'No unread notifications'
                    : 'No notifications'}
                </Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </LinearGradient>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  notificationsList: {
    marginBottom: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  notifDetails: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 12,
    marginBottom: 4,
  },
  notifDate: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});

export default NotificationsScreen;

