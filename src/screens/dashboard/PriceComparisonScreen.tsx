// src/screens/dashboard/PriceComparisonScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { usePriceComparison, PricePlan } from '../../hooks/usePriceComparison';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const PriceComparisonScreen = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { plans, loading } = usePriceComparison();
  const [selectedSize, setSelectedSize] = useState('10GB');

  const availableSizes = Array.from(new Set(plans.map(p => p.plan_name)));

  const getNetworkColor = (network: string) => {
    switch (network.toUpperCase()) {
      case 'MTN': return '#FBBF24'; // Yellow
      case 'AIRTEL': return '#EF4444'; // Red
      case 'GLO': return '#10B981'; // Green
      default: return theme.primary;
    }
  };

  const renderComparisonCard = (plan: PricePlan, bestPrice: number) => {
    const isBest = plan.price === bestPrice;
    
    return (
      <View key={plan.id} style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
        <View style={[styles.networkIndicator, { backgroundColor: getNetworkColor(plan.network) }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.networkName, { color: getNetworkColor(plan.network) }]}>{plan.network}</Text>
            {isBest && (
              <View style={styles.bestBadge}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.bestBadgeText}>Best Value</Text>
              </View>
            )}
          </View>
          <Text style={[styles.planName, { color: theme.text }]}>{plan.plan_name} - {plan.validity}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.text }]}>{plan.price.toLocaleString()}₦</Text>
            {!isBest && (
              <Text style={styles.differenceText}>+{((plan.price - bestPrice)).toLocaleString()}₦</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const filteredPlans = plans.filter(p => p.plan_name === selectedSize);
  const bestPrice = Math.min(...filteredPlans.map(p => p.price));

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
          <Text style={styles.headerTitle}>Price Comparison</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {availableSizes.map(size => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.filterChip,
                  selectedSize === size ? { backgroundColor: '#fff' } : { backgroundColor: 'rgba(255,255,255,0.2)' }
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedSize === size ? { color: theme.primary } : { color: '#fff' }
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.insightBox}>
          <Ionicons name="bulb-outline" size={24} color={theme.primary} />
          <Text style={[styles.insightText, { color: theme.textSecondary }]}>
            Compare data prices across networks to find the best deals for you.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.comparisonList}>
            {filteredPlans.sort((a, b) => a.price - b.price).map(plan => renderComparisonCard(plan, bestPrice))}
          </View>
        )}
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
  filterContainer: {
    paddingLeft: 20,
  },
  filterScroll: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  comparisonList: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  networkIndicator: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  differenceText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default PriceComparisonScreen;
