import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface MoreHubScreenProps {
  onNavigateTab: (tab: string) => void;
  pendingApprovalsCount?: number;
}

export const MoreHubScreen: React.FC<MoreHubScreenProps> = ({
  onNavigateTab,
  pendingApprovalsCount = 0,
}) => {
  const { user } = useAuth();
  const roleUpper = (user?.role || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPERADMIN';
  const isManagerOrAdmin = isAdmin || roleUpper === 'MANAGER';

  const modules = [
    // Core Modules
    {
      key: 'visits',
      title: 'Daily Visits & Claims',
      sub: 'Log customer visits, odometer KM & fuel reimbursements',
      icon: '📋',
      color: '#4F46E5',
      visible: true,
    },
    {
      key: 'approvals',
      title: 'Manager Approvals',
      sub: 'Review, approve or reject pending field expense claims',
      icon: '🛡️',
      color: '#0EA5E9',
      badge: pendingApprovalsCount,
      visible: isManagerOrAdmin,
    },
    {
      key: 'opportunities',
      title: 'Sales Pipeline (Deals)',
      sub: 'Manage leads, proposals, deal values & follow-ups',
      icon: '🎯',
      color: '#F59E0B',
      visible: true,
    },
    {
      key: 'quotations',
      title: 'Formal Quotations',
      sub: 'Generate price quotes with locked master item rates',
      icon: '📄',
      color: '#10B981',
      visible: true,
    },
    {
      key: 'customers',
      title: 'Customer Directory',
      sub: 'Client organizations, branch sites and staff contacts',
      icon: '🏢',
      color: '#6366F1',
      visible: true,
    },
    // Admin & Master Governance
    {
      key: 'users',
      title: 'User Management & Geo-Security',
      sub: 'Manage staff, 2FA enforcement, geo-fencing & unlock accounts',
      icon: '👥',
      color: '#DC2626',
      badgeText: 'Admin',
      visible: isAdmin,
    },
    {
      key: 'masters',
      title: 'Master Catalog & Fuel Rates',
      sub: 'Grade fuel rates (₹/km), product pricing & expense heads',
      icon: '⛽',
      color: '#D97706',
      badgeText: 'Admin',
      visible: isManagerOrAdmin,
    },
    {
      key: 'audit_logs',
      title: 'Security Audit & Login Logs',
      sub: 'Monitor authentication attempts, IPs & security events',
      icon: '🔐',
      color: '#7C3AED',
      badgeText: 'Admin',
      visible: isAdmin,
    },
    {
      key: 'profile',
      title: 'My Profile & Server Settings',
      sub: 'Account details, active branch and server endpoint configuration',
      icon: '👤',
      color: '#475569',
      visible: true,
    },
  ];

  const visibleModules = modules.filter((m) => m.visible);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>{user?.role || 'EXECUTIVE'}</Text>
        </View>
        <Text style={styles.bannerTitle}>Enterprise Navigation Hub</Text>
        <Text style={styles.bannerSub}>
          Access all CRM business operations, sales pipelines, and administrative governance controls.
        </Text>
      </View>

      {/* Module Grid */}
      <View style={styles.grid}>
        {visibleModules.map((mod) => (
          <TouchableOpacity
            key={mod.key}
            style={styles.card}
            onPress={() => onNavigateTab(mod.key)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: mod.color + '15' }]}>
                <Text style={styles.cardIcon}>{mod.icon}</Text>
              </View>
              {mod.badge && mod.badge > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{mod.badge}</Text>
                </View>
              ) : mod.badgeText ? (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>{mod.badgeText}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>
              {mod.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  banner: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  bannerBadgeText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '700',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  notifBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
