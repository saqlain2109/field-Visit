import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { DailyVisit } from '../types';

interface DailyVisitsScreenProps {
  visits: DailyVisit[];
  loading: boolean;
  onOpenLogVisit: () => void;
  onRefresh: () => void;
}

export const DailyVisitsScreen: React.FC<DailyVisitsScreenProps> = ({
  visits,
  loading,
  onOpenLogVisit,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = ['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED'];

  const filteredVisits = visits.filter((v) => {
    const matchesStatus =
      filterStatus === 'ALL' ||
      v.status?.toUpperCase() === filterStatus.toUpperCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (v.customer?.name && v.customer.name.toLowerCase().includes(q)) ||
      (v.placeTo && v.placeTo.toLowerCase().includes(q)) ||
      (v.placeFrom && v.placeFrom.toLowerCase().includes(q)) ||
      (v.activityType?.name && v.activityType.name.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Top Action & Filter Row */}
      <View style={styles.topControlSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="🔍 Search visits by customer, place, activity..."
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.addBtn} onPress={onOpenLogVisit}>
            <Text style={styles.addBtnText}>+ Log Visit</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterChipRow}>
          {filterTabs.map((status) => {
            const active = filterStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Visits List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading daily visit logs...</Text>
        </View>
      ) : filteredVisits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Visits Found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery
              ? 'No visits matched your search filter.'
              : 'Tap "+ Log Visit" to create your first field visit report.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredVisits}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={loading}
          renderItem={({ item }) => {
            const isApproved = item.status === 'Approved';
            const isRejected = item.status === 'Rejected';
            const isSubmitted = item.status === 'Submitted';

            const fuelExpense = (item.expenses || []).find((e) => e.expenseHeadId === 11 || (e.dayEndKm && e.dayEndKm > 0));
            const totalClaim = (item.expenses || []).reduce(
              (acc, curr) => acc + (parseFloat(String(curr.amount)) || 0),
              0
            );

            return (
              <View style={styles.card}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>
                      {item.customer?.name || 'Customer Visit'}
                    </Text>
                    <Text style={styles.activityBadge}>
                      ⚡ {item.activityType?.name || 'Field Service'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isApproved && styles.pillApproved,
                      isRejected && styles.pillRejected,
                      isSubmitted && styles.pillSubmitted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isApproved && styles.pillApprovedText,
                        isRejected && styles.pillRejectedText,
                        isSubmitted && styles.pillSubmittedText,
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Route & Schedule */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>
                    📍 <Text style={{ fontWeight: '700' }}>Route:</Text> {item.placeFrom} → {item.placeTo}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>
                    📅 <Text style={{ fontWeight: '700' }}>Date:</Text>{' '}
                    {item.visitDate ? new Date(item.visitDate).toLocaleDateString('en-IN') : '-'} (
                    {item.startTime} - {item.endTime})
                  </Text>
                </View>

                {/* Product / Machine */}
                {item.product && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailText}>
                      📦 <Text style={{ fontWeight: '700' }}>Machine:</Text> {item.product.name}
                    </Text>
                  </View>
                )}

                {/* Odometer & Calculation Box */}
                {fuelExpense && (
                  <View style={styles.odometerBox}>
                    <View style={styles.odoItem}>
                      <Text style={styles.odoLabel}>Start KM</Text>
                      <Text style={styles.odoVal}>{fuelExpense.dayStartKm || 0}</Text>
                    </View>
                    <Text style={styles.odoArrow}>→</Text>
                    <View style={styles.odoItem}>
                      <Text style={styles.odoLabel}>End KM</Text>
                      <Text style={styles.odoVal}>{fuelExpense.dayEndKm || 0}</Text>
                    </View>
                    <Text style={styles.odoArrow}>=</Text>
                    <View style={styles.odoItem}>
                      <Text style={styles.odoLabel}>Total</Text>
                      <Text style={styles.odoValBold}>{fuelExpense.totalKm || 0} KM</Text>
                    </View>
                    <View style={styles.odoItem}>
                      <Text style={styles.odoLabel}>Rate</Text>
                      <Text style={styles.odoRate}>₹{fuelExpense.fuelRate || 11.5}/km</Text>
                    </View>
                  </View>
                )}

                {/* Rejection / Approval Notes */}
                {isRejected && item.rejectionReason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionText}>
                      ❌ Rejection Reason: {item.rejectionReason}
                    </Text>
                  </View>
                )}

                {isApproved && item.approvedBy && (
                  <View style={styles.approvalBox}>
                    <Text style={styles.approvalText}>
                      ✅ Approved by {item.approvedBy}
                    </Text>
                  </View>
                )}

                {/* Footer Claim Amount */}
                <View style={styles.cardFooter}>
                  <Text style={styles.claimTitle}>Total Reimbursement Claim:</Text>
                  <Text style={styles.claimAmount}>
                    ₹{Math.round(totalClaim).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topControlSection: {
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
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
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
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  activityBadge: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pillApproved: {
    backgroundColor: '#DCFCE7',
  },
  pillApprovedText: {
    color: '#15803D',
  },
  pillRejected: {
    backgroundColor: '#FEE2E2',
  },
  pillRejectedText: {
    color: '#B91C1C',
  },
  pillSubmitted: {
    backgroundColor: '#EFF6FF',
  },
  pillSubmittedText: {
    color: '#2563EB',
  },
  detailRow: {
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  odometerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  odoItem: {
    alignItems: 'center',
  },
  odoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  odoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  odoValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
    marginTop: 1,
  },
  odoRate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1,
  },
  odoArrow: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  rejectionText: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '600',
  },
  approvalBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  approvalText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  claimTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  claimAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
});
