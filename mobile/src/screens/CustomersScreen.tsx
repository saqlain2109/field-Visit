import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { apiFetch } from '../config/api';
import { Customer, Contact } from '../types';

interface CustomersScreenProps {
  customers: Customer[];
  loading: boolean;
  onRefresh: () => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  loading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [contactsMap, setContactsMap] = useState<Record<number, Contact[]>>({});
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Add Customer Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [custName, setCustName] = useState('');
  const [custType, setCustType] = useState('Direct');
  const [industry, setIndustry] = useState('Manufacturing');
  const [contactPerson, setContactPerson] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [city, setCity] = useState('');

  const customerTypes = ['Direct', 'OEM', 'Tier-1', 'Dealer', 'Government'];

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.contactPersonPrimary && c.contactPersonPrimary.toLowerCase().includes(q))
    );
  });

  const handleToggleContacts = async (custId: number) => {
    if (expandedCustomerId === custId) {
      setExpandedCustomerId(null);
      return;
    }
    setExpandedCustomerId(custId);

    if (!contactsMap[custId]) {
      setLoadingContacts(true);
      try {
        const cList = await apiFetch<Contact[]>(`/customers/${custId}/contacts`);
        setContactsMap((prev) => ({ ...prev, [custId]: cList || [] }));
      } catch (e) {
        setContactsMap((prev) => ({ ...prev, [custId]: [] }));
      } finally {
        setLoadingContacts(false);
      }
    }
  };

  const handleAddCustomer = async () => {
    if (!custName.trim()) {
      Alert.alert('Required', 'Please enter customer company name.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: custName.trim(),
          customerType: custType,
          industry,
          contactPersonPrimary: contactPerson.trim(),
          primaryPhone: primaryPhone.trim(),
          primaryEmail: primaryEmail.trim(),
          city: city.trim() || 'Mumbai',
          status: 'Active',
          source: 'Field App Ingestion',
        }),
      });

      Alert.alert('Success 🎉', `Customer ${custName.trim()} created successfully!`);
      setModalVisible(false);
      setCustName('');
      setContactPerson('');
      setPrimaryPhone('');
      setPrimaryEmail('');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not add customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Actions */}
      <View style={styles.topControl}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="🔍 Search customers by name, industry, city..."
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.countText}>{filtered.length} Customer Organizations Registered</Text>
      </View>

      {/* Customer List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🏢</Text>
          <Text style={styles.emptyTitle}>No Customers Found</Text>
          <Text style={styles.emptySub}>
            {searchQuery ? 'Try another search keyword.' : 'Tap "+ Add" to create a new customer.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={loading}
          renderItem={({ item }) => {
            const isExpanded = expandedCustomerId === item.id;
            const contacts = contactsMap[item.id] || [];

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.custName}>{item.name}</Text>
                    <Text style={styles.industryText}>
                      🏭 {item.industry || 'General Industry'} • {item.city || 'India'}
                    </Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.customerType}</Text>
                  </View>
                </View>

                {item.contactPersonPrimary ? (
                  <Text style={styles.detailText}>
                    👤 <Text style={{ fontWeight: '700' }}>Primary Contact:</Text>{' '}
                    {item.contactPersonPrimary}
                  </Text>
                ) : null}

                {item.primaryPhone ? (
                  <Text style={styles.detailText}>
                    📞 <Text style={{ fontWeight: '700' }}>Phone:</Text> {item.primaryPhone}
                  </Text>
                ) : null}

                {item.primaryEmail ? (
                  <Text style={styles.detailText}>
                    ✉️ <Text style={{ fontWeight: '700' }}>Email:</Text> {item.primaryEmail}
                  </Text>
                ) : null}

                {/* Contacts Expandable Button */}
                <TouchableOpacity
                  style={styles.expandContactsBtn}
                  onPress={() => handleToggleContacts(item.id)}
                >
                  <Text style={styles.expandContactsText}>
                    {isExpanded ? '▲ Hide Contacts' : '▼ View Company Contacts'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.contactsBox}>
                    {loadingContacts ? (
                      <ActivityIndicator color="#4F46E5" size="small" />
                    ) : contacts.length === 0 ? (
                      <Text style={styles.noContactsText}>No individual contacts listed.</Text>
                    ) : (
                      contacts.map((ct) => (
                        <View key={ct.id} style={styles.contactItem}>
                          <Text style={styles.contactName}>
                            👤 {ct.name} {ct.isPrimary ? '⭐ (Primary)' : ''}
                          </Text>
                          <Text style={styles.contactSub}>
                            {ct.designation || 'Staff'} • {ct.mobile || ct.phone || 'No Phone'} •{' '}
                            {ct.email || 'No Email'}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Add Customer Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Add Customer Organization</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text style={styles.inputLabel}>Company / Organization Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={custName}
              onChangeText={setCustName}
              placeholder="e.g. Tata Motors Ltd."
            />

            <Text style={styles.inputLabel}>Customer Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {customerTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.choiceChip, custType === t && styles.choiceChipActive]}
                  onPress={() => setCustType(t)}
                >
                  <Text style={[styles.choiceChipText, custType === t && styles.choiceChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Industry Segment</Text>
            <TextInput
              style={styles.modalInput}
              value={industry}
              onChangeText={setIndustry}
              placeholder="e.g. Automotive / Machine Tools"
            />

            <Text style={styles.inputLabel}>Primary Contact Person Name</Text>
            <TextInput
              style={styles.modalInput}
              value={contactPerson}
              onChangeText={setContactPerson}
              placeholder="e.g. Rajiv Verma"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Phone / Mobile</Text>
                <TextInput
                  style={styles.modalInput}
                  value={primaryPhone}
                  onChangeText={setPrimaryPhone}
                  placeholder="+91 9876543210"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.modalInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Pune"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={primaryEmail}
              onChangeText={setPrimaryEmail}
              placeholder="contact@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleAddCustomer}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>CREATE CUSTOMER</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topControl: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  countText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  custName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  industryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  expandContactsBtn: {
    marginTop: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  expandContactsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  contactsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noContactsText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  contactItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  contactSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  choiceChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  choiceChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
