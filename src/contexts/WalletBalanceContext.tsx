// src/contexts/WalletBalanceContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';

interface WalletBalanceResponse {
  balance: number;
  currency: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
}

interface WalletBalanceContextType {
  walletBalance: WalletBalance;
  refreshBalance: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  clearError: () => void;
}

const WalletBalanceContext = createContext<WalletBalanceContextType | undefined>(undefined);

interface WalletBalanceProviderProps {
  children: ReactNode;
}

export const WalletBalanceProvider: React.FC<WalletBalanceProviderProps> = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    balance: 0,
    currency: 'NGN',
    lastUpdated: new Date().toISOString(),
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    loadStoredBalance();
  }, []);

  const loadStoredBalance = async () => {
    try {
      const stored = await AsyncStorage.getItem('walletBalance');
      if (stored) {
        const parsedBalance = JSON.parse(stored);
        setWalletBalance((prev: WalletBalance) => ({
          ...prev,
          ...parsedBalance,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Failed to load stored balance:', error);
    }
  };

  const saveBalanceToStorage = async (balance: WalletBalance) => {
    try {
      await AsyncStorage.setItem('walletBalance', JSON.stringify(balance));
    } catch (error) {
      console.error('Failed to save balance to storage:', error);
    }
  };

  const refreshBalance = useCallback(async () => {
    setWalletBalance((prev: WalletBalance) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.get<any>('/user/profile');

      if (response.success && response.data) {
        const wallet = response.data.wallet || {};
        const user = response.data.user || {};
        const newBalance: WalletBalance = {
          balance: Number(wallet.balance ?? user.wallet_balance ?? 0),
          currency: wallet.currency || 'NGN',
          lastUpdated: new Date().toISOString(),
          isLoading: false,
          error: null,
        };

        setWalletBalance(newBalance);
        await saveBalanceToStorage(newBalance);
      } else {
        setWalletBalance((prev: WalletBalance) => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to fetch balance',
        }));
      }
    } catch (error) {
      setWalletBalance((prev: WalletBalance) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Network error',
      }));
    }
  }, []);

  const updateBalance = useCallback((newBalance: number) => {
    const updatedBalance: WalletBalance = {
      ...walletBalance,
      balance: newBalance,
      lastUpdated: new Date().toISOString(),
      error: null,
    };

    setWalletBalance(updatedBalance);
    saveBalanceToStorage(updatedBalance);
  }, [walletBalance]);

  const clearError = useCallback(() => {
    setWalletBalance((prev: WalletBalance) => ({ ...prev, error: null }));
  }, []);

  return (
    <WalletBalanceContext.Provider
      value={{
        walletBalance,
        refreshBalance,
        updateBalance,
        clearError,
      }}
    >
      {children}
    </WalletBalanceContext.Provider>
  );
};

export const useWalletBalance = (): WalletBalanceContextType => {
  const context = useContext(WalletBalanceContext);
  if (context === undefined) {
    throw new Error('useWalletBalance must be used within a WalletBalanceProvider');
  }
  return context;
};
