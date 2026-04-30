// src/screens/TransactionsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
interface Transaction {
  id: string;
  transaction_reference: string;
  service_type: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  recipient?: string;
  metadata?: any;
}

const TransactionsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchTransactions = async () => {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.post('/transactions/all', params);
      if (response.success && response.data) {
        setTransactions((response.data as any).data.transactions || []);
      }
    } catch (err) {
      console.error('Transactions fetch error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter, startDate, endDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    // For now, we'll assume credit/debit based on amount sign
    // You might want to adjust this based on your transaction type logic
    if (filter === 'credit') return t.amount > 0;
    if (filter === 'debit') return t.amount < 0;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#047603';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return theme.textSecondary;
    }
  };

  const getTransactionIcon = (amount: number) => {
    return amount > 0 ? 'arrow-down' : 'arrow-up';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.container}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Transactions</Text>
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
            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              {(['all', 'credit', 'debit'] as const).map((f) => (
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
                    {f === 'all'
                      ? 'All'
                      : f === 'credit'
                      ? 'Incoming'
                      : 'Outgoing'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Filters */}
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={[styles.filterToggleText, { color: theme.primary }]}>
                {showFilters ? 'Hide Filters' : 'Show Date Filters'}
              </Text>
              <Ionicons
                name={showFilters ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.primary}
              />
            </TouchableOpacity>

            {showFilters && (
              <View style={styles.dateFilters}>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateLabel, { color: theme.text }]}>Start Date</Text>
                  <TextInput
                    style={[styles.dateInput, { borderColor: theme.border, color: theme.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.dateLabel, { color: theme.text }]}>End Date</Text>
                  <TextInput
                    style={[styles.dateInput, { borderColor: theme.border, color: theme.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textSecondary}
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>
            )}

            {/* Transactions List */}
            {filteredTransactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {filteredTransactions.map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={[
                      styles.transactionCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.txIconContainer}>
                      <View
                        style={[
                          styles.txIcon,
                          {
                            backgroundColor: `${theme.primary}20`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getTransactionIcon(tx.amount) as any}
                          size={20}
                          color={
                            tx.amount > 0
                              ? '#047603'
                              : '#ef4444'
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.txDetails}>
                      <Text
                        style={[
                          styles.txDescription,
                          { color: theme.text },
                        ]}
                      >
                        {tx.service_type || 'Transaction'}
                      </Text>
                      <View style={styles.txMeta}>
                        <Text
                          style={[
                            styles.txDate,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {formatDate(tx.created_at)}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: `${getStatusColor(
                                tx.status
                              )}20`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(tx.status) },
                            ]}
                          >
                            {tx.status.charAt(0).toUpperCase() +
                              tx.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            tx.amount > 0
                              ? '#047603'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {tx.amount > 0 ? '+' : '-'}₦
                      {Math.abs(tx.amount).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-outline"
                  size={48}
                  color={theme.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.textSecondary },
                  ]}
                >
                  No transactions yet
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
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  transactionsList: {
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  txIconContainer: {
    marginRight: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txDate: {
    fontSize: 12,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
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
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  dateFilters: {
    marginBottom: 16,
  },
  dateInputContainer: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
});

export default TransactionsScreen;

