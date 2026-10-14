import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ServerConfigModal } from './ServerConfigModal';

interface HeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, refreshing }) => {
  const { user, logout } = useAuth();
  const [showConfig, setShowConfig] = useState(false);

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return '#4F46E5';
      case 'MANAGER':
        return '#0284C7';
      case 'SALES_EXEC':
        return '#D97706';
      case 'SERVICE_ENG':
        return '#059669';
      default:
        return '#64748B';
    }
  };

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'System Admin';
      case 'MANAGER':
        return 'Branch Manager';
      case 'SALES_EXEC':
        return 'Sales Executive';
      case 'SERVICE_ENG':
        return 'Service Engineer';
      default:
        return role || 'User';
    }
  };

  return (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.leftRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>FV</Text>
          </View>
          <View>
            <Text style={styles.appTitle}>Field Visit CRM</Text>
            {user && (
              <View style={styles.userRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: `${getRoleColor(user.role)}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      { color: getRoleColor(user.role) },
                    ]}
                  >
                    {getRoleTitle(user.role)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightActions}>
          {onRefresh && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Text style={styles.actionIcon}>{refreshing ? '⏳' : '🔄'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowConfig(true)}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ServerConfigModal
        visible={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 15,
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
  },
});
