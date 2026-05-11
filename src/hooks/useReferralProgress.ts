// src/hooks/useReferralProgress.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export interface ReferredUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  referralCodeUsed?: string;
  status: 'pending' | 'wallet_funded' | 'counted';
  walletFunded: boolean;
  walletFundedAt?: string | null;
  isCounted: boolean;
  fundingRequirement?: number;
  joinedAt: string;
}

export const useReferralProgress = () => {
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [walletFundedCount, setWalletFundedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [minimumFundingAmount, setMinimumFundingAmount] = useState(1000);
  const [bonusUnlocked, setBonusUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/referrals/progress');
      if (res && res.success && res.data) {
        setReferrals((res.data as any).referrals || []);
        setCompletedCount((res.data as any).completedCount || 0);
        setWalletFundedCount((res.data as any).walletFundedCount || 0);
        setTotalCount((res.data as any).totalCount || 0);
        setMinimumFundingAmount((res.data as any).minimumFundingAmount || 1000);
        setBonusUnlocked((res.data as any).bonusUnlocked || false);
      }
    } catch (e) {
      console.warn('Failed to fetch referrals progress', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  return { referrals, completedCount, walletFundedCount, totalCount, minimumFundingAmount, bonusUnlocked, loading, fetchReferrals };
};
