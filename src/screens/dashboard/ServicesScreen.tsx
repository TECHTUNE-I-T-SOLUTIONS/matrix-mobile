// src/screens/ServicesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import ThemeToggle from '../../components/ThemeToggle';
import { SkeletonLoader } from '../../components/SkeletonLoader';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  available?: boolean;
  category: string;
}

const ServicesScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchServices = async () => {
    try {
      const response = await apiClient.get('/services/payscribe-bills');
      if (response.success && response.data) {
        setServices((response.data as any).data.services || []);
      }
    } catch (err) {
      console.error('Services fetch error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter((s) => s.category === selectedCategory);

  const categories = ['all', ...new Set(services.map((s) => s.category))];

  const getIconName = (icon: string): string => {
    const iconMap: { [key: string]: string } = {
      'Smartphone': 'phone-portrait',
      'Zap': 'flash',
      'Tv': 'tv',
      'BookOpen': 'book',
      'Wifi': 'wifi',
      'Target': 'radio-button-on',
      'Globe': 'globe',
      'Wallet': 'wallet',
    };
    return iconMap[icon] || 'flash'; // fallback to flash
  };

  const getServiceScreen = (serviceId: string) => {
    const screenMap: { [key: string]: string } = {
      airtime: 'Airtime',
      data: 'Data',
      electricity: 'Electricity',
      cable: 'CableTV',
      epins: 'ExamPins',
      internet: 'Internet',
      betting: 'Betting',
      'international-bills': 'InternationalBills',
      'airtime-to-wallet': 'AirtimeToWallet',
      'bulk-sms': 'BulkSms',
    };
    return screenMap[serviceId] || 'ServiceDetail';
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  return (
    <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.container}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Services</Text>
            <ThemeToggle />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingSkeletonWrap}>
            <View style={[styles.loadingSkeletonHero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <SkeletonLoader width="32%" height={14} marginBottom={12} />
              <SkeletonLoader width="58%" height={24} marginBottom={8} />
              <SkeletonLoader width="72%" height={14} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.loadingCategoryRow}>
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonLoader key={index} width={88} height={34} borderRadius={18} />
              ))}
            </ScrollView>
            <View style={styles.loadingGrid}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} style={[styles.loadingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <SkeletonLoader width={56} height={56} borderRadius={28} marginBottom={12} />
                  <SkeletonLoader width="68%" height={14} marginBottom={8} />
                  <SkeletonLoader width="86%" height={12} />
                </View>
              ))}
            </View>
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
            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryBtn,
                    selectedCategory === category && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && {
                        color: '#ffffff',
                      },
                      selectedCategory !== category && {
                        color: theme.textSecondary,
                      },
                    ]}
                  >
                    {category.charAt(0).toUpperCase() +
                      category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Services Grid */}
            <View style={styles.servicesGrid}>
              {filteredServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    const screenName = getServiceScreen(service.id);
                    navigation.navigate(screenName as any);
                  }}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: theme.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getIconName(service.icon) as any}
                      size={32}
                      color="#ffffff"
                    />
                  </View>
                  <Text
                    style={[
                      styles.serviceName,
                      { color: theme.text },
                    ]}
                  >
                    {service.name}
                  </Text>
                  <Text
                    style={[
                      styles.serviceDesc,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {service.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
  loadingSkeletonWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingSkeletonHero: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  loadingCategoryRow: {
    marginBottom: 18,
    gap: 10,
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loadingCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  disabledCard: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  unavailableBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  unavailableText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ServicesScreen;

