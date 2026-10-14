import React, { useState, useEffect } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import { Customer, Contact, ActivityType, ProductMaster, GradeFuelRate } from '../types';

interface LogVisitModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  activityTypes: ActivityType[];
  products: ProductMaster[];
  gradeFuelRates: GradeFuelRate[];
}

export const LogVisitModal: React.FC<LogVisitModalProps> = ({
  visible,
  onClose,
  onSuccess,
  customers,
  activityTypes,
  products,
  gradeFuelRates,
}) => {
  const { user } = useAuth();

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState<number | null>(null);
  const [activityTypeId, setActivityTypeId] = useState<number | null>(null);
  const [productId, setProductId] = useState<number | null>(null);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [placeFrom, setPlaceFrom] = useState('Mumbai');
  const [placeTo, setPlaceTo] = useState('Pune');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('18:00');
  const [personCount, setPersonCount] = useState('1');
  const [remarks, setRemarks] = useState('');

  // Fuel & Expense Calculation
  const [startKm, setStartKm] = useState('12400');
  const [endKm, setEndKm] = useState('12520');
  const [tollTax, setTollTax] = useState('150');
  const [saving, setSaving] = useState(false);

  // Initialize defaults on open
  useEffect(() => {
    if (visible) {
      if (customers.length > 0 && !customerId) {
        handleSelectCustomer(customers[0].id);
      }
      if (activityTypes.length > 0 && !activityTypeId) {
        setActivityTypeId(activityTypes[0].id);
      }
      if (products.length > 0 && !productId) {
        setProductId(products[0].id);
      }
    }
  }, [visible, customers, activityTypes, products]);

  // Determine user's fuel rate based on employee grade
  const getFuelRate = (): number => {
    const userGrade = user?.grade || 'GRADE_B';
    const found = gradeFuelRates.find((g) => {
      const gCode = (g.gradeCode || '').toUpperCase().replace(/[^A-Z]/g, '');
      const uCode = (userGrade || '').toUpperCase().replace(/[^A-Z]/g, '');
      return gCode === uCode;
    });

    if (found && found.fuelRate) return Number(found.fuelRate);
    if (userGrade === 'GRADE_A') return 14.0;
    if (userGrade === 'GRADE_B') return 11.5;
    if (userGrade === 'GRADE_C') return 9.0;
    if (userGrade === 'GRADE_D') return 6.5;
    return 11.5;
  };

  const fuelRate = getFuelRate();
  const sKm = parseFloat(startKm) || 0;
  const eKm = parseFloat(endKm) || 0;
  const totalKm = eKm >= sKm ? eKm - sKm : 0;
  const fuelAmount = Math.round(totalKm * fuelRate);
  const toll = parseFloat(tollTax) || 0;
  const totalClaim = fuelAmount + toll;

  const handleSelectCustomer = async (cId: number) => {
    setCustomerId(cId);
    try {
      const cList = await apiFetch<Contact[]>(`/customers/${cId}/contacts`);
      setContacts(cList || []);
      const primary = (cList || []).find((c) => c.isPrimary) || (cList || [])[0];
      if (primary) {
        setContactId(primary.id);
      } else {
        setContactId(null);
      }
    } catch (e) {
      setContacts([]);
      setContactId(null);
    }
  };

  const handleSave = async () => {
    if (!customerId) {
      Alert.alert('Required', 'Please select a Customer Organization.');
      return;
    }
    if (!activityTypeId) {
      Alert.alert('Required', 'Please select an Activity Type.');
      return;
    }
    if (totalKm <= 0) {
      Alert.alert('Warning', 'Day End KM must be greater than Day Start KM.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        visitDate,
        customerId,
        contactId,
        activityTypeId,
        productId,
        placeFrom: placeFrom.trim() || 'Baroda',
        placeTo: placeTo.trim() || 'Baroda',
        startTime,
        endTime,
        personCount: parseInt(personCount, 10) || 1,
        remarks: remarks.trim() || 'Daily field maintenance & sales visit',
        employeeId: user?.id,
        departmentId: user?.departmentId || 2,
        branchId: user?.branchId || 1,
        expenses: [
          {
            expenseHeadId: 11, // Fuel Expense Head
            dayStartKm: sKm,
            dayEndKm: eKm,
            totalKm: totalKm,
            fuelRate: fuelRate,
            tollTax: toll,
            amount: totalClaim,
            remarks: `Fuel Claim (${totalKm} KM @ ₹${fuelRate}/km) + Toll ₹${toll}`,
          },
        ],
      };

      await apiFetch('/daily-visits', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      Alert.alert('Success 🎉', `Daily Visit & Claim of ₹${totalClaim.toLocaleString('en-IN')} logged successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit daily visit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Log Daily Visit & Fuel Claim</Text>
            <Text style={styles.headerSubtitle}>
              Grade {user?.grade?.replace('_', ' ') || 'B'} • Allowance Rate: ₹{fuelRate}/km
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Section 1: Customer Organization */}
          <Text style={styles.sectionHeading}>1. Customer & Contacts</Text>
          <Text style={styles.inputLabel}>Select Customer Organization *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {customers.map((c) => {
              const active = customerId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleSelectCustomer(c.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Contact Person */}
          {contacts.length > 0 && (
            <>
              <Text style={styles.inputLabel}>Contact Person</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {contacts.map((ct) => {
                  const active = contactId === ct.id;
                  return (
                    <TouchableOpacity
                      key={ct.id}
                      style={[styles.contactChip, active && styles.contactChipActive]}
                      onPress={() => setContactId(ct.id)}
                    >
                      <Text style={[styles.contactChipText, active && styles.contactChipTextActive]}>
                        👤 {ct.name} {ct.designation ? `(${ct.designation})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Section 2: Activity & Product */}
          <Text style={styles.sectionHeading}>2. Purpose & Machinery</Text>
          <Text style={styles.inputLabel}>Activity Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {activityTypes.map((act) => {
              const active = activityTypeId === act.id;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setActivityTypeId(act.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    ⚡ {act.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>Product / Machinery Model</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {products.map((prod) => {
              const active = productId === prod.id;
              return (
                <TouchableOpacity
                  key={prod.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setProductId(prod.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    📦 {prod.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Section 3: Schedule & Route */}
          <Text style={styles.sectionHeading}>3. Schedule & Travel Route</Text>
          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Place From *</Text>
              <TextInput
                style={styles.input}
                value={placeFrom}
                onChangeText={setPlaceFrom}
                placeholder="e.g. Mumbai"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Place To *</Text>
              <TextInput
                style={styles.input}
                value={placeTo}
                onChangeText={setPlaceTo}
                placeholder="e.g. Pune"
              />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:30"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>End Time</Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="18:00"
              />
            </View>
          </View>

          {/* Section 4: Fuel & Expense Claim Calculator */}
          <Text style={styles.sectionHeading}>4. Odometer & Expense Calculation</Text>
          <View style={styles.calcCard}>
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.calcLabel}>Day Start KM</Text>
                <TextInput
                  style={styles.calcInput}
                  value={startKm}
                  onChangeText={setStartKm}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calcLabel}>Day End KM</Text>
                <TextInput
                  style={styles.calcInput}
                  value={endKm}
                  onChangeText={setEndKm}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.calcLabel}>Toll Tax (₹)</Text>
                <TextInput
                  style={styles.calcInput}
                  value={tollTax}
                  onChangeText={setTollTax}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={styles.calcLabel}>Fuel Rate</Text>
                <Text style={styles.rateBadgeText}>₹{fuelRate.toFixed(2)} / KM</Text>
              </View>
            </View>

            {/* Live Summary Box */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Total Distance</Text>
                <Text style={styles.summaryItemValue}>{totalKm} KM</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Fuel Allowance</Text>
                <Text style={styles.summaryItemValue}>₹{fuelAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Total Claim</Text>
                <Text style={styles.summaryTotalValue}>₹{totalClaim.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Remarks / Visit Notes</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Work completed, demo remarks, customer feedback..."
            multiline
          />

          {/* Submit Action */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                SUBMIT DAILY VISIT & CLAIM (₹{totalClaim.toLocaleString('en-IN')})
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 6,
  },
  chipRow: {
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contactChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  contactChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  contactChipText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  contactChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  calcCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  calcLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  calcInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  rateBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    paddingVertical: 8,
  },
  summaryBox: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
    textTransform: 'uppercase',
  },
  summaryItemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
    marginTop: 2,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4F46E5',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#C7D2FE',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
