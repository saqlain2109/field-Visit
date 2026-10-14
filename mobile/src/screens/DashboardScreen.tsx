import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DailyVisit, Opportunity, Customer } from '../types';

interface DashboardScreenProps {
  visits: DailyVisit[];
  opportunities: Opportunity[];
  customers: Customer[];
  loading: boolean;
  onOpenLogVisit: () => void;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  visits,
  opportunities,
  customers,
  loading,
  onOpenLogVisit,
  onNavigateTab,
  onRefresh,
}) => {
  const { user } = useAuth();

  // Metrics calculation
  const approvedVisits = visits.filter((v) => v.status === 'Approved');
  const pendingVisits = visits.filter((v) => v.status === 'Submitted');
  const totalReimbursed = approvedVisits.reduce((acc, curr) => {
    const claim = (curr.expenses || []).reduce((eAcc, e) => eAcc + (Number(e.amount) || 0), 0);
    return acc + claim;
  }, 0);
  const totalPipeline = opportunities.reduce((acc, curr) => acc + (Number(curr.expectedValue) || 0), 0);

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const getFuelRateText = (): string => {
    switch (user?.grade) {
      case 'GRADE_A':
        return '₹14.00 / km';
      case 'GRADE_B':
        return '₹11.50 / km';
      case 'GRADE_C':
        return '₹9.00 / km';
      case 'GRADE_D':
        return '₹6.50 / km';
      default:
        return '₹11.50 / km';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* User Status Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeLeft}>
          <Text style={styles.welcomeGreeting}>Welcome back,</Text>
          <Text style={styles.userNameText}>{user?.name || 'Field Professional'}</Text>
          <Text style={styles.userBranchText}>
            Branch: {user?.branch?.name || 'Headquarters'} • {user?.department?.name || 'Field Operations'}
          </Text>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeBadgeLabel}>ALLOWANCE RATE</Text>
          <Text style={styles.gradeBadgeValue}>{getFuelRateText()}</Text>
          <Text style={styles.gradeBadgeSub}>{user?.grade?.replace('_', ' ') || 'Grade B'}</Text>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <Text style={styles.sectionTitle}>Executive Metrics & Performance</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
          <Text style={styles.statLabel}>Total Visits</Text>
          <Text style={styles.statNumber}>{visits.length}</Text>
          <Text style={styles.statSubText}>{approvedVisits.length} Approved</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statLabel}>Reimbursed Claims</Text>
          <Text style={styles.statNumber}>₹{Math.round(totalReimbursed).toLocaleString('en-IN')}</Text>
          <Text style={styles.statSubText}>Approved Claims</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statLabel}>Pending Reviews</Text>
          <Text style={[styles.statNumber, { color: '#D97706' }]}>{pendingVisits.length}</Text>
          <Text style={styles.statSubText}>Awaiting Manager</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
          <Text style={styles.statLabel}>Active Pipeline</Text>
          <Text style={styles.statNumber}>₹{Math.round(totalPipeline).toLocaleString('en-IN')}</Text>
          <Text style={styles.statSubText}>{opportunities.length} Opportunities</Text>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <Text style={styles.sectionTitle}>Quick Operations</Text>
      <View style={styles.quickActionRow}>
        <TouchableOpacity style={styles.actionPrimaryBtn} onPress={onOpenLogVisit}>
          <Text style={styles.actionBtnIcon}>✍️</Text>
          <Text style={styles.actionPrimaryText}>Log Daily Visit</Text>
          <Text style={styles.actionPrimarySub}>Calculate fuel & claim</Text>
        </TouchableOpacity>

        {isAdminOrManager ? (
          <TouchableOpacity
            style={[styles.actionSecondaryBtn, { borderColor: '#F59E0B' }]}
            onPress={() => onNavigateTab('approvals')}
          >
            <Text style={styles.actionBtnIcon}>🛡️</Text>
            <Text style={[styles.actionSecondaryText, { color: '#B45309' }]}>Approvals</Text>
            <Text style={styles.actionSecondarySub}>{pendingVisits.length} pending</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionSecondaryBtn}
            onPress={() => onNavigateTab('opportunities')}
          >
            <Text style={styles.actionBtnIcon}>🎯</Text>
            <Text style={styles.actionSecondaryText}>Opportunities</Text>
            <Text style={styles.actionSecondarySub}>View pipeline</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionSecondaryBtn}
          onPress={() => onNavigateTab('customers')}
        >
          <Text style={styles.actionBtnIcon}>🏢</Text>
          <Text style={styles.actionSecondaryText}>Customers</Text>
          <Text style={styles.actionSecondarySub}>{customers.length} companies</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Visits Feed */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Daily Visits</Text>
        <TouchableOpacity onPress={() => onNavigateTab('visits')}>
          <Text style={styles.viewAllText}>View All ({visits.length}) →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />
      ) : visits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Visits Logged Yet</Text>
          <Text style={styles.emptySub}>Tap "Log Daily Visit" above to submit your first visit report.</Text>
        </View>
      ) : (
        visits.slice(0, 4).map((v) => {
          const totalClaim = (v.expenses || []).reduce(
            (acc, curr) => acc + (parseFloat(String(curr.amount)) || 0),
            0
          );
          const isApproved = v.status === 'Approved';
          const isRejected = v.status === 'Rejected';

          return (
            <View key={v.id} style={styles.visitCard}>
              <View style={styles.visitCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{v.customer?.name || 'Customer Visit'}</Text>
                  <Text style={styles.routeText}>📍 {v.placeFrom} → {v.placeTo}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isApproved && styles.badgeApproved,
                    isRejected && styles.badgeRejected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isApproved && styles.badgeApprovedText,
                      isRejected && styles.badgeRejectedText,
                    ]}
                  >
                    {v.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.visitCardFooter}>
                <Text style={styles.visitDate}>
                  📅 {v.visitDate ? new Date(v.visitDate).toLocaleDateString('en-IN') : '-'}
                </Text>
                <Text style={styles.claimAmount}>
                  Claim: ₹{Math.round(totalClaim).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  welcomeCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  welcomeLeft: {
    flex: 1,
    marginRight: 10,
  },
  welcomeGreeting: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  userBranchText: {
    fontSize: 11,
    color: '#C7D2FE',
    marginTop: 4,
  },
  gradeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gradeBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.5,
  },
  gradeBadgeValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#34D399',
    marginTop: 2,
  },
  gradeBadgeSub: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  statSubText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionPrimaryBtn: {
    flex: 1.4,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  actionPrimarySub: {
    color: '#C7D2FE',
    fontSize: 10,
    marginTop: 2,
  },
  actionSecondaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  actionSecondaryText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 12,
  },
  actionSecondarySub: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  visitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  routeText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  badgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  badgeApprovedText: {
    color: '#166534',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgeRejectedText: {
    color: '#991B1B',
  },
  visitCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  visitDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  claimAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
});
