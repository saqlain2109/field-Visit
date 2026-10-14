import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../config/api';
import { DailyVisit } from '../types';

interface ApprovalsScreenProps {
  visits: DailyVisit[];
  loading: boolean;
  onRefresh: () => void;
}

export const ApprovalsScreen: React.FC<ApprovalsScreenProps> = ({
  visits,
  loading,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Approval / Rejection modal state
  const [activeVisit, setActiveVisit] = useState<DailyVisit | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [remarksInput, setRemarksInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const pendingVisits = visits.filter((v) => v.status === 'Submitted');

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const handleOpenActionModal = (visit: DailyVisit, action: 'approve' | 'reject') => {
    setActiveVisit(visit);
    setModalAction(action);
    setRemarksInput(action === 'approve' ? 'Approved as per company travel policy.' : '');
    setModalVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!activeVisit) return;
    if (modalAction === 'reject' && !remarksInput.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }

    setProcessingId(activeVisit.id);
    setModalVisible(false);

    try {
      if (modalAction === 'approve') {
        await apiFetch(`/daily-visits/${activeVisit.id}/approve`, {
          method: 'POST',
          body: JSON.stringify({
            remarks: remarksInput.trim() || 'Approved',
            approvedBy: user?.name || 'Manager',
          }),
        });
        Alert.alert('Approved 🎉', `Visit claim for ${activeVisit.customer?.name || 'Visit'} has been approved!`);
      } else {
        await apiFetch(`/daily-visits/${activeVisit.id}/reject`, {
          method: 'POST',
          body: JSON.stringify({
            reason: remarksInput.trim(),
            rejectedBy: user?.name || 'Manager',
          }),
        });
        Alert.alert('Rejected ⚠️', `Visit claim rejected.`);
      }
      onRefresh();
    } catch (err: any) {
      Alert.alert('Action Error', err.message || 'Failed to update approval status.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdminOrManager) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.lockIcon}>🛡️</Text>
        <Text style={styles.lockTitle}>Managerial Approvals</Text>
        <Text style={styles.lockSubtitle}>
          This section is reserved for Branch Managers and Administrators to review and approve field visit expense claims.
        </Text>
        <Text style={styles.lockRole}>Your current role: {user?.role || 'Guest'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View>
          <Text style={styles.bannerTitle}>Manager Review Portal</Text>
          <Text style={styles.bannerSubtitle}>
            {pendingVisits.length} Pending Field Visit & Expense Claims
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Fetching pending approvals...</Text>
        </View>
      ) : pendingVisits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubText}>
            There are no pending daily visits or fuel claims requiring your approval right now.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingVisits}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={loading}
          renderItem={({ item }) => {
            const fuelExpense = (item.expenses || []).find((e) => e.expenseHeadId === 11 || (e.dayEndKm && e.dayEndKm > 0));
            const totalClaim = (item.expenses || []).reduce(
              (acc, curr) => acc + (parseFloat(String(curr.amount)) || 0),
              0
            );
            const isProcessing = processingId === item.id;

            return (
              <View style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>
                      {item.customer?.name || 'Customer Visit'}
                    </Text>
                    <Text style={styles.engineerText}>
                      👤 Engineer ID #{item.employeeId} • {item.activityType?.name || 'Visit'}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>PENDING</Text>
                  </View>
                </View>

                {/* Route & Date */}
                <Text style={styles.routeText}>📍 Route: {item.placeFrom} → {item.placeTo}</Text>
                <Text style={styles.dateText}>
                  📅 Date: {item.visitDate ? new Date(item.visitDate).toLocaleDateString('en-IN') : '-'} (
                  {item.startTime} - {item.endTime})
                </Text>

                {/* Odometer Calculation */}
                {fuelExpense && (
                  <View style={styles.odoCard}>
                    <Text style={styles.odoText}>
                      Odometer: <Text style={{ fontWeight: '700' }}>{fuelExpense.dayStartKm}</Text> →{' '}
                      <Text style={{ fontWeight: '700' }}>{fuelExpense.dayEndKm}</Text> ({fuelExpense.totalKm} KM @ ₹{fuelExpense.fuelRate}/km)
                    </Text>
                    {fuelExpense.tollTax ? (
                      <Text style={styles.tollText}>+ Toll Tax: ₹{fuelExpense.tollTax}</Text>
                    ) : null}
                  </View>
                )}

                {item.remarks ? (
                  <Text style={styles.remarksText}>💬 Notes: "{item.remarks}"</Text>
                ) : null}

                {/* Total Claim */}
                <View style={styles.claimRow}>
                  <Text style={styles.claimLabel}>Total Claim Amount:</Text>
                  <Text style={styles.claimValue}>₹{Math.round(totalClaim).toLocaleString('en-IN')}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleOpenActionModal(item, 'reject')}
                    disabled={isProcessing}
                  >
                    <Text style={styles.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleOpenActionModal(item, 'approve')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.approveBtnText}>✓ Approve Claim</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalAction === 'approve' ? '✅ Approve Visit Claim' : '⚠️ Reject Visit Claim'}
            </Text>
            <Text style={styles.modalSub}>
              {modalAction === 'approve'
                ? `Confirm approval of claim for ${activeVisit?.customer?.name || 'Visit'}.`
                : 'Please specify the rejection reason for the engineer:'}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={remarksInput}
              onChangeText={setRemarksInput}
              placeholder={modalAction === 'approve' ? 'Approval notes (optional)' : 'e.g. Mileage out of boundary, improper route...'}
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  modalAction === 'reject' && { backgroundColor: '#DC2626' },
                ]}
                onPress={handleConfirmAction}
              >
                <Text style={styles.modalConfirmText}>
                  {modalAction === 'approve' ? 'Confirm Approval' : 'Reject Claim'}
                </Text>
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
  topBanner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  lockRole: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
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
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  engineerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  routeText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  odoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  odoText: {
    fontSize: 12,
    color: '#334155',
  },
  tollText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  remarksText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#64748B',
    marginBottom: 8,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 10,
  },
  claimLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  claimValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  approveBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    height: 70,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
