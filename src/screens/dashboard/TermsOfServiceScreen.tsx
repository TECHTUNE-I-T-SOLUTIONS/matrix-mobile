import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

const TermsOfServiceScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <LinearGradient
        colors={[theme.background, theme.surface]}
        style={styles.container}
      >
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.title}>Terms of Service</Text>
            <ThemeToggle />
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.heroSection}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="document-text" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Terms of Service
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Last updated: January 2026 | Effective Date: January 21, 2026
            </Text>
          </View>

          {/* Key Points */}
          <View style={styles.keyPoints}>
            <View style={[styles.keyPointCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.keyPointIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="scale" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.keyPointTitle, { color: theme.text }]}>Fair Terms</Text>
              <Text style={[styles.keyPointDesc, { color: theme.textSecondary }]}>
                Clear and reasonable terms for all users
              </Text>
            </View>

            <View style={[styles.keyPointCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.keyPointIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="warning" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.keyPointTitle, { color: theme.text }]}>Your Responsibilities</Text>
              <Text style={[styles.keyPointDesc, { color: theme.textSecondary }]}>
                What we expect from our users
              </Text>
            </View>

            <View style={[styles.keyPointCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.keyPointIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.keyPointTitle, { color: theme.text }]}>Our Commitment</Text>
              <Text style={[styles.keyPointDesc, { color: theme.textSecondary }]}>
                What you can expect from Matrix
              </Text>
            </View>
          </View>

          {/* Terms Content */}
          <View style={styles.termsContent}>
            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                By accessing and using Matrix services, you accept and agree to be bound by the terms and provision of
                this agreement. If you do not agree to abide by the above, please do not use this service.
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Service Description</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                Matrix provides a digital platform for utility bill payments including but not limited to:
              </Text>
              <View style={styles.listContainer}>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Airtime and data bundle purchases</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Electricity bill payments</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Educational voucher purchases (WAEC, NECO, JAMB, etc.)</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Cable TV subscription renewals</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Money transfers and other financial services</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>3. User Accounts</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>Account Creation</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                You must provide accurate and complete information when creating your account. You are responsible
                for maintaining the confidentiality of your account credentials.
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>Account Security</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                You are responsible for all activities that occur under your account. Notify us immediately of any
                unauthorized use of your account.
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Payment Terms</Text>
              <View style={styles.listContainer}>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• All payments must be made in Nigerian Naira (NGN)</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Transactions are processed in real-time</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Failed transactions will be refunded to your wallet within 24 hours</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Service fees may apply to certain transactions</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Refunds are subject to our refund policy</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Prohibited Uses</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>You may not use our service:</Text>
              <View style={styles.listContainer}>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• For any unlawful purpose or to solicit others to perform unlawful acts</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• To infringe upon or violate our intellectual property rights or the intellectual property rights of others</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• To submit false or misleading information</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Limitation of Liability</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                Matrix shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
                resulting from your use of the service.
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Changes to Terms</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We reserve the right to modify these terms at any time. We will notify users of any material changes
                via email or through our platform. Continued use of the service after such modifications constitutes
                acceptance of the updated terms.
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Contact Information</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                Questions about the Terms of Service should be sent to us at:
              </Text>
              <Text style={[styles.contactInfo, { color: theme.text }]}>Email: matrixtechnology@gmail.com</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  keyPoints: {
    marginBottom: 32,
  },
  keyPointCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  keyPointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  keyPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  keyPointDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsContent: {
    marginBottom: 32,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    paddingLeft: 8,
  },
  contactInfo: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default TermsOfServiceScreen;
