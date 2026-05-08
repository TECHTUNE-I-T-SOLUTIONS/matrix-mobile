// src/screens/dashboard/SupportScreen.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '../../contexts/SessionContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

interface ContactMethod {
  icon: string;
  title: string;
  description: string;
  action: string;
  available: string;
  type: 'whatsapp' | 'phone' | 'email' | 'group';
}

interface FAQ {
  question: string;
  answer: string;
}

const SupportScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
    const { session } = useSession()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Contact form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactMethods: ContactMethod[] = [
    {
      icon: 'logo-whatsapp',
      title: 'Live Chat',
      description: 'Chat with our support team in real-time on WhatsApp',
      action: '+2348109816653',
      available: '24/7',
      type: 'whatsapp',
    },
    {
      icon: 'people',
      title: 'Support Group',
      description: 'Join our WhatsApp support group',
      action: 'https://chat.whatsapp.com/Lng1V0v71BXAse8QoXljQk',
      available: '24/7',
      type: 'group',
    },
    {
      icon: 'call',
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      action: '+2348109816653',
      available: '9AM - 6PM',
      type: 'phone',
    },
    {
      icon: 'mail',
      title: 'Email Support',
      description: 'Send us an email and we\'ll respond within 24 hours',
      action: 'matrixtechnology@gmail.com',
      available: '24/7',
      type: 'email',
    },
  ];

  const faqs: FAQ[] = [
    {
      question: 'How do I fund my wallet?',
      answer:
        'You can fund your wallet using bank transfer, debit card, or USSD. Go to your dashboard and click on \'Fund Wallet\' to see all available options.',
    },
    {
      question: 'What happens if my transaction fails?',
      answer:
        'If your transaction fails, the amount will be automatically refunded to your wallet within 5-10 minutes. If you don\'t receive the refund, contact our support team.',
    },
    {
      question: 'Can I get a receipt for my transactions?',
      answer:
        'Yes, all transactions come with digital receipts that are sent to your email. You can also download receipts from your transaction history in the dashboard.',
    },
    {
      question: 'Is my money safe with Matrix?',
      answer:
        'Absolutely. We use bank-level security measures including SSL encryption, two-factor authentication, and secure payment gateways to protect your funds and data.',
    },
    {
      question: 'How do I purchase data bundles?',
      answer:
        'Go to the Services screen, select Data, choose your network and plan, enter the phone number, and complete the payment. Your data will be activated instantly.',
    },
    {
      question: 'Can I pay utility bills?',
      answer:
        'Yes, you can pay electricity bills, cable TV subscriptions, and other utility bills through our platform. Just select the service and follow the prompts.',
    },
    {
      question: 'How do I check my transaction history?',
      answer:
        'Navigate to the Transactions screen from the bottom navigation to view all your past transactions, including status, amounts, and dates.',
    },
    {
      question: 'What are virtual accounts?',
      answer:
        'Virtual accounts are unique account numbers generated for you to fund your wallet. Each virtual account is tied to your Matrix account for secure and instant funding.',
    },
  ];

  const handleContact = (method: ContactMethod) => {
    let url = '';

    switch (method.type) {
      case 'whatsapp': {
        const name = session.user?.full_name || session.user?.email || ''
        const id = session.user?.id || ''
        const message = `Hello Support, I am ${name} (ID: ${id}). I need help with...`
        const encoded = encodeURIComponent(message)
        url = `https://wa.me/${method.action.replace('+', '')}?text=${encoded}`
        break
      }
      case 'group':
        url = method.action // direct group link
        break
      case 'phone':
        url = `tel:${method.action}`;
        break;
      case 'email':
        url = `mailto:${method.action}`;
        break;
    }

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Try open directly and show friendly alert on failure
          Linking.openURL(url).catch(() => Alert.alert('Error', `Cannot open ${method.title.toLowerCase()}`));
        }
      }).catch(() => {
        Linking.openURL(url).catch(() => Alert.alert('Error', `Cannot open ${method.title.toLowerCase()}`));
      });
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleFormSubmit = async () => {
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your backend API
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      Alert.alert(
        'Success',
        'Your message has been sent successfully! We\'ll get back to you within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                subject: '',
                message: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Text style={styles.title}>Support Center</Text>
            <ThemeToggle />
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              We're here to help!
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Get support, find answers to common questions, or contact our team directly.
            </Text>
          </View>

          {/* Contact Methods */}
          <View style={styles.contactSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Contact Us
            </Text>
            {contactMethods.map((method, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => handleContact(method)}
              >
                <View style={styles.contactContent}>
                  <View style={[styles.contactIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons
                      name={method.icon as any}
                      size={24}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactTitle, { color: theme.text }]}>
                      {method.title}
                    </Text>
                    <Text style={[styles.contactDescription, { color: theme.textSecondary }]}>
                      {method.description}
                    </Text>
                    <Text style={[styles.contactAction, { color: theme.primary }]}>
                      {method.action}
                    </Text>
                    <Text style={[styles.contactAvailable, { color: theme.textSecondary }]}>
                      Available: {method.available}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* FAQ Section */}
          <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Frequently Asked Questions
            </Text>
            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.faqCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => toggleFAQ(index)}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: theme.text }]}>
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
                {expandedFAQ === index && (
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact Form Section */}
          <View style={styles.contactFormSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Send us a Message
            </Text>
            <Text style={[styles.formDescription, { color: theme.textSecondary }]}>
              Fill out the form below and we'll get back to you within 24 hours
            </Text>

            <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>First Name</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter your first name"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Last Name</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Enter your last name"
                    placeholderTextColor={theme.textSecondary}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Email</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Subject</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="What's this about?"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.subject}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, subject: text }))}
                />
              </View>

              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Message</Text>
                <TextInput
                  style={[styles.formTextarea, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Describe your issue or question..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={formData.message}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.primary }, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleFormSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Text>
              </TouchableOpacity>
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
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  contactAction: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactAvailable: {
    fontSize: 12,
  },
  faqSection: {
    marginBottom: 32,
  },
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contactFormSection: {
    marginBottom: 32,
  },
  formDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formField: {
    flex: 1,
    marginRight: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formTextarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SupportScreen;
