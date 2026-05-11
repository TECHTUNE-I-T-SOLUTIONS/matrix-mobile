// src/navigation/types.ts
export type RootStackParamList = {
  Splash: undefined;
  Auth: { screen?: keyof AuthStackParamList; params?: undefined } | undefined;
  Onboarding: undefined;
  AuthChoice: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  KYC: undefined;
  AuthResume: undefined;
  Main: undefined;
  Services: undefined;
  Airtime: undefined;
  Data: undefined;
  Electricity: undefined;
  CableTV: undefined;
  ExamPins: undefined;
  Internet: undefined;
  Betting: undefined;
  InternationalBills: undefined;
  Wallet: undefined;
  Transactions: undefined;
  Notifications: undefined;
  Profile: undefined;
  Settings: undefined;
  Support: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  PinSettings: undefined;
  Success: { data: { serviceType: string; amount: number; recipient?: string; planName?: string; transactionId?: string; network?: string; provider?: string; meterNumber?: string; meterType?: string; quantity?: number; status?: string; timestamp?: string } };
  Referrals: undefined;
  TransactionDetails: { transaction: any };
};

export type AuthStackParamList = {
  Onboarding: undefined;
  AuthChoice: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  KYC: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Services: undefined;
  Wallet: undefined;
  Transactions: undefined;
  Notifications: undefined;
  Analytics: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  FundWallet: undefined;
  Services: undefined;
  Airtime: undefined;
  Data: undefined;
  Electricity: undefined;
  CableTV: undefined;
  ExamPins: undefined;
  Internet: undefined;
  Betting: undefined;
  InternationalBills: undefined;
  Wallet: undefined;
  Transactions: undefined;
  Notifications: undefined;
  Profile: undefined;
  Settings: undefined;
  Support: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  PinSettings: undefined;
  Referrals: undefined;
  Success: { data: { serviceType: string; amount: number; recipient?: string; planName?: string; transactionId?: string; network?: string; provider?: string; meterNumber?: string; meterType?: string; quantity?: number; status?: string; timestamp?: string } };
  TransactionDetails: { transaction: any };
  Rewards: undefined;
  ReferralProgress: undefined;
  PriceComparison: undefined;
  SpendAnalytics: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}