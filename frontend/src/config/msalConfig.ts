import { Configuration, PublicClientApplication, LogLevel, AuthenticationResult } from '@azure/msal-browser';

export const getCurrentRedirectUri = (): string => {
  if (import.meta.env.VITE_AZURE_REDIRECT_URI) {
    return import.meta.env.VITE_AZURE_REDIRECT_URI;
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/login`;
  }
  return 'http://localhost:3000/login';
};

// Microsoft Entra ID Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '63af8748-b960-4f66-9ef7-e6be3b13e0d1',
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_AZURE_TENANT_ID || '5adb2e4c-71ad-431a-81fa-d48da6fe6b40'
    }`,
    redirectUri: getCurrentRedirectUri(),
    postLogoutRedirectUri: getCurrentRedirectUri(),
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL Error]', message);
            return;
          case LogLevel.Warning:
            console.warn('[MSAL Warning]', message);
            return;
          default:
            return;
        }
      },
    },
  },
};

// Request scopes for login - Standard OIDC claims for instantaneous auth
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
  redirectUri: getCurrentRedirectUri(),
};

// Singleton instance of PublicClientApplication
export const msalInstance = new PublicClientApplication(msalConfig);

let msalInitPromise: Promise<void> | null = null;

export const ensureMsalInitialized = (): Promise<void> => {
  if (!msalInitPromise) {
    msalInitPromise = msalInstance.initialize().catch((err) => {
      console.warn('MSAL initialization error:', err);
    });
  }
  return msalInitPromise;
};

/**
 * Handle redirect promise dynamically. Safe to call multiple times.
 */
export const initMsal = async (): Promise<AuthenticationResult | null> => {
  await ensureMsalInitialized();
  try {
    const res = await msalInstance.handleRedirectPromise();
    return res;
  } catch (err) {
    console.warn('MSAL redirect error:', err);
    return null;
  }
};

/**
 * Clear any stale MSAL interaction locks
 */
export const clearMsalStorage = () => {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('msal') || key.includes('interaction') || key.includes('authority'))) {
        sessionStorage.removeItem(key);
      }
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('msal') || key.includes('interaction') || key.includes('authority') || key.includes('login.windows.net'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Could not clear msal storage:', e);
  }
};
