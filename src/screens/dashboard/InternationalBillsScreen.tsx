import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';

interface InternationalProvider {
  code: string;
  name: string;
  description?: string;
  logo?: string;
}

interface InternationalProduct {
  id: string;
  name: string;
  amount?: number;
  receive_amount?: number;
  currency?: string;
  description?: string;
  sku?: string;
  uat?: string;
  country_iso?: string;
  provider_code?: string;
  display_text?: string;
  min_send?: string;
  max_send?: string;
  min_receive?: string;
  max_receive?: string;
  receive_currency?: string;
  send_currency?: string;
  lookup_required?: string;
  vend_type?: string;
  current_rate?: number;
}

const COUNTRIES = [
  { iso: 'NG', name: 'Nigeria', icon: 'flag' },
  { iso: 'GH', name: 'Ghana', icon: 'flag' },
  { iso: 'KE', name: 'Kenya', icon: 'flag' },
  { iso: 'UG', name: 'Uganda', icon: 'flag' },
  { iso: 'TZ', name: 'Tanzania', icon: 'flag' },
  { iso: 'ZA', name: 'South Africa', icon: 'flag' },
];

const InternationalBillsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [iso, setIso] = useState('NG');
  const [providers, setProviders] = useState<InternationalProvider[]>([]);
  const [products, setProducts] = useState<InternationalProduct[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<InternationalProvider | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InternationalProduct | null>(null);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState<number | null>(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    buttons: undefined as
      | Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
      | undefined,
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    buttons?: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ) => setAlertConfig({ visible: true, title, message, type, buttons });

  const closeAlert = () => setAlertConfig((c) => ({ ...c, visible: false }));

  useEffect(() => {
    fetchProviders();
  }, [iso]);

  useEffect(() => {
    if (selectedProvider) {
      fetchProducts(selectedProvider.code);
    } else {
      setProducts([]);
      setSelectedProduct(null);
    }
  }, [selectedProvider, iso]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (amount && selectedProvider) {
        fetchRate();
      } else {
        setEstimatedReceiveAmount(null);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [amount, iso, selectedProvider]);

  const normalizeArray = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.message?.details)) return data.message.details;
    return [];
  };

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      setSelectedProvider(null);
      setSelectedProduct(null);
      const response = await apiClient.get(`/services/international?action=providers&iso=${iso}`);
      if (response.success) {
        const providerList = normalizeArray(response.data).map((item: any) => ({
          code: item.code || item.provider_code || item.id,
          name: item.name || item.provider_name || item.code,
          description: item.description,
          logo: item.logo,
        }));
        setProviders(providerList);
        setSelectedProvider(providerList[0] || null);
      } else {
        setProviders([]);
        showAlert('Error', response.error || 'Failed to load providers', 'error');
      }
    } catch (error) {
      console.error('Fetch providers error:', error);
      showAlert('Error', 'Failed to load providers', 'error');
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchProducts = async (providerCode: string) => {
    try {
      setLoadingProducts(true);
      setSelectedProduct(null);
      const response = await apiClient.get(`/services/international?action=products&iso=${iso}&code=${providerCode}`);
      if (response.success) {
        const productList = normalizeArray(response.data).map((item: any) => ({
          id: item.sku || item.id || item.product_id || item.code || `${providerCode}-${item.display_text || item.name || Math.random().toString(36).slice(2)}`,
          name: item.display_text || item.name || item.product_name || item.title || item.sku || item.code,
          amount: Number(item.amount || item.price || item.send_amount || 0),
          receive_amount: Number(item.receive_amount || 0),
          currency: item.currency || item.receive_currency || item.send_currency,
          description: item.description || item.display_text,
          sku: item.sku || item.id || item.code,
          uat: item.uat,
          country_iso: item.country_iso || iso,
          provider_code: item.provider_code || providerCode,
          display_text: item.display_text || "",
          min_send: String(item.min_send || ""),
          max_send: String(item.max_send || ""),
          min_receive: String(item.min_receive || ""),
          max_receive: String(item.max_receive || ""),
          receive_currency: item.receive_currency || "",
          send_currency: item.send_currency || "USD",
          lookup_required: String(item.lookup_required || "0"),
          vend_type: item.vend_type || "range",
          current_rate: Number(item.current_rate || 0),
        }));
        setProducts(productList);
        setSelectedProduct(productList[0] || null);
      } else {
        setProducts([]);
        showAlert('Error', response.error || 'Failed to load products', 'error');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      showAlert('Error', 'Failed to load products', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchRate = async () => {
    try {
      const response = await apiClient.get(`/services/international?action=rate&iso=${iso}&amount=${amount}`);
      if (response.success) {
        const rateData = normalizeArray(response.data);
        const firstItem = rateData[0] || response.data;
        const receiveAmount = Number(firstItem?.receive_amount || firstItem?.details?.receive_amount || firstItem?.amount || 0);
        setEstimatedReceiveAmount(receiveAmount || null);
      }
    } catch (error) {
      console.warn('Rate fetch failed:', error);
      setEstimatedReceiveAmount(null);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProvider || !selectedProduct || !recipientPhone || !amount) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }

    if (parseFloat(amount) < 1) {
      showAlert('Error', 'Amount must be at least 1', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/services/international', {
        iso,
        code: selectedProvider.code,
        product_id: selectedProduct.id,
        phone: recipientPhone,
        amount: parseFloat(amount),
      });

      if (response.success) {
        showAlert('Success', 'International bill payment successful!', 'success', [
          {
            text: 'View Receipt',
            onPress: () =>
              navigation.navigate('Success', {
                data: {
                  serviceType: 'international',
                  amount: parseFloat(amount),
                  recipient: recipientPhone,
                  provider: selectedProvider.code,
                  country: iso,
                  productName: selectedProduct.name,
                  transactionId:
                    (response as any).data?.transaction_id || (response as any).data?.reference || `TXN_${Date.now()}`,
                  status: (response as any).data?.status || 'completed',
                  timestamp: new Date().toISOString(),
                  ...(response as any).data && { apiResponse: (response as any).data },
                },
              }),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]);
      } else {
        showAlert('Error', response.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showAlert('Error', 'Failed to complete purchase', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <LinearGradient colors={[theme.primary, theme.primary + 'DD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="earth" size={32} color="white" />
          </View>
          <Text style={styles.serviceTitle}>International Bills</Text>
          <Text style={styles.serviceDescription}>
            Send airtime, data, and bills internationally
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Select Country</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.iso}
              style={[
                styles.countryCard,
                {
                  backgroundColor: iso === country.iso ? theme.primary : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setIso(country.iso)}
            >
              <Text style={[styles.countryName, { color: iso === country.iso ? '#ffffff' : theme.text }]}>
                {country.name}
              </Text>
              <Text style={[styles.countryCode, { color: iso === country.iso ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
                {country.iso}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.formTitle, { color: theme.text }]}>Select Provider</Text>
        {loadingProviders ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <View style={styles.serviceGrid}>
            {providers.map((service) => (
              <TouchableOpacity
                key={service.code}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: selectedProvider?.code === service.code ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setSelectedProvider(service)}
              >
                <Text style={[styles.serviceName, { color: selectedProvider?.code === service.code ? '#ffffff' : theme.text }]}>
                  {service.name}
                </Text>
                <Text style={[styles.serviceCardDescription, { color: selectedProvider?.code === service.code ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
                  {service.description || service.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.formTitle, { color: theme.text }]}>Select Product</Text>
        {loadingProducts ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <View style={styles.productGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: selectedProduct?.id === product.id ? theme.primary : theme.surface,
                    borderColor: selectedProduct?.id === product.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedProduct(product)}
              >
                <Text style={[styles.productName, { color: selectedProduct?.id === product.id ? '#ffffff' : theme.text }]}>
                  {product.display_text || product.name}
                </Text>
                <Text style={[styles.productAmount, { color: selectedProduct?.id === product.id ? '#ffffff' : theme.primary }]}>
                  {product.receive_currency ? `${product.receive_currency} ` : ''}{product.min_receive}{product.min_receive !== product.max_receive ? ` - ${product.max_receive}` : ''}
                </Text>
                <Text style={[styles.productMeta, { color: selectedProduct?.id === product.id ? 'rgba(255,255,255,0.85)' : theme.textSecondary }]}>
                  {product.vend_type ? `${product.vend_type.toUpperCase()} package` : 'International product'}
                </Text>
                <Text style={[styles.productMeta, { color: selectedProduct?.id === product.id ? 'rgba(255,255,255,0.85)' : theme.textSecondary }]}>
                  {product.current_rate ? `1 USD = ${Number(product.current_rate).toLocaleString()} ${product.receive_currency || ''}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Recipient Phone</Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
            placeholder="Recipient phone number"
            placeholderTextColor={theme.textSecondary}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount (₦)</Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
            placeholder="1000"
            placeholderTextColor={theme.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          {estimatedReceiveAmount !== null && (
            <Text style={[styles.helperText, { color: theme.textSecondary }]}>Estimated receive amount: {estimatedReceiveAmount}</Text>
          )}
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>Select a destination country, provider, and product before sending the payment.</Text>
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, { backgroundColor: theme.primary }]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? <Text style={styles.purchaseText}>Processing...</Text> : <Text style={styles.purchaseText}>Purchase International Bill</Text>}
        </TouchableOpacity>
      </View>
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={closeAlert} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  countryScroll: {
    marginBottom: 8,
  },
  countryCard: {
    width: 120,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  countryName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  countryCode: {
    fontSize: 12,
    textAlign: 'center',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  serviceCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceCardDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  productCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  productAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productMeta: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  purchaseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InternationalBillsScreen;
