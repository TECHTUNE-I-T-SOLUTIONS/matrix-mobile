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

const PrivacyPolicyScreen: React.FC = () => {
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
            <Text style={styles.title}>Privacy Policy</Text>
            <ThemeToggle />
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.heroSection}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="shield" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Privacy Policy
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Last updated: January 2026 | Effective Date: January 21, 2026
            </Text>
          </View>

          {/* Privacy Highlights */}
          <View style={styles.privacyHighlights}>
            <View style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.highlightIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="eye" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.highlightTitle, { color: theme.text }]}>Transparency</Text>
              <Text style={[styles.highlightDesc, { color: theme.textSecondary }]}>
                We're clear about what data we collect and why
              </Text>
            </View>

            <View style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.highlightIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="lock-closed" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.highlightTitle, { color: theme.text }]}>Security</Text>
              <Text style={[styles.highlightDesc, { color: theme.textSecondary }]}>
                Your data is protected with industry-standard security
              </Text>
            </View>

            <View style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.highlightIcon, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="person" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.highlightTitle, { color: theme.text }]}>Control</Text>
              <Text style={[styles.highlightDesc, { color: theme.textSecondary }]}>
                You have control over your personal information
              </Text>
            </View>
          </View>

          {/* Privacy Policy Content */}
          <View style={styles.privacyContent}>
            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Information We Collect</Text>

              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>Personal Information</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We collect information you provide directly to us, such as when you create an account, make a
                transaction, or contact us for support. This includes your name, email address, phone number, and
                payment information.
              </Text>

              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>Transaction Data</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We collect information about your transactions, including the services you purchase, amounts, dates,
                and transaction status to provide our services and maintain records.
              </Text>

              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>Device and Usage Information</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We automatically collect certain information about your device and how you interact with our
                services, including IP address, browser type, operating system, and usage patterns.
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>2. How We Use Your Information</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We use the information we collect to:
              </Text>
              <View style={styles.listContainer}>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Provide, maintain, and improve our services</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Process transactions and send related information</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Send technical notices, updates, security alerts, and support messages</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Respond to your comments, questions, and requests</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Communicate with you about products, services, offers, and events</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Information Sharing</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your
                consent, except as described in this policy. We may share your information in the following circumstances:
              </Text>
              <View style={styles.listContainer}>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• With service providers who assist us in operating our platform</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• When required by law or to protect our rights</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• In connection with a business transfer or acquisition</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• With your explicit consent</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Data Security</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </Text>
              <View style={styles.listContainer}>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Encryption of data in transit and at rest</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Regular security assessments and updates</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Access controls and authentication procedures</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Secure data storage and processing facilities</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Your Rights</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                You have the following rights regarding your personal information:
              </Text>
              <View style={styles.listContainer}>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Access: Request a copy of your personal information</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Rectification: Request correction of inaccurate information</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Erasure: Request deletion of your personal information</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Portability: Request transfer of your data</Text>
                <Text style={[styles.listItem, { color: theme.textSecondary }]}>• Objection: Object to processing of your information</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Cookies and Tracking</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and
                provide personalized content. You can control cookie settings through your browser preferences.
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Changes to This Policy</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                We may update this privacy policy from time to time. We will notify you of any material changes
                via email or through our platform. Your continued use of our services after such changes constitutes
                acceptance of the updated policy.
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Contact Us</Text>
              <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
                If you have any questions about this privacy policy or our data practices, please contact us at:
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
  privacyHighlights: {
    marginBottom: 32,
  },
  highlightCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  highlightDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  privacyContent: {
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

export default PrivacyPolicyScreen;
