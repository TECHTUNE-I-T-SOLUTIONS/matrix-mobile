import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

const quickLinks = [
  { label: 'Dashboard', icon: 'home', route: 'Dashboard' },
  { label: 'Services', icon: 'grid', route: 'Services' },
  { label: 'Wallet', icon: 'wallet', route: 'Wallet' },
  { label: 'Transactions', icon: 'time', route: 'Transactions' },
  { label: 'Referrals', icon: 'people', route: 'Referrals' },
  { label: 'Rewards', icon: 'gift', route: 'Rewards' },
  { label: 'Support', icon: 'help-circle', route: 'Support' },
  { label: 'Profile', icon: 'person', route: 'Profile' },
];

const sections = [
  {
    title: 'What Matrix Means',
    body:
      'Matrix is a connected digital system built to bring your everyday financial and service needs into one clean, organized experience. The word “Matrix” reflects a network of linked actions: you can top up airtime, buy data, pay bills, manage a wallet, track transactions, and earn from referrals without leaving the app. The goal is not just convenience, but a sense of flow. Everything is designed to feel like it belongs to one ecosystem, where the parts talk to each other, balances stay in sync, and the important things you need are always close at hand. Matrix is meant to feel like a dependable digital layer for modern life.',
    route: 'Dashboard',
    cta: 'Open Dashboard',
  },
  {
    title: 'Dashboard',
    body:
      'The Dashboard is your home base. It gives you a live summary of your account, your balance, quick access to the most-used services, recent activity, announcements, reminders, and important shortcuts. If you want to know what is happening in your account at a glance, this is the first place to check. It is built to answer the questions users ask most often: How much do I have? What can I do next? What changed recently? The dashboard brings those answers together so you can move quickly without hunting through menus.',
    route: 'Dashboard',
    cta: 'Go to Dashboard',
  },
  {
    title: 'Services',
    body:
      'The Services screen is the action center of Matrix. It groups your everyday needs into clear categories so you can find what you want quickly. Airtime, data, electricity, cable TV, exam pins, internet services, international bills, airtime-to-wallet, and more are all arranged here so the app feels familiar even when the service itself is different. The page is meant to be practical and simple: open it, choose a service, and complete the task. The service cards are not just decorative; they are the main gateway into the tools that make Matrix useful every day.',
    route: 'Services',
    cta: 'Open Services',
  },
  {
    title: 'Wallet',
    body:
      'The Wallet is where your stored value and financial activity come together. It shows your balance, card features, payout tools, virtual account details, funding history, spending patterns, and other related financial tools. It is the place users visit when they want clarity on how much is available, how much has been spent, and what can be moved out or used for another purchase. The wallet is designed to be transparent. You should be able to see your money, understand it, and act on it with confidence.',
    route: 'Wallet',
    cta: 'Open Wallet',
  },
  {
    title: 'Transactions',
    body:
      'The Transactions screen keeps a detailed record of the things you have done inside Matrix. This includes completed purchases, pending actions, debits, credits, payouts, and other service interactions. Transaction history matters because it gives you accountability and peace of mind. If a user wants to confirm whether a payment happened, review a receipt, check a status, or share evidence with support, the transaction log is the first reference point. It turns the app into something traceable and trustworthy rather than temporary and forgettable.',
    route: 'Transactions',
    cta: 'View Transactions',
  },
  {
    title: 'Profile',
    body:
      'The Profile screen is where your identity inside Matrix comes together. It shows who you are, your account status, your KYC progress, your referral code, your usage summary, and your personal settings entry points. The profile area is also where you can reach a lot of the account-level tools that do not belong inside a specific service flow. This includes app information, support access, settings, security-related controls, and other personal account actions. Think of it as your control room for the whole app.',
    route: 'Profile',
    cta: 'Open Profile',
  },
  {
    title: 'Why We Collect KYC',
    body:
      'KYC stands for Know Your Customer. We collect it to protect your account, reduce fraud, help secure high-risk or high-value actions, and make it easier to recover access when needed. Identity information also helps us keep the platform organized and improve trust across the ecosystem. In a digital platform that handles value, identity matters. It helps us confirm that a user is really the owner of the account, prevents abuse, supports regulatory responsibility, and allows us to unlock more features safely when needed. The purpose is protection, continuity, and reliability.',
    route: 'KYC',
    cta: 'Continue KYC',
  },
  {
    title: 'How Your Data Is Saved',
    body:
      'Your information is stored in a structured way so the app can function properly and your account history remains intact. Profile details help personalize the app. Wallet and transaction records help keep balances accurate and support troubleshooting. Verification data helps maintain account safety and compliance. Service receipts and logs help us show what happened when you made a request. We only keep the data needed to run the service, improve reliability, and support your account. The purpose is not just storage; it is to preserve continuity, accountability, and user confidence.',
    route: 'Support',
    cta: 'Get Support',
  },
  {
    title: 'How You Earn',
    body:
      'Matrix currently gives users two simple ways to earn. The first is referrals. When you invite someone to join and they become active, your network grows and you can benefit from that growth. The second is daily check-in, which rewards consistency and regular engagement. These are intentionally simple starting points, because a platform should reward participation and habit. As Matrix grows, more earning opportunities can be added, but the first principle remains the same: if you stay active and bring others in, the platform should give value back to you.',
    route: 'Rewards',
    cta: 'Open Rewards',
  },
  {
    title: 'Why Matrix Feels Different',
    body:
      'Matrix is designed to reduce friction. You should not have to guess where things are, wonder whether your action worked, or move between disconnected tools just to accomplish a simple task. The interface uses clear sections, visible balances, receipts, notifications, and quick actions so the app stays understandable even as it grows. This makes the experience feel more like one continuous environment and less like a collection of unrelated screens. The aim is a platform that feels dependable, responsive, and easy to return to every day.',
    route: 'Dashboard',
    cta: 'Return Home',
  },
];

const AboutScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInner}>
          <View style={styles.heroIcon}>
            <Ionicons name="information-circle" size={36} color="white" />
          </View>
          <Text style={styles.title}>About Matrix</Text>
          <Text style={styles.subtitle}>
            A detailed guide to the platform, the services it provides, how we protect your account, and how you can get more value from the app.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Shortcuts</Text>
          <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
            Jump straight to the part of the app you want to explore next.
          </Text>
          <View style={styles.linkGrid}>
            {quickLinks.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={[styles.linkChip, { backgroundColor: theme.primary + '14', borderColor: theme.border }]}
                onPress={() => navigation.navigate(item.route)}
              >
                <Ionicons name={item.icon as any} size={16} color={theme.primary} />
                <Text style={[styles.linkChipText, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>{section.body}</Text>
            <TouchableOpacity
              style={[styles.sectionButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate(section.route)}
            >
              <Ionicons name="arrow-forward" size={16} color="white" />
              <Text style={styles.sectionButtonText}>{section.cta}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>A Practical Way to Use Matrix</Text>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            A good way to think about Matrix is as a sequence of simple steps. You open the Dashboard to orient yourself, use Services when you want to perform an action, check Wallet when you want to understand your balance, and open Transactions when you want proof or history. Profile keeps your identity and preferences in order, while Rewards and Referrals help you track the value you can gain from regular use and network growth. Support is there when something needs attention. This is how the product stays simple even as it grows into a wider ecosystem.
          </Text>
          <TouchableOpacity
            style={[styles.sectionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Support')}
          >
            <Ionicons name="help-circle" size={16} color="white" />
            <Text style={styles.sectionButtonText}>Open Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerInner: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 23,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 23,
  },
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  linkChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sectionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AboutScreen;
