import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { apiFetch } from '../config/api';

interface EmployeeItem {
  id: number;
  employeeNo: string;
  name: string;
  email: string;
  mobileNo?: string;
  role: string;
  status: string;
  grade?: string;
  branch?: string;
  branchName?: string;
  department?: string;
  departmentName?: string;
  designation?: string;
  designationTitle?: string;
  is2faEnabled?: boolean;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  isRegionRestricted?: boolean;
  allowedRegions?: string;
  allowedLatitude?: number;
  allowedLongitude?: number;
  allowedRadiusKm?: number;
}

interface UserManagementScreenProps {
  onRefresh?: () => void;
  onBack?: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onRefresh, onBack }) => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Edit Geo-fence Modal
  const [selectedUser, setSelectedUser] = useState<EmployeeItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRadius, setEditRadius] = useState('25');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editRegion, setEditRegion] = useState('IN');
  const [saving, setSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      const data = await apiFetch<EmployeeItem[]>('/employees');
      setEmployees(data || []);
    } catch (e: any) {
      console.warn('Failed to load employees:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmployees();
  };

  const handleUnlock = async (user: EmployeeItem) => {
    Alert.alert(
      'Unlock Account',
      `Are you sure you want to unlock ${user.name}'s account and reset failed attempts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          style: 'default',
          onPress: async () => {
            try {
              await apiFetch(`/employees/${user.id}/unlock`, { method: 'PUT' });
              Alert.alert('Success', `${user.name} has been unlocked.`);
              fetchEmployees();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to unlock user');
            }
          },
        },
      ]
    );
  };

  const openGeoModal = (user: EmployeeItem) => {
    setSelectedUser(user);
    setEditLat(user.allowedLatitude != null ? String(user.allowedLatitude) : '19.0760');
    setEditLng(user.allowedLongitude != null ? String(user.allowedLongitude) : '72.8777');
    setEditRadius(user.allowedRadiusKm != null ? String(user.allowedRadiusKm) : '25');
    setEditRegion(user.allowedRegions || 'IN');
    setEditModalVisible(true);
  };

  const saveGeoFencing = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await apiFetch(`/employees/${selectedUser.id}/region-restriction`, {
        method: 'PUT',
        body: JSON.stringify({
          isRegionRestricted: true,
          allowedRegions: editRegion.trim().toUpperCase() || 'IN',
          allowedLatitude: editLat ? parseFloat(editLat) : null,
          allowedLongitude: editLng ? parseFloat(editLng) : null,
          allowedRadiusKm: editRadius ? parseFloat(editRadius) : 25,
        }),
      });
      Alert.alert('Saved', `Geo-security updated for ${selectedUser.name}`);
      setEditModalVisible(false);
      fetchEmployees();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update geo-fencing');
    } finally {
      setSaving(false);
    }
  };

  const roles = [
    { key: 'ALL', label: 'All' },
    { key: 'ADMIN', label: 'Admins' },
    { key: 'MANAGER', label: 'Managers' },
    { key: 'SALES_EXEC', label: 'Sales' },
    { key: 'SERVICE_ENG', label: 'Service' },
  ];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.employeeNo && emp.employeeNo.includes(search));
    const matchesRole = filterRole === 'ALL' || emp.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#4F46E5';
      case 'MANAGER':
        return '#0EA5E9';
      case 'SALES_EXEC':
        return '#F59E0B';
      case 'SERVICE_ENG':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  const renderItem = ({ item }: { item: EmployeeItem }) => {
    const isLocked = item.isLocked || (item.failedLoginAttempts && item.failedLoginAttempts >= 3);
    const badgeColor = getRoleBadgeColor(item.role);

    return (
      <View style={[styles.userCard, isLocked && styles.lockedCard]}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: badgeColor }]}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.badgeCol}>
            <View style={[styles.roleBadge, { backgroundColor: badgeColor + '18' }]}>
              <Text style={[styles.roleBadgeText, { color: badgeColor }]}>{item.role}</Text>
            </View>
            {isLocked ? (
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>🔒 Locked</Text>
              </View>
            ) : (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
        </View>

        {/* Metadata Details */}
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Emp No: <Text style={styles.detailVal}>{item.employeeNo || 'N/A'}</Text></Text>
          <Text style={styles.detailLabel}>Branch: <Text style={styles.detailVal}>{item.branchName || item.branch || 'Mumbai HQ'}</Text></Text>
        </View>

        {/* Geo-Security & 2FA Info Box */}
        <View style={styles.securityBox}>
          <View style={styles.secItem}>
            <Text style={styles.secIcon}>📍</Text>
            <View>
              <Text style={styles.secTitle}>Geo-Fencing</Text>
              <Text style={styles.secSub}>
                {item.allowedRadiusKm ? `${item.allowedRadiusKm} km radius` : 'Default 25 km'} ({item.allowedRegions || 'IN'})
              </Text>
            </View>
          </View>
          <View style={styles.secItem}>
            <Text style={styles.secIcon}>🛡️</Text>
            <View>
              <Text style={styles.secTitle}>2FA Security</Text>
              <Text style={styles.secSub}>
                {item.is2faEnabled !== false ? 'Enforced' : 'Optional'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.geoButton}
            onPress={() => openGeoModal(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.geoButtonText}>📍 Edit Geo-Fence</Text>
          </TouchableOpacity>

          {isLocked && (
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => handleUnlock(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.unlockButtonText}>🔓 Unlock Account</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
          <Text style={styles.screenTitle}>Staff & Users</Text>
          <Text style={styles.screenSub}>{employees.length} Registered Accounts</Text>
        </View>
        <TouchableOpacity style={styles.headerRefreshBtn} onPress={handleRefresh}>
          <Text style={styles.headerRefreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Search Header */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or employee no..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Role Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.filterChip, filterRole === r.key && styles.filterChipActive]}
              onPress={() => setFilterRole(r.key)}
            >
              <Text style={[styles.filterChipText, filterRole === r.key && styles.filterChipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Employee List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading Security Accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Employees Found</Text>
              <Text style={styles.emptySub}>No users match the search filter.</Text>
            </View>
          }
        />
      )}

      {/* Edit Geo-Fence Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📍 Configure Geo-Security</Text>
            <Text style={styles.modalSub}>{selectedUser?.name} ({selectedUser?.email})</Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Allowed Region Code (e.g. IN, AE, US)</Text>
              <TextInput
                style={styles.modalInput}
                value={editRegion}
                onChangeText={setEditRegion}
                placeholder="IN"
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Allowed Radius (KM from Base Location)</Text>
              <TextInput
                style={styles.modalInput}
                value={editRadius}
                onChangeText={setEditRadius}
                keyboardType="numeric"
                placeholder="25"
              />

              <Text style={styles.inputLabel}>Base Latitude (GPS Coordinate)</Text>
              <TextInput
                style={styles.modalInput}
                value={editLat}
                onChangeText={setEditLat}
                keyboardType="numeric"
                placeholder="19.0760"
              />

              <Text style={styles.inputLabel}>Base Longitude (GPS Coordinate)</Text>
              <TextInput
                style={styles.modalInput}
                value={editLng}
                onChangeText={setEditLng}
                keyboardType="numeric"
                placeholder="72.8777"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveGeoFencing}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Geo-Fence</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearch: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ECFDF5',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  detailVal: {
    fontWeight: '600',
    color: '#1E293B',
  },
  securityBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  secItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secIcon: {
    fontSize: 18,
  },
  secTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  secSub: {
    fontSize: 10,
    color: '#64748B',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  geoButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  geoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  unlockButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  unlockButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
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
  modalForm: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
