import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useSession } from '../contexts/SessionContext';

interface ContactItem {
  id: string;
  name: string;
  phone: string;
}

interface PhoneInputWithContactsProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  onNetworkDetect?: (number: string) => void;
}

const RECENT_NUMBERS_KEY = 'recent_phone_numbers';

// Memoized Contact Item for high performance
const ContactRow = React.memo(({ item, onPress, theme }: { item: ContactItem; onPress: (p: string) => void; theme: any }) => (
  <TouchableOpacity
    style={[styles.contactItem, { borderBottomColor: theme.border }]}
    onPress={() => onPress(item.phone)}
  >
    <View style={[styles.contactAvatar, { backgroundColor: theme.primary + '20' }]}>
      <Text style={[styles.avatarText, { color: theme.primary }]}>
        {item.name.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.contactName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>{item.phone}</Text>
    </View>
  </TouchableOpacity>
));

const PhoneInputWithContacts: React.FC<PhoneInputWithContactsProps> = ({
  value,
  onChangeText,
  placeholder = '08012345678',
  label = 'Phone Number',
  onNetworkDetect,
}) => {
  const { theme } = useTheme();
  const { session } = useSession();
  const [isFocused, setIsFocused] = useState(false);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [recentModalVisible, setRecentModalVisible] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([]);
  const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadRecentNumbers();
    if (!value && session?.user?.phone) {
      handleSelectNumber(session.user.phone);
    }
  }, []);

  useEffect(() => {
    if (value.length > 0 && isFocused) {
      const filtered = recentNumbers.filter(n => n.includes(value) && n !== value);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [value, isFocused, recentNumbers]);

  const loadRecentNumbers = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_NUMBERS_KEY);
      if (stored) setRecentNumbers(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const saveRecentNumber = async (number: string) => {
    try {
      let updated = [number, ...recentNumbers.filter(n => n !== number)].slice(0, 10);
      setRecentNumbers(updated);
      await AsyncStorage.setItem(RECENT_NUMBERS_KEY, JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const fetchContacts = async () => {
    setLoadingContacts(true);
    setContactsModalVisible(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        if (data.length > 0) {
          const formatted: ContactItem[] = data
            .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
            .map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phoneNumbers![0].number || '',
            }));
          setContacts(formatted);
          setFilteredContacts(formatted);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoadingContacts(false); }
  };

  const handleSearchContacts = (query: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    const filtered = contacts.filter(
      c => c.name.toLowerCase().includes(lowerQuery) || c.phone.includes(query)
    );
    setFilteredContacts(filtered);
  };

  const handleSelectNumber = (number: string) => {
    let clean = number.replace(/\s/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
    if (clean.startsWith('+234')) clean = '0' + clean.slice(4);
    else if (clean.startsWith('234')) clean = '0' + clean.slice(3);
    
    onChangeText(clean);
    if (onNetworkDetect) onNetworkDetect(clean);
    setContactsModalVisible(false);
    setRecentModalVisible(false);
    setSuggestions([]);
    saveRecentNumber(clean);
  };

  const handleClear = () => {
    onChangeText('');
    if (onNetworkDetect) onNetworkDetect('');
    setSuggestions([]);
  };

  const renderContactItem = useCallback(({ item }: { item: ContactItem }) => (
    <ContactRow item={item} onPress={handleSelectNumber} theme={theme} />
  ), [theme]);

  const keyExtractor = useCallback((item: ContactItem) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {recentNumbers.length > 0 && (
          <TouchableOpacity onPress={() => setRecentModalVisible(true)} style={styles.recentButton}>
            <Text style={[styles.recentButtonText, { color: theme.primary }]}>Recents</Text>
            <Ionicons name="chevron-down" size={14} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputOuterWrapper}>
        <View style={[styles.inputWrapper, { borderColor: isFocused ? theme.primary : theme.border, backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={value}
            onChangeText={(text) => { onChangeText(text); if (onNetworkDetect) onNetworkDetect(text); }}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            maxLength={11}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />
          <View style={styles.rightIcons}>
            {value.length > 0 && (
              <TouchableOpacity onPress={handleClear} onPressIn={handleClear} style={styles.iconButton}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={fetchContacts} style={styles.iconButton}>
              <Ionicons name="person-add" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {suggestions.length > 0 && isFocused && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {suggestions.map((num, idx) => (
              <TouchableOpacity key={idx} style={[styles.suggestionItem, { borderBottomColor: theme.border }]} onPress={() => handleSelectNumber(num)}>
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.suggestionText, { color: theme.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Contacts Modal */}
      <Modal visible={contactsModalVisible} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setContactsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Contacts</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchBar, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              placeholder="Search contacts..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchContacts}
            />
          </View>

          {loadingContacts ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={keyExtractor}
              renderItem={renderContactItem}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: theme.textSecondary }}>No contacts found</Text>}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Recent Numbers Modal */}
      <Modal visible={recentModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRecentModalVisible(false)}>
          <View style={[styles.recentDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.dropdownTitle, { color: theme.textSecondary }]}>Recent Numbers</Text>
            {recentNumbers.map((num, i) => (
              <TouchableOpacity key={i} style={[styles.recentItem, { borderTopColor: theme.border }]} onPress={() => handleSelectNumber(num)}>
                <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                <Text style={[styles.recentItemText, { color: theme.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20, zIndex: 100 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600' },
  recentButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentButtonText: { fontSize: 14, fontWeight: '600' },
  inputOuterWrapper: { position: 'relative', zIndex: 101 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
  rightIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 4 },
  suggestionsContainer: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 12, borderWidth: 1, maxHeight: 200, zIndex: 102, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, gap: 10 },
  suggestionText: { fontSize: 16 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1 },
  closeButton: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  searchBarContainer: { padding: 16, position: 'relative' },
  searchIcon: { position: 'absolute', left: 28, top: 28, zIndex: 1 },
  searchBar: { height: 44, borderRadius: 22, borderWidth: 1, paddingLeft: 44, paddingRight: 20, fontSize: 16 },
  contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  contactName: { fontSize: 16, fontWeight: '600' },
  contactPhone: { fontSize: 14, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  recentDropdown: { width: '100%', borderRadius: 12, borderWidth: 1, padding: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  dropdownTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderTopWidth: 1 },
  recentItemText: { fontSize: 16, fontWeight: '500' },
});

export default PhoneInputWithContacts;
