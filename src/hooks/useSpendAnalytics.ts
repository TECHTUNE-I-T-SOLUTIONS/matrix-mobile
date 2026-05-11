// src/hooks/useSpendAnalytics.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export interface SpendData {
  month: string;
  total_spent: number;
  total_cashback: number;
  total_discounts: number;
}

export const useSpendAnalytics = () => {
  const [analytics, setAnalytics] = useState<SpendData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/spend-analytics');
      if (res && res.success && res.data) {
        setAnalytics((res.data as any).analytics || []);
      } else {
        // Fallback mock data
        setAnalytics([
          { month: 'Jan', total_spent: 15000, total_cashback: 150, total_discounts: 500 },
          { month: 'Feb', total_spent: 22000, total_cashback: 220, total_discounts: 0 },
          { month: 'Mar', total_spent: 18000, total_cashback: 180, total_discounts: 200 },
          { month: 'Apr', total_spent: 30000, total_cashback: 300, total_discounts: 1000 },
        ]);
      }
    } catch (e) {
      console.warn('Failed to fetch spend analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return { analytics, loading, fetchAnalytics };
};
