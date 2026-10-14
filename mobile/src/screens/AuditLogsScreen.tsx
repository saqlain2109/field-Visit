import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { apiFetch } from '../config/api';

interface LoginLogItem {
  id: number;
  email: string;
  employeeName?: string;
  ipAddress: string;
  country?: string;
  browser?: string;
  operatingSystem?: string;
  loginStatus: string;
  failureReason?: string;
  loginTimestamp?: string;
  createdAt?: string;
}

interface AuditLogsScreenProps {
  onBack?: () => void;
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await apiFetch<any>('/auth/login-logs?page=0&size=50');
      if (res && res.content) {
        setLogs(res.content);
      } else if (Array.isArray(res)) {
        setLogs(res);
      }
    } catch (e: any) {
      console.warn('Failed to load login logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((item) => {
    const statusMatch =
      filter === 'ALL'
        ? true
        : filter === 'SUCCESS'
        ? item.loginStatus?.toLowerCase() === 'success'
        : item.loginStatus?.toLowerCase() !== 'success';

    const searchMatch =
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      (item.employeeName && item.employeeName.toLowerCase().includes(search.toLowerCase())) ||
      (item.ipAddress && item.ipAddress.includes(search));

    return statusMatch && searchMatch;
  });

  const renderItem = ({ item }: { item: LoginLogItem }) => {
    const isSuccess = item.loginStatus?.toLowerCase() === 'success';
    const timeStr = item.loginTimestamp || item.createdAt || '';
    const formattedDate = timeStr ? new Date(timeStr).toLocaleString('en-IN') : 'Recent';

    return (
      <View style={[styles.logCard, !isSuccess && styles.failedCard]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusIconBox, isSuccess ? styles.successBox : styles.failedBox]}>
            <Text style={styles.statusIcon}>{isSuccess ? '✅' : '❌'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.employeeName || item.email}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
            <Text style={[styles.statusBadgeText, isSuccess ? styles.successText : styles.failedText]}>
              {isSuccess ? 'SUCCESS' : 'FAILED'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>🌐 IP: <Text style={styles.metaVal}>{item.ipAddress || 'Unknown'}</Text></Text>
          <Text style={styles.metaItem}>📍 Country: <Text style={styles.metaVal}>{item.country || 'India'}</Text></Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>📱 OS/Device: <Text style={styles.metaVal}>{item.operatingSystem || 'Android'} ({item.browser || 'Mobile'})</Text></Text>
          <Text style={styles.metaItem}>⏰ <Text style={styles.metaVal}>{formattedDate}</Text></Text>
        </View>

        {!isSuccess && item.failureReason ? (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>⚠️ {item.failureReason}</Text>
          </View>
        ) : null}
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
          <Text style={styles.screenTitle}>Security & Audit Logs</Text>
          <Text style={styles.screenSub}>{logs.length} Login Access Events Recorded</Text>
        </View>
        <TouchableOpacity style={styles.headerRefreshBtn} onPress={fetchLogs}>
          <Text style={styles.headerRefreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by email, name or IP..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'ALL' && styles.filterBtnActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterBtnText, filter === 'ALL' && styles.filterBtnTextActive]}>
            All Logs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'SUCCESS' && styles.filterBtnActive]}
          onPress={() => setFilter('SUCCESS')}
        >
          <Text style={[styles.filterBtnText, filter === 'SUCCESS' && styles.filterBtnTextActive]}>
            ✅ Success
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'FAILED' && styles.filterBtnActive]}
          onPress={() => setFilter('FAILED')}
        >
          <Text style={[styles.filterBtnText, filter === 'FAILED' && styles.filterBtnTextActive]}>
            ❌ Failed / Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Fetching Security Audit Stream...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No Security Logs</Text>
              <Text style={styles.emptySub}>No authentication events found matching your filter.</Text>
            </View>
          }
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  failedCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  successBox: {
    backgroundColor: '#ECFDF5',
  },
  failedBox: {
    backgroundColor: '#FEE2E2',
  },
  statusIcon: {
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
  },
  failedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  successText: {
    color: '#059669',
  },
  failedText: {
    color: '#DC2626',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaItem: {
    fontSize: 11,
    color: '#64748B',
  },
  metaVal: {
    fontWeight: '600',
    color: '#1E293B',
  },
  reasonBox: {
    marginTop: 8,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
  },
  reasonText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
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
});
