import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { testServerConnection } from '../config/api';

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ visible, onClose }) => {
  const { serverUrl, updateServerUrl, resetServerUrlToDefault } = useAuth();
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const presets = [
    { label: '🖥️ PC Wi-Fi (Recommended)', url: 'http://192.168.0.139:4000/api' },
    { label: '🤖 Android Emulator', url: 'http://10.0.2.2:4000/api' },
    { label: '💻 Localhost (iOS/Web)', url: 'http://localhost:4000/api' },
  ];

  const handleTest = async () => {
    if (!inputUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testServerConnection(inputUrl.trim());
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!inputUrl.trim()) {
      Alert.alert('Error', 'Server URL cannot be empty');
      return;
    }
    await updateServerUrl(inputUrl.trim());
    Alert.alert('Server Configured', `Connected to: ${inputUrl.trim()}`);
    onClose();
  };

  const handleReset = async () => {
    const def = await resetServerUrlToDefault();
    setInputUrl(def);
    setTestResult(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>⚙️ Backend Server Config</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Connect the mobile app to your Spring Boot backend (running on port 4000):
          </Text>

          <Text style={styles.inputLabel}>Quick Presets:</Text>
          <View style={styles.presetsContainer}>
            {presets.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.presetBtn, inputUrl === p.url && styles.presetBtnActive]}
                onPress={() => {
                  setInputUrl(p.url);
                  setTestResult(null);
                }}
              >
                <Text style={[styles.presetText, inputUrl === p.url && styles.presetTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>API Base URL:</Text>
          <TextInput
            style={styles.input}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="http://192.168.0.139:4000/api"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {testResult && (
            <View
              style={[
                styles.resultBox,
                testResult.success ? styles.resultSuccess : styles.resultError,
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  testResult.success ? styles.resultTextSuccess : styles.resultTextError,
                ]}
              >
                {testResult.success ? '✅ ' : '❌ '}
                {testResult.message}
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTest}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color="#4F46E5" size="small" />
              ) : (
                <Text style={styles.testBtnText}>Test Ping</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save & Apply</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  presetText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  resultBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  resultSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  resultError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  resultTextSuccess: {
    color: '#15803D',
  },
  resultTextError: {
    color: '#B91C1C',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  testBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  resetBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
