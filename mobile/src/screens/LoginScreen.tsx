import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { useAuth, ROLE_PRESETS } from '../context/AuthContext';
import { ServerConfigModal } from '../components/ServerConfigModal';

export const LoginScreen: React.FC = () => {
  const {
    login,
    verify2FA,
    cancel2FA,
    twoFactorChallenge,
    coords,
    locationStatus,
    requestLocation,
    serverUrl,
  } = useAuth();

  const [identifier, setIdentifier] = useState('admin@crm.com');
  const [password, setPassword] = useState('Password@123');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // 2FA Dialog State
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleSelectRole = (presetId: string) => {
    const preset = ROLE_PRESETS.find((r) => r.id === presetId);
    if (preset) {
      setSelectedRole(preset.id);
      setIdentifier(preset.email);
      setPassword(preset.password);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Required', 'Please enter your email/employee number and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res?.requires2FA && res.devOtp) {
        setOtpInput(res.devOtp);
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code.');
      return;
    }
    setVerifyingOtp(true);
    try {
      await verify2FA(otpInput);
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid verification code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Server Host Banner */}
        <TouchableOpacity style={styles.serverPill} onPress={() => setShowConfig(true)}>
          <View style={styles.serverDot} />
          <Text style={styles.serverPillText} numberOfLines={1}>
            Server: {serverUrl}
          </Text>
          <Text style={styles.serverConfigIcon}>⚙️</Text>
        </TouchableOpacity>

        {/* Brand Banner */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>FV</Text>
          </View>
          <Text style={styles.brandTitle}>Field Visit CRM</Text>
          <Text style={styles.brandTagline}>Enterprise Mobile Field Service & Sales System</Text>
        </View>

        {/* Location Security Status Card */}
        <View style={styles.locationCard}>
          <Text style={styles.locationIcon}>
            {locationStatus === 'granted' ? '🛡️' : '📍'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>
              {locationStatus === 'granted'
                ? 'Workplace Geo-Security Active'
                : 'Physical Location Verification'}
            </Text>
            <Text style={styles.locationSubtitle}>
              {coords
                ? `GPS Coordinates: (${coords.latitude.toFixed(3)}°, ${coords.longitude.toFixed(3)}°)`
                : 'Workplace policy verifies physical coordinates before login.'}
            </Text>
          </View>
          {locationStatus !== 'granted' && (
            <TouchableOpacity style={styles.locRetryBtn} onPress={requestLocation}>
              <Text style={styles.locRetryText}>Allow</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Sign In to Account</Text>

          {/* Quick Role Switcher */}
          <Text style={styles.inputLabel}>⚡ Quick Login Role Preset:</Text>
          <View style={styles.roleGrid}>
            {ROLE_PRESETS.map((preset) => {
              const active = selectedRole === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.roleBtn,
                    active && { borderColor: preset.badgeColor, backgroundColor: `${preset.badgeColor}15` },
                  ]}
                  onPress={() => handleSelectRole(preset.id)}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      active && { color: preset.badgeColor, fontWeight: '800' },
                    ]}
                  >
                    {preset.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Email / EmpNo Input */}
          <Text style={styles.inputLabel}>Email / Employee Number</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={(t) => {
              setIdentifier(t);
              setSelectedRole('');
            }}
            placeholder="e.g. admin@crm.com / EMP-1001"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password Input */}
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(p) => {
              setPassword(p);
              setSelectedRole('');
            }}
            placeholder="Enter password"
            secureTextEntry
          />

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>SIGN IN TO MOBILE CRM</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Powered by Spring Boot Security & SQL Server DB
          </Text>
        </View>
      </ScrollView>

      {/* 2-Step Verification Modal */}
      <Modal visible={!!twoFactorChallenge} transparent animationType="fade">
        <View style={styles.mfaOverlay}>
          <View style={styles.mfaCard}>
            <Text style={styles.mfaTitle}>🔐 2-Step Verification</Text>
            <Text style={styles.mfaSubtitle}>
              A 6-digit security verification code has been dispatched to{' '}
              <Text style={{ fontWeight: '700' }}>
                {twoFactorChallenge?.maskedEmail || 'your email'}
              </Text>
              .
            </Text>

            {twoFactorChallenge?.devOtp && (
              <View style={styles.devOtpBox}>
                <Text style={styles.devOtpLabel}>DEV / DEMO OTP CODE:</Text>
                <Text style={styles.devOtpCode}>{twoFactorChallenge.devOtp}</Text>
              </View>
            )}

            <TextInput
              style={styles.otpInput}
              value={otpInput}
              onChangeText={setOtpInput}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.mfaActionRow}>
              <TouchableOpacity
                style={styles.mfaCancelBtn}
                onPress={cancel2FA}
                disabled={verifyingOtp}
              >
                <Text style={styles.mfaCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mfaSubmitBtn}
                onPress={handleVerify2FA}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.mfaSubmitText}>Verify & Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Server Config Modal */}
      <ServerConfigModal visible={showConfig} onClose={() => setShowConfig(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
    marginBottom: 16,
    maxWidth: '92%',
  },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  serverPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730A3',
    flex: 1,
  },
  serverConfigIcon: {
    fontSize: 13,
    marginLeft: 6,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 26,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    gap: 10,
  },
  locationIcon: {
    fontSize: 22,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  locationSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  locRetryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  locRetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  footerNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  mfaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  mfaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  mfaTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  mfaSubtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  devOtpBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  devOtpLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  devOtpCode: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 4,
    marginTop: 2,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 18,
  },
  mfaActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mfaCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  mfaCancelText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  mfaSubmitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  mfaSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
