import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ServerConfigModal } from '../components/ServerConfigModal';

export const ProfileScreen: React.FC = () => {
  const { user, logout, serverUrl, coords, locationStatus } = useAuth();
  const [showConfig, setShowConfig] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to log out of Field Visit CRM?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getFuelRate = (): string => {
    switch (user?.grade) {
      case 'GRADE_A':
        return '₹14.00 / KM';
      case 'GRADE_B':
        return '₹11.50 / KM';
      case 'GRADE_C':
        return '₹9.00 / KM';
      case 'GRADE_D':
        return '₹6.50 / KM';
      default:
        return '₹11.50 / KM';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>{user?.role?.replace('_', ' ')}</Text>
        <View style={styles.gradePill}>
          <Text style={styles.gradePillText}>
            {user?.grade?.replace('_', ' ') || 'Grade B'} • Fuel Rate: {getFuelRate()}
          </Text>
        </View>
      </View>

      {/* Employee Details Card */}
      <Text style={styles.sectionHeading}>Employee Identity & Branch</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee Number</Text>
          <Text style={styles.infoValue}>{user?.employeeNo || 'EMP-1001'}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Address</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile Number</Text>
          <Text style={styles.infoValue}>{user?.mobileNo || '+91 98765 43210'}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{user?.department?.name || 'Field Engineering'}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Branch</Text>
          <Text style={styles.infoValue}>{user?.branch?.name || 'Mumbai Head Office'}</Text>
        </View>
      </View>

      {/* Workplace Security & Geo-Fence */}
      <Text style={styles.sectionHeading}>Workplace Geo-Security Matrix</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location Permission</Text>
          <Text style={[styles.infoValue, { color: locationStatus === 'granted' ? '#059669' : '#DC2626' }]}>
            {locationStatus === 'granted' ? '✅ Granted' : '⚠️ Denied'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>GPS Coordinates</Text>
          <Text style={styles.infoValue}>
            {coords ? `${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°` : 'Acquiring...'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Geo-Zone</Text>
          <Text style={styles.infoValue}>{user?.allowedRegions || 'India (IN)'}</Text>
        </View>
      </View>

      {/* Server & Network Configuration */}
      <Text style={styles.sectionHeading}>Backend Connection</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>API Endpoint</Text>
          <Text style={[styles.infoValue, { fontSize: 12 }]} numberOfLines={1}>
            {serverUrl}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.configBtn}
          onPress={() => setShowConfig(true)}
        >
          <Text style={styles.configBtnText}>⚙️ Configure Server Host / IP</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>SIGN OUT OF CRM ACCOUNT</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Field Visit CRM Mobile v1.0.0 (React Native + Expo)</Text>

      <ServerConfigModal visible={showConfig} onClose={() => setShowConfig(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gradePill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  configBtn: {
    marginTop: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  configBtnText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
