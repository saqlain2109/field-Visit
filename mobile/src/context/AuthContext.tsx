import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { User, RolePreset, UserRole } from '../types';
import {
  apiFetch,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
} from '../config/api';

const STORAGE_KEY_USER = '@fv_auth_user';

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'admin',
    role: 'ADMIN',
    title: 'System Admin',
    name: 'Administrator',
    email: 'admin@crm.com',
    password: 'Password@123',
    badgeColor: '#4F46E5',
  },
  {
    id: 'manager',
    role: 'MANAGER',
    title: 'Branch Manager',
    name: 'Rajesh Patel',
    email: 'rajesh@crm.com',
    password: 'Password@123',
    badgeColor: '#0EA5E9',
  },
  {
    id: 'sales',
    role: 'SALES_EXEC',
    title: 'Sales Exec',
    name: 'Amit Sharma',
    email: 'amit@crm.com',
    password: 'Password@123',
    badgeColor: '#F59E0B',
  },
  {
    id: 'service',
    role: 'SERVICE_ENG',
    title: 'Field Engineer',
    name: 'Suresh Choudhary',
    email: 'suresh@crm.com',
    password: 'Password@123',
    badgeColor: '#10B981',
  },
];

interface TwoFactorChallenge {
  verificationToken: string;
  maskedEmail: string;
  maskedPhone?: string;
  devOtp?: string;
  isNewDevice?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  serverUrl: string;
  coords: { latitude: number; longitude: number } | null;
  locationStatus: 'granted' | 'denied' | 'pending';
  twoFactorChallenge: TwoFactorChallenge | null;
  login: (identifier: string, pass: string) => Promise<any>;
  verify2FA: (otp: string) => Promise<void>;
  cancel2FA: () => void;
  logout: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
  resetServerUrlToDefault: () => Promise<string>;
  refreshProfile: () => Promise<void>;
  requestLocation: () => Promise<{ latitude: number; longitude: number } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverUrl, setServerUrlState] = useState<string>(getApiBaseUrl());
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);

  // Initial Boot: Check cached token, user profile, and location
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const storedUrl = await AsyncStorage.getItem('@fv_api_base_url');
      if (storedUrl && (storedUrl.includes('trycloudflare.com') || storedUrl.includes('192.168.') || storedUrl.includes('10.76.'))) {
        await resetApiBaseUrl();
      }
      setServerUrlState(getApiBaseUrl());
      const storedToken = await getAuthToken();
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);

      if (storedToken && storedUser) {
        setTokenState(storedToken);
        setUser(JSON.parse(storedUser));
      }

      // Proactively request physical location
      requestLocation().catch(() => {});
    } catch (e) {
      console.warn('Auth bootstrap failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return null;
      }
      setLocationStatus('granted');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(c);
      return c;
    } catch (e) {
      setLocationStatus('denied');
      return null;
    }
  };

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      let currentCoords = coords;
      if (!currentCoords) {
        currentCoords = await requestLocation();
      }

      const payload: any = {
        identifier: identifier.trim(),
        emailOrEmployeeNumber: identifier.trim(),
        email: identifier.trim(),
        username: identifier.trim(),
        password: pass,
        latitude: currentCoords ? currentCoords.latitude : 19.076,
        longitude: currentCoords ? currentCoords.longitude : 72.8777,
        deviceFingerprint: `mobile-${Date.now()}`,
      };

      const res: any = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.requires2FA) {
        setTwoFactorChallenge(res);
        return { requires2FA: true, devOtp: res.devOtp };
      }

      const authToken = res.accessToken || res.token;
      const userData = res.user;

      if (!authToken || !userData) {
        throw new Error('Invalid authentication response from server.');
      }

      await setAuthToken(authToken);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));

      setTokenState(authToken);
      setUser(userData);
      setTwoFactorChallenge(null);

      return { success: true, user: userData };
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (otp: string) => {
    if (!twoFactorChallenge) throw new Error('No active verification session.');
    setIsLoading(true);
    try {
      const res: any = await apiFetch('/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({
          verificationToken: twoFactorChallenge.verificationToken,
          otpCode: otp.trim(),
          trustDevice: true,
          deviceName: 'React Native Mobile App',
        }),
      });

      const authToken = res.accessToken || res.token;
      const userData = res.user;

      await setAuthToken(authToken);
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));

      setTokenState(authToken);
      setUser(userData);
      setTwoFactorChallenge(null);
    } finally {
      setIsLoading(false);
    }
  };

  const cancel2FA = () => {
    setTwoFactorChallenge(null);
  };

  const logout = async () => {
    try {
      await clearAuthToken();
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
    } finally {
      setTokenState(null);
      setUser(null);
      setTwoFactorChallenge(null);
    }
  };

  const updateServerUrl = async (url: string) => {
    await setApiBaseUrl(url);
    setServerUrlState(getApiBaseUrl());
  };

  const resetServerUrlToDefault = async (): Promise<string> => {
    const def = await resetApiBaseUrl();
    setServerUrlState(def);
    return def;
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiFetch<User>('/auth/profile');
      if (profile) {
        setUser(profile);
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        serverUrl,
        coords,
        locationStatus,
        twoFactorChallenge,
        login,
        verify2FA,
        cancel2FA,
        logout,
        updateServerUrl,
        resetServerUrlToDefault,
        refreshProfile,
        requestLocation,
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
