import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_API_URL = '@fv_api_base_url';
const STORAGE_KEY_TOKEN = '@fv_auth_token';

// Automatically choose best initial default
export const getDefaultApiUrl = (): string => {
  if (Platform.OS === 'android') {
    // If running in standard Android emulator:
    // Physical device on local Wi-Fi, host machine IP is 10.76.101.133
    return 'http://10.76.101.133:4000/api';
  }
  return 'http://localhost:4000/api';
};

let currentApiUrl = getDefaultApiUrl();

// Load stored custom URL if user customized it
AsyncStorage.getItem(STORAGE_KEY_API_URL).then((stored) => {
  if (stored && stored.trim().length > 0) {
    currentApiUrl = stored.trim();
  }
}).catch(() => {});

export const getApiBaseUrl = (): string => currentApiUrl;

export const setApiBaseUrl = async (url: string): Promise<void> => {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  currentApiUrl = cleanUrl;
  await AsyncStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
};

export const resetApiBaseUrl = async (): Promise<string> => {
  const def = getDefaultApiUrl();
  currentApiUrl = def;
  await AsyncStorage.removeItem(STORAGE_KEY_API_URL);
  return def;
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
  } catch (e) {
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY_TOKEN, token);
};

export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
};

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export const apiFetch = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await getAuthToken();
  const baseUrl = getApiBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json();

    if (!response.ok) {
      const errorMsg = json.message || json.error || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    // Backend Spring Boot ApiResponse returns { success: true, data: ..., message: ... }
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as T;
    }

    return json as T;
  } catch (err: any) {
    console.warn(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
};

export const testServerConnection = async (testUrl?: string): Promise<{ success: boolean; message: string }> => {
  const urlToTest = (testUrl || getApiBaseUrl()).trim().replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${urlToTest}/masters/summary`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok || res.status === 401 || res.status === 403) {
      return { success: true, message: 'Server reached successfully! (Port 4000 is online)' };
    }
    return { success: false, message: `Server replied with status ${res.status}` };
  } catch (e: any) {
    return {
      success: false,
      message: `Cannot reach ${urlToTest}. Check if backend is running on port 4000 and phone is on the same Wi-Fi.`,
    };
  }
};
