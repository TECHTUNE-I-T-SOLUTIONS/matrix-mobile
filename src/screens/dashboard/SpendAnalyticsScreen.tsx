// src/screens/dashboard/SpendAnalyticsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSpendAnalytics } from '../../hooks/useSpendAnalytics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SkeletonLoader } from '../../components/SkeletonLoader';

const SpendAnalyticsScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { analytics, summary, serviceBreakdown, statusBreakdown, topTransactions, loading } = useSpendAnalytics();

  const maxSpend = analytics.length > 0 ? Math.max(...analytics.map(a => a.total_spent)) : 1;

  const totalSpentAll = summary.totalSpent || analytics.reduce((acc, curr) => acc + curr.total_spent, 0);
  const totalCashbackAll = summary.totalCashback || analytics.reduce((acc, curr) => acc + curr.total_cashback, 0);

  const serviceMax = serviceBreakdown.length > 0 ? Math.max(...serviceBreakdown.map((item) => item.amount)) : 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, isDark ? '#111827' : '#f3f4f6']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spend Analytics</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>{totalSpentAll.toLocaleString()}₦</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Cashback</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>+{totalCashbackAll.toLocaleString()}₦</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Spending</Text>
        
        {loading ? (
          <View style={[styles.chartContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.barWrapper}>
                <SkeletonLoader width={28} height={12} marginBottom={8} />
                <SkeletonLoader width={30} height={150} borderRadius={16} />
                <SkeletonLoader width={32} height={12} marginBottom={0} />
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.chartContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            {analytics.map((data, index) => {
              const heightPercent = Math.max((data.total_spent / maxSpend) * 100, 5);
              return (
                <View key={index} style={styles.barWrapper}>
                  <Text style={[styles.barValue, { color: theme.textSecondary }]}>{(data.total_spent / 1000).toFixed(1)}k</Text>
                  <View style={styles.barBackground}>
                    <LinearGradient
                      colors={['#818CF8', '#C7D2FE']}
                      style={[styles.barFill, { height: `${heightPercent}%` }]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.text }]}>{data.month}</Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Service Breakdown</Text>
        {loading ? (
          <View style={[styles.breakdownCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonLoader key={index} width="100%" height={18} marginBottom={16} />
            ))}
          </View>
        ) : (
          <View style={[styles.breakdownCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            {serviceBreakdown.length > 0 ? serviceBreakdown.map((item) => {
              const widthPercent = Math.max((item.amount / serviceMax) * 100, 6)
              return (
                <View key={item.name} style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <Text style={[styles.breakdownLabel, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.breakdownCount, { color: theme.textSecondary }]}>{item.count} tx</Text>
                  </View>
                  <View style={styles.breakdownBarTrack}>
                    <LinearGradient colors={['#10B981', theme.primary]} style={[styles.breakdownBarFill, { width: `${widthPercent}%` }]} />
                  </View>
                  <Text style={[styles.breakdownAmount, { color: theme.text }]}>{item.amount.toLocaleString()}₦</Text>
                </View>
              )
            }) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No service data available yet.</Text>
            )}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Status Breakdown</Text>
        <View style={styles.statusRow}>
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonLoader key={index} width={94} height={78} borderRadius={18} />
            ))
          ) : (
            statusBreakdown.map((item) => (
              <View key={item.name} style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.statusValue, { color: theme.text }]}>{item.count}</Text>
                <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{item.name}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Transactions</Text>
        {loading ? (
          <View style={[styles.topListCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonLoader key={index} width="100%" height={54} marginBottom={12} />
            ))}
          </View>
        ) : (
          <View style={[styles.topListCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            {topTransactions.length > 0 ? topTransactions.map((tx) => (
              <View key={tx.reference} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Text style={[styles.txService, { color: theme.text }]}>{tx.service}</Text>
                  <Text style={[styles.txMeta, { color: theme.textSecondary }]}>{tx.reference}</Text>
                  <Text style={[styles.txMeta, { color: theme.textSecondary }]}>{tx.date}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: theme.text }]}>{tx.amount.toLocaleString()}₦</Text>
                  <Text style={[styles.txStatus, { color: tx.status === 'success' || tx.status === 'completed' ? '#10B981' : '#F59E0B' }]}>{tx.status}</Text>
                </View>
              </View>
            )) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transaction history available.</Text>
            )}
          </View>
        )}

        <View style={styles.insightsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <View style={styles.insightIconWrapper}>
              <Ionicons name="trending-down" size={24} color="#10B981" />
            </View>
            <View style={styles.insightTextWrapper}>
              <Text style={[styles.insightTitle, { color: '#10B981' }]}>Great savings!</Text>
              <Text style={[styles.insightDesc, { color: theme.textSecondary }]}>
                You saved {totalCashbackAll.toLocaleString()}₦ from cashback rewards this period.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 250,
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  breakdownCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 10,
    marginBottom: 8,
  },
  barBackground: {
    width: 30,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 15,
    justifyContent: 'flex-end',
    marginBottom: 12,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 15,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownRow: {
    marginBottom: 14,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownCount: {
    fontSize: 12,
  },
  breakdownBarTrack: {
    height: 10,
    backgroundColor: 'rgba(148,163,184,0.18)',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  breakdownAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statusCard: {
    minWidth: 96,
    flex: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  topListCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  txLeft: {
    flex: 1,
    paddingRight: 12,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txService: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  txMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
  },
  insightsSection: {
    marginTop: 10,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  insightIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightTextWrapper: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SpendAnalyticsScreen;
