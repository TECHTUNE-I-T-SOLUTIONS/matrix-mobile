// src/hooks/useRewards.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export interface RewardTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface SpinResult {
  amount: number;
  newBalance: number;
  nextSpinAt?: string;
}

export const useRewards = () => {
  const [rewardBalance, setRewardBalance] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSpinAt, setLastSpinAt] = useState<string | null>(null);
  const [nextSpinAt, setNextSpinAt] = useState<string | null>(null);
  const [canSpinNow, setCanSpinNow] = useState(true);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get('/rewards');
      
      // Handle double-wrapped response from apiClient
      const responseData = res?.data?.data || res?.data;
      
      if (res && res.success && responseData) {
        const balance = responseData.balance || 0;
        setRewardBalance(balance);
        setTotalReward(responseData.totalReward || 0);
        setTransactions(responseData.transactions || []);
        setLastSpinAt(responseData.lastSpinAt || null);
        setNextSpinAt(responseData.nextSpinAt || null);
        setCanSpinNow(responseData.canSpinNow ?? true);
      } else {
        console.warn('[useRewards] Invalid response format');
      }
    } catch (e) {
      console.error('[useRewards] Failed to fetch rewards:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const spinReward = useCallback(async (amount?: number): Promise<SpinResult | 0> => {
    try {
      // Check if user can spin
      if (!canSpinNow) {
        console.warn('Cannot spin - already spun today');
        return 0;
      }

      const res: any = await apiClient.post('/rewards/spin', { amount });
      
      if (res && res.success) {
        // Handle double-wrapped response from apiClient
        const responseData = res?.data?.data || res?.data;
        
        // Immediately update state with the response
        const amount = responseData?.amount || 0;
        const newBalance = responseData?.newBalance || 0;
        const nextSpin = responseData?.nextSpinAt;

        setRewardBalance(newBalance);
        setTotalReward((prev) => prev + amount);
        setCanSpinNow(false);
        setNextSpinAt(new Date(nextSpin).toISOString());
        setLastSpinAt(new Date().toISOString());

        // Also refresh full data after a slight delay to get DB updates
        fetchRewards();

        return { amount, newBalance, nextSpinAt: nextSpin };
      }
      return 0;
    } catch (e: any) {
      console.warn('Failed to spin', e);
      // Check if error is "already spun today"
      if (e?.response?.data?.error?.includes('already spun')) {
        setCanSpinNow(false);
      }
      return 0;
    }
  }, [canSpinNow, fetchRewards]);

  useEffect(() => {
    fetchRewards();
  }, []);

  return { rewardBalance, totalReward, transactions, loading, spinReward, fetchRewards, lastSpinAt, nextSpinAt, canSpinNow };
};
