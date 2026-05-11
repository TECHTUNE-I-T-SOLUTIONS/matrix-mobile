// src/screens/dashboard/SpendAnalyticsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSpendAnalytics } from '../../hooks/useSpendAnalytics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const SpendAnalyticsScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { analytics, loading } = useSpendAnalytics();

  const maxSpend = analytics.length > 0 ? Math.max(...analytics.map(a => a.total_spent)) : 1;

  const totalSpentAll = analytics.reduce((acc, curr) => acc + curr.total_spent, 0);
  const totalCashbackAll = analytics.reduce((acc, curr) => acc + curr.total_cashback, 0);

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
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
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
