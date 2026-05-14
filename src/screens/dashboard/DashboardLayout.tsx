import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, DashboardStackParamList } from '../../navigation/types';
import CustomBottomNavigation from '../../components/CustomBottomNavigation';
import FloatingSupportButton from '../../components/FloatingSupportButton';
import DashboardScreen from './DashboardScreen';
import FundWalletScreen from './FundWalletScreen';
import ServicesScreen from './ServicesScreen';
import AirtimeScreen from './AirtimeScreen';
import DataScreen from './DataScreen';
import ElectricityScreen from './ElectricityScreen';
import CableTVScreen from './CableTVScreen';
import ExamPinsScreen from './ExamPinsScreen';
import InternetScreen from './InternetScreen';
import BettingScreen from './BettingScreen';
import InternationalBillsScreen from './InternationalBillsScreen';
import AirtimeToWalletScreen from './AirtimeToWalletScreen';
import BulkSmsScreen from './BulkSmsScreen';
import WalletScreen from './WalletScreen';
import TransactionsScreen from './TransactionsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import NetworkStatusScreen from './NetworkStatusScreen';
import SupportScreen from './SupportScreen';
import AboutScreen from './AboutScreen';
import TermsOfServiceScreen from './TermsOfServiceScreen';
import PrivacyPolicyScreen from './PrivacyPolicyScreen';
import PinSettingsScreen from './PinSettingsScreen';
import ReferralsScreen from './ReferralsScreen';
import SuccessScreen from './SuccessScreen';
import TransactionDetailsScreen from './TransactionDetailsScreen';
import RewardsScreen from './RewardsScreen';
import ReferralProgressScreen from './ReferralProgressScreen';
import PriceComparisonScreen from './PriceComparisonScreen';
import SpendAnalyticsScreen from './SpendAnalyticsScreen';

const DashboardStack = createStackNavigator<DashboardStackParamList>();

type DashboardRouteProp = RouteProp<RootStackParamList, 'Main'> & {
  state?: {
    routes: Array<{ name: keyof DashboardStackParamList }>;
    index: number;
  };
};

type DashboardLayoutProps = {
  route: DashboardRouteProp;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ route }) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top * 0 }]} edges={['left', 'right', 'bottom']}>
      <View style={styles.navigatorContainer}>
        <DashboardStack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
          <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
          <DashboardStack.Screen name="FundWallet" component={FundWalletScreen} />
          <DashboardStack.Screen name="Services" component={ServicesScreen} />
          <DashboardStack.Screen name="Airtime" component={AirtimeScreen} />
          <DashboardStack.Screen name="Data" component={DataScreen} />
          <DashboardStack.Screen name="Electricity" component={ElectricityScreen} />
          <DashboardStack.Screen name="CableTV" component={CableTVScreen} />
          <DashboardStack.Screen name="ExamPins" component={ExamPinsScreen} />
          <DashboardStack.Screen name="Internet" component={InternetScreen} />
          <DashboardStack.Screen name="Betting" component={BettingScreen} />
          <DashboardStack.Screen name="InternationalBills" component={InternationalBillsScreen} />
          <DashboardStack.Screen name="AirtimeToWallet" component={AirtimeToWalletScreen} />
          <DashboardStack.Screen name="BulkSms" component={BulkSmsScreen} />
          <DashboardStack.Screen name="Wallet" component={WalletScreen} />
          <DashboardStack.Screen name="Transactions" component={TransactionsScreen} />
          <DashboardStack.Screen name="Notifications" component={NotificationsScreen} />
          <DashboardStack.Screen name="Profile" component={ProfileScreen} />
          <DashboardStack.Screen name="Settings" component={SettingsScreen} />
          <DashboardStack.Screen name="NetworkStatus" component={NetworkStatusScreen} />
          <DashboardStack.Screen name="Support" component={SupportScreen} />
          <DashboardStack.Screen name="About" component={AboutScreen} />
          <DashboardStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          <DashboardStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <DashboardStack.Screen name="PinSettings" component={PinSettingsScreen} />
          <DashboardStack.Screen name="Referrals" component={ReferralsScreen} />
          <DashboardStack.Screen name="Success" component={SuccessScreen} />
          <DashboardStack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
          <DashboardStack.Screen name="Rewards" component={RewardsScreen} />
          <DashboardStack.Screen name="ReferralProgress" component={ReferralProgressScreen} />
          <DashboardStack.Screen name="PriceComparison" component={PriceComparisonScreen} />
          <DashboardStack.Screen name="SpendAnalytics" component={SpendAnalyticsScreen} />
        </DashboardStack.Navigator>
      </View>
      <CustomBottomNavigation />
      <FloatingSupportButton />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navigatorContainer: {
    flex: 1,
  },
});

export default DashboardLayout;
