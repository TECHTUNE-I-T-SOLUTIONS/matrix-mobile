// src/screens/dashboard/TransactionsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
import { useNavigation } from '@react-navigation/native';

interface Transaction {
  id: string;
  transaction_reference: string;
  service_type: string;
  transaction_type: 'credit' | 'debit' | 'wallet_funding' | 'data' | 'airtime' | 'cable' | 'electricity' | 'tv_subscription' | 'internet' | 'other';
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'completed';
  created_at: string;
  recipient?: string;
  metadata?: any;
}

const TransactionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
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
        // Classify transactions based on service_type if transaction_type is missing
        const rawTransactions = (response.data as any).data.transactions || [];
        const processed = rawTransactions.map((tx: any) => {
          let type = tx.transaction_type?.toLowerCase();
          const service = tx.service_type?.toLowerCase();
          
          // Normalize to 'credit' or 'debit' for the UI filter
          if (service === 'wallet_funding' || service === 'funding' || service === 'credit' || type === 'credit' || type === 'wallet_funding') {
            type = 'credit';
          } else {
            // Airtime, Data, Cable, etc are all debits (outgoing)
            type = 'debit';
          }
          
          return { ...tx, transaction_type: type };
        });
        setTransactions(processed);
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
  }, [startDate, endDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filter === 'all') return true;
      return t.transaction_type === filter;
    });
  }, [transactions, filter]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return theme.textSecondary;
    }
  };

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.transaction_type === 'credit' || tx.transaction_type === 'wallet_funding') return 'arrow-down';
    return 'arrow-up';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="receipt" size={32} color="white" />
          <Text style={styles.title}>Transactions</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.filterBar}>
            <View style={styles.filterButtons}>
              {(['all', 'credit', 'debit'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterBtn,
                    filter === f && { backgroundColor: theme.primary, borderColor: theme.primary },
                    filter !== f && { borderColor: theme.border }
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, { color: filter === f ? '#fff' : theme.textSecondary }]}>
                    {f === 'all' ? 'All' : f === 'credit' ? 'Incoming' : 'Outgoing'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
              <Ionicons name="options-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={[styles.dateFilters, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <View style={styles.dateInputGroup}>
                <TextInput
                  style={[styles.dateInput, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Start: YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={startDate}
                  onChangeText={setStartDate}
                />
                <TextInput
                  style={[styles.dateInput, { borderColor: theme.border, color: theme.text }]}
                  placeholder="End: YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>
          )}

          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {filteredTransactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {filteredTransactions.map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={[styles.transactionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => (navigation as any).navigate('TransactionDetails', { transaction: tx })}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: tx.transaction_type === 'credit' ? '#10B98115' : '#EF444415' }]}>
                      <Ionicons
                        name={getTransactionIcon(tx)}
                        size={20}
                        color={tx.transaction_type === 'credit' ? '#10B981' : '#EF4444'}
                      />
                    </View>
                    <View style={styles.txDetails}>
                      <Text style={[styles.txService, { color: theme.text }]}>{tx.service_type?.toUpperCase() || 'TRANSACTION'}</Text>
                      <Text style={[styles.txDate, { color: theme.textSecondary }]}>{formatDate(tx.created_at)}</Text>
                    </View>
                    <View style={styles.txAmount}>
                      <Text style={[styles.txAmountText, { color: tx.transaction_type === 'credit' ? '#10B981' : '#EF4444' }]}>
                        {tx.transaction_type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </Text>
                      <Text style={[styles.txStatus, { color: getStatusColor(tx.status) }]}>{tx.status}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, alignItems: 'center', height: 160, justifyContent: 'center' },
  backButton: { position: 'absolute', left: 20, top: 60 },
  headerContent: { alignItems: 'center', gap: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { flexDirection: 'row', padding: 15, alignItems: 'center', gap: 10 },
  filterButtons: { flex: 1, flexDirection: 'row', gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  filterText: { fontSize: 13, fontWeight: 'bold' },
  filterToggle: { padding: 8 },
  dateFilters: { padding: 15, borderBottomWidth: 1 },
  dateInputGroup: { flexDirection: 'row', gap: 10 },
  dateInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 12 },
  content: { flex: 1, paddingHorizontal: 15 },
  transactionsList: { gap: 10, padding: 15 },
  transactionItem: { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txDetails: { flex: 1 },
  txService: { fontSize: 14, fontWeight: 'bold' },
  txDate: { fontSize: 12, marginTop: 2 },
  txAmount: { alignItems: 'flex-end' },
  txAmountText: { fontSize: 16, fontWeight: 'bold' },
  txStatus: { fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize', marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 10 },
  emptyText: { fontSize: 16 },
});

export default TransactionsScreen;
