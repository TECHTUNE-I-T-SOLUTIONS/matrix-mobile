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
        const payload = res.data as any;
        const apiPlans = Array.isArray(payload.plans)
          ? payload.plans
          : Array.isArray(payload.comparisons)
            ? payload.comparisons.flatMap((comparison: any) =>
                (comparison.options || []).map((option: any) => ({
                  id: option.id || `${comparison.planName}-${option.network}`,
                  network: option.network || 'UNKNOWN',
                  plan_name: comparison.planName || option.name || 'Plan',
                  price: Number(option.price ?? option.amount ?? 0),
                  validity: option.validity || option.alias || comparison.planName || '',
                }))
              )
            : [];

        if (apiPlans.length > 0) {
          setPlans(apiPlans);
        } else {
          setPlans([
            { id: '1', network: 'MTN', plan_name: '10GB', price: 3500, validity: '30 Days' },
            { id: '2', network: 'AIRTEL', plan_name: '10GB', price: 3000, validity: '30 Days' },
            { id: '3', network: 'GLO', plan_name: '10GB', price: 2800, validity: '30 Days' },
            { id: '4', network: 'MTN', plan_name: '1.5GB', price: 1000, validity: '30 Days' },
            { id: '5', network: 'AIRTEL', plan_name: '1.5GB', price: 1000, validity: '30 Days' },
            { id: '6', network: 'GLO', plan_name: '1.5GB', price: 1000, validity: '30 Days' },
          ]);
        }
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
