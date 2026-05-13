// src/hooks/useSpendAnalytics.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useSession } from '../contexts/SessionContext';

export interface SpendData {
  month: string;
  total_spent: number;
  total_cashback: number;
  total_discounts: number;
  transactionCount?: number;
}

export interface ServiceBreakdownItem {
  name: string;
  count: number;
  amount: number;
}

export interface StatusBreakdownItem {
  name: string;
  count: number;
}

export interface TopTransactionItem {
  reference: string;
  service: string;
  amount: number;
  date: string;
  status: string;
}

export interface SpendAnalyticsSummary {
  totalSpent: number;
  totalCashback: number;
  totalTransactions: number;
  averageSpendPerMonth: number;
}

export interface CombinedSpendAnalytics {
  monthly: SpendData[];
  summary: SpendAnalyticsSummary;
  serviceBreakdown: ServiceBreakdownItem[];
  statusBreakdown: StatusBreakdownItem[];
  topTransactions: TopTransactionItem[];
}

export const useSpendAnalytics = () => {
  const { session } = useSession();
  const [analytics, setAnalytics] = useState<SpendData[]>([]);
  const [summary, setSummary] = useState<SpendAnalyticsSummary>({
    totalSpent: 0,
    totalCashback: 0,
    totalTransactions: 0,
    averageSpendPerMonth: 0,
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdownItem[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownItem[]>([]);
  const [topTransactions, setTopTransactions] = useState<TopTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      if (!session.isAuthenticated || !session.user?.id) {
        setAnalytics([]);
        setSummary({
          totalSpent: 0,
          totalCashback: 0,
          totalTransactions: 0,
          averageSpendPerMonth: 0,
        });
        setServiceBreakdown([]);
        setStatusBreakdown([]);
        setTopTransactions([]);
        return;
      }

      const [spendRes, analyticsRes, reportsRes, payReportsRes] = await Promise.all([
        apiClient.get('/spend-analytics'),
        apiClient.get('/payscribe/analytics'),
        apiClient.get('/reports?dateRange=30days&type=all'),
        apiClient.get('/payscribe/reports?period=30d'),
      ]);

      const spendData = (spendRes.data as any) || {};
      const monthly = Array.isArray(spendData.analytics) ? spendData.analytics : [];
      setAnalytics(monthly);

      setSummary({
        totalSpent: Number(spendData.totalSpent || 0),
        totalCashback: Number(spendData.totalCashback || 0),
        totalTransactions: Number(spendData.totalTransactions || 0),
        averageSpendPerMonth: Number(spendData.averageSpendPerMonth || 0),
      });

      const analyticsData = (analyticsRes.data as any) || {};
      const serviceBreakdownItems = Array.isArray(analyticsData.serviceBreakdown)
        ? analyticsData.serviceBreakdown.map((item: any) => ({
            name: item.name,
            count: Number(item.count || 0),
            amount: Number(item.amount || 0),
          }))
        : [];
      setServiceBreakdown(serviceBreakdownItems);

      const reportData = (reportsRes.data as any) || {};
      const statusItems = Object.entries(reportData.byStatus || {}).map(([name, count]) => ({
        name,
        count: Number(count || 0),
      }));
      setStatusBreakdown(statusItems);

      const webTop = Array.isArray(reportData.transactions) ? reportData.transactions.slice(0, 5) : [];
      const payTop = Array.isArray((payReportsRes.data as any)?.topTransactions) ? (payReportsRes.data as any).topTransactions : [];
      const mergedTop = webTop.length > 0 ? webTop : payTop;
      setTopTransactions(
        mergedTop.map((tx: any) => ({
          reference: tx.reference || tx.transaction_reference || tx.id || 'N/A',
          service: tx.service || tx.type || tx.service_type || 'transaction',
          amount: Number(tx.amount || 0),
          date: tx.date || new Date(tx.created_at || Date.now()).toISOString().split('T')[0],
          status: tx.status || 'pending',
        }))
      );
    } catch (e) {
      console.warn('Failed to fetch spend analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [session.isAuthenticated, session.user?.id]);

  return { analytics, summary, serviceBreakdown, statusBreakdown, topTransactions, loading, fetchAnalytics };
};
