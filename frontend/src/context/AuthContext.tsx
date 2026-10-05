import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { generateDeviceFingerprint, getBrowserProfileId } from '../utils/deviceFingerprint';

export interface User {
  id: number;
  employeeNo: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES_EXEC' | 'SERVICE_ENG';
  gender: string;
  branch: string | null;
  branchId: number;
  department: string | null;
  designation: string | null;
  grade?: string | null;
  mobileNo?: string | null;
  isPasswordSet?: boolean;
}

export interface MicrosoftAuthPayload {
  idToken?: string;
  accessToken?: string;
  email?: string;
  name?: string;
  azureAdOid?: string;
}

export interface ActiveSession {
  id: number;
  sessionId: string;
  loginTimestamp: string;
  ipAddress: string;
  browser: string;
  operatingSystem: string;
  deviceFingerprint: string;
  loginMethod: string;
  isCurrent: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  sessionId: string | null;
  login: (username: string, password: string) => Promise<void>;
  loginWithMicrosoft: (payload: MicrosoftAuthPayload) => Promise<any>;
  setPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  getActiveSessions: () => Promise<ActiveSession[]>;
  terminateSession: (sessionId: string) => Promise<void>;
  terminateOtherSessions: () => Promise<void>;
  logSecurityEvent: (eventData: { eventType: string; pageUrl?: string; details?: string }) => Promise<any>;
  logLifecycleEvent: (eventData: { eventType: string; details?: string }) => Promise<any>;
  unlockAccount: (employeeId: number) => Promise<any>;
  adminResetPassword: (employeeId: number, password: string) => Promise<any>;
  adminResetAllPasswords: (password?: string) => Promise<any>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('sessionId'));
  const [loading, setLoading] = useState<boolean>(false);

  // Sync token to api default headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const fingerprint = generateDeviceFingerprint();
      const profileId = getBrowserProfileId();

      const res: any = await api.post('/auth/login', {
        username,
        password,
        deviceFingerprint: fingerprint,
        browserProfileId: profileId,
      });

      const { accessToken, token: fallbackToken, sessionId: sid, user: userData } = res;
      const validToken = accessToken || fallbackToken;

      setToken(validToken);
      setSessionId(sid || null);
      setUser(userData);

      localStorage.setItem('token', validToken);
      if (sid) localStorage.setItem('sessionId', sid);
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.removeItem('logged_out');
    } finally {
      setLoading(false);
    }
  };

  const loginWithMicrosoft = async (payload: MicrosoftAuthPayload) => {
    setLoading(true);
    try {
      const fingerprint = generateDeviceFingerprint();
      const profileId = getBrowserProfileId();

      const res: any = await api.post('/auth/azure', {
        ...payload,
        deviceFingerprint: fingerprint,
        browserProfileId: profileId,
      });

      const { accessToken, token: fallbackToken, sessionId: sid, user: userData, autoProvisioned } = res;
      const validToken = accessToken || fallbackToken;

      setToken(validToken);
      setSessionId(sid || null);
      setUser(userData);

      localStorage.setItem('token', validToken);
      if (sid) localStorage.setItem('sessionId', sid);
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.removeItem('logged_out');

      return { autoProvisioned, user: userData };
    } finally {
      setLoading(false);
    }
  };

  const setPassword = async (newPassword: string) => {
    await api.post('/auth/set-password', { password: newPassword });
    if (user) {
      const updatedUser = { ...user, isPasswordSet: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    const activeSessionId = sessionId || localStorage.getItem('sessionId');
    try {
      await api.post('/auth/logout', { sessionId: activeSessionId });
    } catch (e) {
      console.warn('Logout notification error:', e);
    } finally {
      setUser(null);
      setToken(null);
      setSessionId(null);
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      sessionStorage.setItem('logged_out', 'true');
    }
  };

  const getActiveSessions = async (): Promise<ActiveSession[]> => {
    const res: any = await api.get('/auth/active-sessions');
    return res || [];
  };

  const terminateSession = async (targetSessionId: string) => {
    await api.post('/auth/terminate-session', { sessionId: targetSessionId });
  };

  const terminateOtherSessions = async () => {
    const currentSessionId = sessionId || localStorage.getItem('sessionId');
    await api.post('/auth/terminate-other-sessions', { currentSessionId });
  };

  const logSecurityEvent = async (eventData: { eventType: string; pageUrl?: string; details?: string }) => {
    try {
      const fingerprint = generateDeviceFingerprint();
      const res: any = await api.post('/auth/security-event', {
        ...eventData,
        employeeId: user?.id,
        employeeName: user?.name,
        email: user?.email,
        deviceFingerprint: fingerprint,
        pageUrl: eventData.pageUrl || window.location.pathname,
      });
      return res;
    } catch (e) {
      console.warn('Security event log failure:', e);
      return null;
    }
  };

  const logLifecycleEvent = async (eventData: { eventType: string; details?: string }) => {
    try {
      const fingerprint = generateDeviceFingerprint();
      const res: any = await api.post('/auth/lifecycle-event', {
        ...eventData,
        userId: user?.id,
        email: user?.email,
        deviceFingerprint: fingerprint,
      });
      return res;
    } catch (e) {
      console.warn('Lifecycle event log failure:', e);
      return null;
    }
  };

  const unlockAccount = async (employeeId: number) => {
    return api.post(`/auth/unlock-employee/${employeeId}`);
  };

  const adminResetPassword = async (employeeId: number, password: string) => {
    return api.post(`/auth/admin-reset-password/${employeeId}`, { password });
  };

  const adminResetAllPasswords = async (password = 'Password@123') => {
    return api.post('/auth/admin-reset-all-passwords', { password });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionId,
        login,
        loginWithMicrosoft,
        setPassword,
        logout,
        getActiveSessions,
        terminateSession,
        terminateOtherSessions,
        logSecurityEvent,
        logLifecycleEvent,
        unlockAccount,
        adminResetPassword,
        adminResetAllPasswords,
        setUser,
        isAuthenticated: !!token && !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
