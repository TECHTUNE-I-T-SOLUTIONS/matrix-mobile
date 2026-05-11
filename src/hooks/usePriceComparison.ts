// src/hooks/usePriceComparison.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export interface PricePlan {
  id: string;
  network: string; // 'MTN' | 'AIRTEL' | 'GLO'
  plan_name: string; // e.g. '10GB'
  price: number;
  validity: string; // e.g. '30 Days'
}

export const usePriceComparison = () => {
  const [plans, setPlans] = useState<PricePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/price-comparison');
      if (res && res.success && res.data) {
        setPlans((res.data as any).plans || []);
      } else {
        // Fallback mock data if API is not fully ready
        setPlans([
          { id: '1', network: 'MTN', plan_name: '10GB', price: 3500, validity: '30 Days' },
          { id: '2', network: 'AIRTEL', plan_name: '10GB', price: 3000, validity: '30 Days' },
          { id: '3', network: 'GLO', plan_name: '10GB', price: 2800, validity: '30 Days' },
          { id: '4', network: 'MTN', plan_name: '1.5GB', price: 1000, validity: '30 Days' },
          { id: '5', network: 'AIRTEL', plan_name: '1.5GB', price: 1000, validity: '30 Days' },
          { id: '6', network: 'GLO', plan_name: '1.5GB', price: 1000, validity: '30 Days' },
        ]);
      }
    } catch (e) {
      console.warn('Failed to fetch price comparisons', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return { plans, loading, fetchPlans };
};
