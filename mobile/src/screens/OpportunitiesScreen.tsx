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
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import { Opportunity, Customer } from '../types';

interface OpportunitiesScreenProps {
  opportunities: Opportunity[];
  customers: Customer[];
  loading: boolean;
  onRefresh: () => void;
}

export const OpportunitiesScreen: React.FC<OpportunitiesScreenProps> = ({
  opportunities,
  customers,
  loading,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Opportunity Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [expectedValue, setExpectedValue] = useState('');
  const [probability, setProbability] = useState('60');
  const [stage, setStage] = useState<any>('Proposal');
  const [nextAction, setNextAction] = useState('Follow-up Call');
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  const stages = [
    'ALL',
    'Prospecting',
    'Qualification',
    'Proposal',
    'Negotiation',
    'Closed Won',
    'Closed Lost',
  ];

  const actionOptions = [
    'Follow-up Call',
    'Send Formal Quotation',
    'WhatsApp Follow-up',
    'Online Video Meeting',
    'Commercial Negotiation',
    'Technical Review',
  ];

  const filtered = opportunities.filter((op) => {
    const matchesStage =
      filterStage === 'ALL' ||
      op.stage?.toLowerCase() === filterStage.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      op.title.toLowerCase().includes(q) ||
      (op.customerName && op.customerName.toLowerCase().includes(q)) ||
      (op.nextActionPlanned && op.nextActionPlanned.toLowerCase().includes(q));

    return matchesStage && matchesSearch;
  });

  const getStageColor = (stg?: string) => {
    switch (stg) {
      case 'Closed Won':
        return '#059669';
      case 'Closed Lost':
        return '#DC2626';
      case 'Negotiation':
        return '#7C3AED';
      case 'Proposal':
        return '#2563EB';
      case 'Qualification':
        return '#D97706';
      default:
        return '#475569';
    }
  };

  const handleCreateOpportunity = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an opportunity title.');
      return;
    }
    if (!customerId) {
      Alert.alert('Required', 'Please select a customer.');
      return;
    }
    const val = parseFloat(expectedValue);
    if (!val || val <= 0) {
      Alert.alert('Required', 'Please enter a valid deal amount.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          customerId,
          expectedValue: val,
          currency: 'INR',
          stage,
          probability: parseInt(probability, 10) || 50,
          expectedCloseDate,
          nextActionPlanned: nextAction,
          assignedEmployeeId: user?.id,
        }),
      });

      Alert.alert('Success 🎉', 'New sales opportunity registered in pipeline!');
      setModalVisible(false);
      setTitle('');
      setExpectedValue('');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Could not save opportunity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Filter */}
      <View style={styles.topControl}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="🔍 Search deals by title, client..."
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (customers.length > 0 && !customerId) {
                setCustomerId(customers[0].id);
              }
              setModalVisible(true);
            }}
          >
            <Text style={styles.addBtnText}>+ New Deal</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
          {stages.map((stg) => {
            const active = filterStage === stg;
            return (
              <TouchableOpacity
                key={stg}
                style={[styles.stageChip, active && styles.stageChipActive]}
                onPress={() => setFilterStage(stg)}
              >
                <Text style={[styles.stageChipText, active && styles.stageChipTextActive]}>
                  {stg}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Opportunities List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading sales pipeline...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🎯</Text>
          <Text style={styles.emptyTitle}>No Opportunities Found</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? 'No deals match your search criteria.'
              : 'Tap "+ New Deal" to add your first sales lead.'}
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
            const color = getStageColor(item.stage);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dealTitle}>{item.title}</Text>
                    <Text style={styles.custName}>
                      🏢 {item.customer?.name || item.customerName || 'Client'}
                    </Text>
                  </View>
                  <View style={[styles.stageBadge, { backgroundColor: `${color}15` }]}>
                    <Text style={[styles.stageBadgeText, { color }]}>
                      {item.stage?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Deal Value & Win Probability */}
                <View style={styles.metricRow}>
                  <View>
                    <Text style={styles.metricLabel}>Expected Value</Text>
                    <Text style={styles.metricVal}>
                      ₹{Math.round(item.expectedValue).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.probPill}>
                    <Text style={styles.probLabel}>Probability</Text>
                    <Text style={styles.probVal}>{item.probability || 50}%</Text>
                  </View>
                </View>

                {/* Next Action Planned */}
                {item.nextActionPlanned && (
                  <View style={styles.actionBox}>
                    <Text style={styles.actionBoxText}>
                      ⚡ <Text style={{ fontWeight: '700' }}>Next Action:</Text>{' '}
                      {item.nextActionPlanned}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.closingDate}>
                    Closing Target:{' '}
                    {item.expectedCloseDate
                      ? new Date(item.expectedCloseDate).toLocaleDateString('en-IN')
                      : 'TBD'}
                  </Text>
                  {item.opportunityNo && (
                    <Text style={styles.oppNoText}>{item.opportunityNo}</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Add Opportunity Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Create New Opportunity</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748B' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text style={styles.inputLabel}>Deal Title / Machinery Requirement *</Text>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. 5x CNC Precision Lathe Requirement"
            />

            <Text style={styles.inputLabel}>Customer Organization *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {customers.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.choiceChip, customerId === c.id && styles.choiceChipActive]}
                  onPress={() => setCustomerId(c.id)}
                >
                  <Text
                    style={[styles.choiceChipText, customerId === c.id && styles.choiceChipTextActive]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.inputLabel}>Deal Value (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={expectedValue}
                  onChangeText={setExpectedValue}
                  placeholder="e.g. 2500000"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Win Prob (%)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={probability}
                  onChangeText={setProbability}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Pipeline Stage *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'].map((stg) => (
                <TouchableOpacity
                  key={stg}
                  style={[styles.choiceChip, stage === stg && styles.choiceChipActive]}
                  onPress={() => setStage(stg)}
                >
                  <Text style={[styles.choiceChipText, stage === stg && styles.choiceChipTextActive]}>
                    {stg}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Next Action Planned</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {actionOptions.map((act) => (
                <TouchableOpacity
                  key={act}
                  style={[styles.choiceChip, nextAction === act && styles.choiceChipActive]}
                  onPress={() => setNextAction(act)}
                >
                  <Text style={[styles.choiceChipText, nextAction === act && styles.choiceChipTextActive]}>
                    {act}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleCreateOpportunity}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>REGISTER OPPORTUNITY</Text>
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
    marginBottom: 10,
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
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stageScroll: {
    flexDirection: 'row',
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  stageChipActive: {
    backgroundColor: '#4F46E5',
  },
  stageChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stageChipTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  custName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  probPill: {
    alignItems: 'flex-end',
  },
  probLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  probVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
    marginTop: 2,
  },
  actionBox: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionBoxText: {
    fontSize: 12,
    color: '#3730A3',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  closingDate: {
    fontSize: 11,
    color: '#64748B',
  },
  oppNoText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
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
