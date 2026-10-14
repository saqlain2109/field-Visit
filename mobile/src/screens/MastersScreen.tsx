import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { apiFetch } from '../config/api';
import { ProductMaster, ExpenseHead, GradeFuelRate } from '../types';

interface BranchItem {
  id: number;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface MastersScreenProps {
  onBack?: () => void;
}

export const MastersScreen: React.FC<MastersScreenProps> = ({ onBack }) => {
  const [activeSegment, setActiveSegment] = useState<'fuel' | 'products' | 'expense' | 'branches'>('fuel');
  const [loading, setLoading] = useState(true);

  // Master data
  const [fuelRates, setFuelRates] = useState<GradeFuelRate[]>([]);
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);

  // Search filter
  const [productSearch, setProductSearch] = useState('');

  // Edit Fuel Rate Modal
  const [selectedGrade, setSelectedGrade] = useState<GradeFuelRate | null>(null);
  const [editRateInput, setEditRateInput] = useState('');
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  const fetchMasters = async () => {
    try {
      const summary = await apiFetch<any>('/masters/summary');
      if (summary) {
        setFuelRates(summary.gradeFuelRates || []);
        setProducts(summary.products || []);
        setExpenseHeads(summary.expenseHeads || []);
        setBranches(summary.branches || []);
      }
    } catch (e: any) {
      console.warn('Failed to load masters:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const openEditRate = (grade: GradeFuelRate) => {
    setSelectedGrade(grade);
    setEditRateInput(String(grade.fuelRate));
    setRateModalVisible(true);
  };

  const handleSaveFuelRate = async () => {
    if (!selectedGrade || !editRateInput.trim()) return;
    const num = parseFloat(editRateInput);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid rate greater than 0');
      return;
    }

    setSavingRate(true);
    try {
      await apiFetch(`/masters/fuel-rates/${selectedGrade.gradeCode}`, {
        method: 'PUT',
        body: JSON.stringify({ fuelRate: num }),
      });
      Alert.alert('Success', `Updated ${selectedGrade.gradeName} to ₹${num.toFixed(2)}/km`);
      setRateModalVisible(false);
      fetchMasters();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update fuel rate');
    } finally {
      setSavingRate(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      {/* Screen Header Bar */}
      <View style={styles.topNavBar}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← Hub</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleCol}>
          <Text style={styles.screenTitle}>Master Catalogs</Text>
          <Text style={styles.screenSub}>Fuel Rates, Products, Expense & Branches</Text>
        </View>
        <TouchableOpacity style={styles.headerRefreshBtn} onPress={fetchMasters}>
          <Text style={styles.headerRefreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Top Segment Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'fuel' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('fuel')}
        >
          <Text style={[styles.segmentText, activeSegment === 'fuel' && styles.segmentTextActive]}>
            ⛽ Fuel Rates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'products' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('products')}
        >
          <Text style={[styles.segmentText, activeSegment === 'products' && styles.segmentTextActive]}>
            📦 Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'expense' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('expense')}
        >
          <Text style={[styles.segmentText, activeSegment === 'expense' && styles.segmentTextActive]}>
            🧾 Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'branches' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('branches')}
        >
          <Text style={[styles.segmentText, activeSegment === 'branches' && styles.segmentTextActive]}>
            🏢 Branches
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading Master Catalog...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* SECTION 1: FUEL RATES */}
          {activeSegment === 'fuel' && (
            <View>
              <View style={styles.bannerBox}>
                <Text style={styles.bannerTitle}>Odometer Reimbursement Policy</Text>
                <Text style={styles.bannerSub}>
                  Fuel claims are calculated automatically based on employee designation grade and kilometers traveled.
                </Text>
              </View>

              {fuelRates.map((fr) => (
                <View key={fr.id} style={styles.card}>
                  <View style={styles.rateHeader}>
                    <View style={styles.gradeIconBox}>
                      <Text style={styles.gradeIcon}>🚗</Text>
                    </View>
                    <View style={styles.gradeInfo}>
                      <Text style={styles.gradeName}>{fr.gradeName}</Text>
                      <Text style={styles.gradeCode}>Code: {fr.gradeCode}</Text>
                    </View>
                    <View style={styles.rateCol}>
                      <Text style={styles.rateAmount}>₹{Number(fr.fuelRate).toFixed(2)}</Text>
                      <Text style={styles.rateUnit}>per kilometer</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditRate(fr)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>✏️ Edit Rate</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* SECTION 2: PRODUCTS */}
          {activeSegment === 'products' && (
            <View>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products by title or code..."
                  placeholderTextColor="#94A3B8"
                  value={productSearch}
                  onChangeText={setProductSearch}
                />
              </View>

              <Text style={styles.countHeader}>{filteredProducts.length} Products in Master Price List</Text>

              {filteredProducts.map((p) => (
                <View key={p.id} style={styles.card}>
                  <View style={styles.productRow}>
                    <View style={styles.productMain}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productCode}>SKU: {p.code}</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={styles.priceText}>₹{Number(p.unitPrice).toLocaleString('en-IN')}</Text>
                      <Text style={styles.lockedLabel}>🔒 Locked Master Rate</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* SECTION 3: EXPENSE HEADS */}
          {activeSegment === 'expense' && (
            <View>
              <Text style={styles.countHeader}>Allowed Claim Categories</Text>
              {expenseHeads.map((eh) => (
                <View key={eh.id} style={styles.card}>
                  <View style={styles.expRow}>
                    <View style={styles.expIconBox}>
                      <Text style={styles.expIcon}>🧾</Text>
                    </View>
                    <View style={styles.expInfo}>
                      <Text style={styles.expName}>{eh.name}</Text>
                      <Text style={styles.expCode}>Head: {eh.code}</Text>
                    </View>
                    <View style={[styles.receiptBadge, eh.requiresAttachment && styles.receiptRequired]}>
                      <Text style={styles.receiptBadgeText}>
                        {eh.requiresAttachment ? 'Receipt Mandatory' : 'Self-Claim'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* SECTION 4: BRANCHES */}
          {activeSegment === 'branches' && (
            <View>
              <Text style={styles.countHeader}>Company Operating Branches</Text>
              {branches.map((b) => (
                <View key={b.id} style={styles.card}>
                  <View style={styles.branchHeader}>
                    <Text style={styles.branchName}>{b.name}</Text>
                    <View style={styles.branchCodeBadge}>
                      <Text style={styles.branchCodeText}>{b.code}</Text>
                    </View>
                  </View>
                  {b.address ? <Text style={styles.branchAddress}>📍 {b.address}</Text> : null}
                  <Text style={styles.branchLocation}>
                    🏢 {b.city || 'Mumbai'}, {b.state || 'Maharashtra'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Edit Rate Modal */}
      <Modal visible={rateModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⛽ Update Fuel Rate</Text>
            <Text style={styles.modalSub}>{selectedGrade?.gradeName}</Text>

            <Text style={styles.inputLabel}>New Fuel Reimbursement Rate (₹ per KM)</Text>
            <TextInput
              style={styles.modalInput}
              value={editRateInput}
              onChangeText={setEditRateInput}
              keyboardType="numeric"
              placeholder="11.50"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRateModalVisible(false)}
                disabled={savingRate}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveFuelRate}
                disabled={savingRate}
              >
                {savingRate ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Rate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  backButtonText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  titleCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  headerRefreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerRefreshText: {
    fontSize: 15,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#4F46E5',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  bannerBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730A3',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gradeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gradeIcon: {
    fontSize: 18,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  gradeCode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rateCol: {
    alignItems: 'flex-end',
  },
  rateAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  rateUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  editBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  countHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productMain: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productCode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  lockedLabel: {
    fontSize: 10,
    color: '#059669',
    marginTop: 2,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  expIcon: {
    fontSize: 16,
  },
  expInfo: {
    flex: 1,
  },
  expName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  expCode: {
    fontSize: 11,
    color: '#64748B',
  },
  receiptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  receiptRequired: {
    backgroundColor: '#FEF3C7',
  },
  receiptBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  branchCodeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  branchCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  branchAddress: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  branchLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
