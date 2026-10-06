import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Paper,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  AdminPanelSettingsOutlined,
  SupervisorAccountOutlined,
  BusinessCenterOutlined,
  EngineeringOutlined,
  ShieldOutlined,
  WarningAmberOutlined,
  KeyOutlined,
  PhoneAndroidOutlined,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AccountInfo } from '@azure/msal-browser';
import { useAuth } from '../context/AuthContext';
import { msalInstance, loginRequest, getCurrentRedirectUri, initMsal, clearMsalStorage } from '../config/msalConfig';

// Microsoft official 4-color square logo
const MicrosoftIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 21 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginRight: '10px', flexShrink: 0 }}
  >
    <path d="M1 1H10V10H1V1Z" fill="#F25022" />
    <path d="M11 1H20V10H11V1Z" fill="#7FBA00" />
    <path d="M1 11H10V20H1V11Z" fill="#00A4EF" />
    <path d="M11 11H20V20H11V11Z" fill="#FFB900" />
  </svg>
);

// Google official 4-color "G" logo
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginRight: '10px', flexShrink: 0 }}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

interface RolePreset {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES_EXEC' | 'SERVICE_ENG';
  title: string;
  name: string;
  email: string;
  password: string;
  icon: React.ReactNode;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'admin',
    role: 'ADMIN',
    title: 'System Administrator',
    name: 'System Administrator',
    email: 'admin@crm.com',
    password: 'Password@123',
    icon: <AdminPanelSettingsOutlined sx={{ fontSize: 20, color: '#4F46E5' }} />,
  },
  {
    id: 'manager',
    role: 'MANAGER',
    title: 'Branch Manager',
    name: 'Rajesh Patel',
    email: 'rajesh@crm.com',
    password: 'Password@123',
    icon: <SupervisorAccountOutlined sx={{ fontSize: 20, color: '#0EA5E9' }} />,
  },
  {
    id: 'sales',
    role: 'SALES_EXEC',
    title: 'Sales Executive',
    name: 'Amit Sharma',
    email: 'amit@crm.com',
    password: 'Password@123',
    icon: <BusinessCenterOutlined sx={{ fontSize: 20, color: '#F59E0B' }} />,
  },
  {
    id: 'service',
    role: 'SERVICE_ENG',
    title: 'Field Service Engineer',
    name: 'Suresh Choudhary',
    email: 'suresh@crm.com',
    password: 'Password@123',
    icon: <EngineeringOutlined sx={{ fontSize: 20, color: '#10B981' }} />,
  },
];

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin@crm.com');
  const [password, setPassword] = useState('Password@123');
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [msalLoading, setMsalLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const [detectedAccount, setDetectedAccount] = useState<AccountInfo | null>(() => {
    try {
      const saved = localStorage.getItem('last_detected_ms_account');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // 2-Step Verification (MFA) Dialog States
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{
    verificationToken: string;
    maskedEmail: string;
    maskedPhone?: string;
    devOtp?: string;
    isNewDevice?: boolean;
    clientRegion?: string;
  } | null>(null);
  const [twoFactorOtp, setTwoFactorOtp] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const { login, loginWithMicrosoft, loginWithGoogle, verifyTwoFactor, resendTwoFactor, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getBrowserCoordinates = (): Promise<{ latitude?: number; longitude?: number }> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve({});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation lookup notice:', err.message);
          resolve({});
        },
        { timeout: 2500, maximumAge: 60000, enableHighAccuracy: false }
      );
    });
  };

  const decodeJwtPayload = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const extractErrorText = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.message) return err.message;
    return 'Your account is inactive or authentication failed. Contact your administrator.';
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    setError(null);
    try {
      const coords = await getBrowserCoordinates();
      const claims = decodeJwtPayload(response.credential);
      const email = claims?.email;
      const name = claims?.name;
      const sub = claims?.sub;

      const res = await loginWithGoogle({
        credential: response.credential,
        email: email,
        name: name,
        googleId: sub,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (res && res.requires2FA) {
        setTwoFactorChallenge(res);
        setTwoFactorOtp(res.devOtp || '');
        return;
      }

      sessionStorage.removeItem('logged_out');
      navigate('/');
    } catch (err: any) {
      console.error('Google login error:', err);
      const errorMsg = extractErrorText(err);
      setError(errorMsg);
      if (
        errorMsg.toLowerCase().includes('inactive') ||
        errorMsg.toLowerCase().includes('locked') ||
        errorMsg.toLowerCase().includes('lockout')
      ) {
        setIsLockedOut(true);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInOfficial = () => {
    setError(null);
    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '375440962272-ddvoognc2ih0ecvjk6vko6poga5r6ejn.apps.googleusercontent.com';

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        setGoogleLoading(true);
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setGoogleLoading(false);
              console.warn('Google Auth callback error:', tokenResponse);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError(`Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            if (tokenResponse?.access_token) {
              try {
                const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userProfile = await userinfoRes.json();
                const coords = await getBrowserCoordinates();

                const res = await loginWithGoogle({
                  accessToken: tokenResponse.access_token,
                  email: userProfile.email,
                  name: userProfile.name,
                  googleId: userProfile.sub,
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                });

                if (res && res.requires2FA) {
                  setTwoFactorChallenge(res);
                  setTwoFactorOtp(res.devOtp || '');
                  return;
                }

                sessionStorage.removeItem('logged_out');
                navigate('/');
              } catch (err: any) {
                console.error('Failed backend login for Google user:', err);
                const errorMsg = extractErrorText(err);
                setError(errorMsg);
                if (
                  errorMsg.toLowerCase().includes('inactive') ||
                  errorMsg.toLowerCase().includes('locked') ||
                  errorMsg.toLowerCase().includes('lockout')
                ) {
                  setIsLockedOut(true);
                }
              } finally {
                setGoogleLoading(false);
              }
            }
          },
          error_callback: (err: any) => {
            setGoogleLoading(false);
            console.error('GIS Error callback:', err);
            if (err?.type !== 'popup_closed') {
              setShowGoogleModal(true);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('GIS initTokenClient failed, opening fallback modal:', err);
      }
    }

    setShowGoogleModal(true);
  };

  const handleGoogleLogin = async (targetEmail?: string, targetName?: string) => {
    setError(null);
    setGoogleLoading(true);
    setShowGoogleModal(false);
    try {
      const emailToUse = targetEmail || customGoogleEmail.trim() || 'saqlainsupariwala@gmail.com';
      const nameToUse = targetName || emailToUse.split('@')[0];
      const coords = await getBrowserCoordinates();

      const res = await loginWithGoogle({
        email: emailToUse,
        name: nameToUse,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (res && res.requires2FA) {
        setTwoFactorChallenge(res);
        setTwoFactorOtp(res.devOtp || '');
        return;
      }

      sessionStorage.removeItem('logged_out');
      navigate('/');
    } catch (err: any) {
      console.error('Failed to complete Google login on backend:', err);
      const errorMsg = extractErrorText(err);
      setError(errorMsg);
      if (
        errorMsg.toLowerCase().includes('inactive') ||
        errorMsg.toLowerCase().includes('locked') ||
        errorMsg.toLowerCase().includes('lockout')
      ) {
        setIsLockedOut(true);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const processMsalResponse = async (loginResponse: any) => {
    try {
      setMsalLoading(true);
      setError(null);
      const coords = await getBrowserCoordinates();
      const email =
        loginResponse.account?.username ||
        (loginResponse.idTokenClaims as any)?.preferred_username ||
        (loginResponse.idTokenClaims as any)?.email ||
        (loginResponse.idTokenClaims as any)?.upn;
      const name = loginResponse.account?.name || (loginResponse.idTokenClaims as any)?.name;
      const oid = (loginResponse.idTokenClaims as any)?.oid || loginResponse.account?.localAccountId;

      await loginWithMicrosoft({
        idToken: loginResponse.idToken,
        accessToken: loginResponse.accessToken,
        email: email,
        name: name,
        azureAdOid: oid,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (loginResponse.account) {
        localStorage.setItem('last_detected_ms_account', JSON.stringify({
          name: loginResponse.account.name,
          username: loginResponse.account.username,
          homeAccountId: loginResponse.account.homeAccountId,
          localAccountId: loginResponse.account.localAccountId
        }));
        setDetectedAccount(loginResponse.account);
      }

      sessionStorage.removeItem('logged_out');

      // Clear any auth code hash from browser address bar
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      navigate('/');
    } catch (err: any) {
      console.error('Failed to complete Microsoft login on backend:', err);
      const errorMsg = extractErrorText(err);
      setError(errorMsg);
      if (
        errorMsg.toLowerCase().includes('inactive') ||
        errorMsg.toLowerCase().includes('locked') ||
        errorMsg.toLowerCase().includes('lockout')
      ) {
        setIsLockedOut(true);
      }
    } finally {
      setMsalLoading(false);
    }
  };

  // Handle Return from Microsoft Redirect & Detect Active Microsoft Session
  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      navigate('/');
      return;
    }

    const checkRedirectPromise = async () => {
      try {
        // If this window is a popup opened by MSAL:
        if (typeof window !== 'undefined' && window.opener && (window.name.includes('msal') || window.location.hash.includes('code='))) {
          const redirectRes = await initMsal();
          if (redirectRes && window.opener && window.opener !== window) {
            try { window.close(); } catch (e) {}
            return;
          }
        }

        // Only handle redirect if auth code is actually present in URL from an active login
        const hasAuthCode = typeof window !== 'undefined' && (
          window.location.hash.includes('code=') ||
          window.location.search.includes('code=')
        );

        if (hasAuthCode) {
          const redirectResponse = await initMsal();
          if (redirectResponse && isMounted) {
            if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            await processMsalResponse(redirectResponse);
            return;
          }
        }

        // Detect active or cached Microsoft account in Chrome
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0 && isMounted) {
          setDetectedAccount(accounts[0]);
          localStorage.setItem('last_detected_ms_account', JSON.stringify({
            name: accounts[0].name,
            username: accounts[0].username,
            homeAccountId: accounts[0].homeAccountId,
            localAccountId: accounts[0].localAccountId
          }));
        } else {
          // If no cached accounts, check silent SSO if not explicitly logged out
          if (sessionStorage.getItem('logged_out') !== 'true') {
            try {
              const silentRes = await msalInstance.ssoSilent(loginRequest);
              if (silentRes?.account && isMounted) {
                setDetectedAccount(silentRes.account);
                localStorage.setItem('last_detected_ms_account', JSON.stringify({
                  name: silentRes.account.name,
                  username: silentRes.account.username,
                  homeAccountId: silentRes.account.homeAccountId,
                  localAccountId: silentRes.account.localAccountId
                }));
              }
            } catch (e) {
              // Silent SSO not available
            }
          }
        }

        // Clean lingering code / error in hash if any
        if (typeof window !== 'undefined' && (window.location.hash.includes('code=') || window.location.hash.includes('error='))) {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch (err: any) {
        console.warn('MSAL redirect check note:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSso(false);
        }
      }
    };

    checkRedirectPromise();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    const roleId = event.target.value;
    setSelectedRole(roleId);
    const preset = ROLE_PRESETS.find((r) => r.id === roleId);
    if (preset) {
      setUsername(preset.email);
      setPassword(preset.password);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLockedOut(false);
    try {
      const coords = await getBrowserCoordinates();
      const res = await login(username, password, coords.latitude, coords.longitude);
      if (res && res.requires2FA) {
        setTwoFactorChallenge(res);
        setTwoFactorOtp(res.devOtp || '');
        return;
      }
      navigate('/');
    } catch (err: any) {
      const msg = extractErrorText(err);
      setError(msg);
      if (msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('lockout')) {
        setIsLockedOut(true);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!twoFactorChallenge || !twoFactorOtp || twoFactorOtp.trim().length < 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    setOtpError(null);
    setVerifyingOtp(true);
    try {
      await verifyTwoFactor({
        verificationToken: twoFactorChallenge.verificationToken,
        otpCode: twoFactorOtp.trim(),
        trustDevice: trustDevice,
        deviceName: window.navigator.userAgent.includes('Windows') ? 'Windows PC' : 'Web Browser',
      });
      setTwoFactorChallenge(null);
      sessionStorage.removeItem('logged_out');
      navigate('/');
    } catch (err: any) {
      setOtpError(extractErrorText(err));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!twoFactorChallenge) return;
    setResendingOtp(true);
    setOtpError(null);
    setResendStatus(null);
    try {
      const res = await resendTwoFactor(twoFactorChallenge.verificationToken);
      setResendStatus('A fresh verification code has been dispatched to your email.');
      if (res?.devOtp) {
        setTwoFactorOtp(res.devOtp);
      }
    } catch (err: any) {
      setOtpError(extractErrorText(err));
    } finally {
      setResendingOtp(false);
    }
  };

  const handleMicrosoftLogin = async (forceAccountPicker: boolean = false) => {
    setError(null);
    setMsalLoading(true);
    sessionStorage.removeItem('logged_out');
    clearMsalStorage();

    try {
      await initMsal();

      if (detectedAccount && !forceAccountPicker) {
        try {
          const silentRes = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: detectedAccount,
          });
          if (silentRes) {
            await processMsalResponse(silentRes);
            return;
          }
        } catch (silentErr) {
          console.warn('Silent token acquire fallback to interactive:', silentErr);
        }
      }

      const requestConfig: any = {
        ...loginRequest,
        redirectUri: getCurrentRedirectUri(),
        prompt: forceAccountPicker ? 'select_account' : undefined,
        loginHint: !forceAccountPicker && detectedAccount ? detectedAccount.username : undefined,
      };

      // If already in a popup window or iframe, use redirect to prevent block_nested_popups
      if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
        await msalInstance.loginRedirect(requestConfig);
        return;
      }

      let loginResponse;
      try {
        loginResponse = await msalInstance.loginPopup(requestConfig);
      } catch (popupErr: any) {
        console.warn('MSAL popup error, falling back to redirect:', popupErr);
        if (popupErr?.errorCode === 'user_cancelled') {
          setError('Microsoft sign-in was cancelled.');
          return;
        }
        // Fall back cleanly to redirect flow without nested popup errors
        clearMsalStorage();
        await msalInstance.loginRedirect(requestConfig);
        return;
      }

      if (loginResponse) {
        await processMsalResponse(loginResponse);
      }
    } catch (err: any) {
      console.error('Microsoft login error:', err);
      if (err?.errorCode === 'user_cancelled') {
        setError('Microsoft sign-in was cancelled.');
      } else {
        const errorMsg = extractErrorText(err);
        setError(errorMsg);
        if (
          errorMsg.toLowerCase().includes('inactive') ||
          errorMsg.toLowerCase().includes('locked') ||
          errorMsg.toLowerCase().includes('lockout')
        ) {
          setIsLockedOut(true);
        }
      }
    } finally {
      setMsalLoading(false);
    }
  };

  const isAnyLoading = loading || msalLoading || googleLoading;

  // If this window is an MSAL popup window, show a minimal loader so user doesn't see nested login
  if (typeof window !== 'undefined' && window.opener && window.name && window.name.includes('msal')) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: '#F8FAFC',
        }}
      >
        <CircularProgress size={36} sx={{ color: '#00A4EF' }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
          Completing Microsoft Authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        p: { xs: 2, sm: 3 },
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.80) 50%, rgba(15, 23, 42, 0.90) 100%), url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=2000&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Centered Modern Card */}
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 4,
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header & Brand Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.45)',
                mb: 1.5,
              }}
            >
              FV
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                lineHeight: 1.25,
              }}
            >
              Field Visit & Expense CRM
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.6, fontSize: '0.82rem' }}>
              Enterprise portal for on-site field visits & claim management
            </Typography>
          </Box>

          {/* Progressive Lockout / Error Alert */}
          {error && (
            <Alert
              severity={isLockedOut ? 'error' : 'warning'}
              icon={isLockedOut ? <WarningAmberOutlined /> : undefined}
              sx={{
                mb: 2.5,
                borderRadius: 2,
                fontSize: '0.82rem',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Quick Login Role Selector Dropdown */}
          <Box sx={{ mb: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="quick-login-label" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                ⚡ Quick Login (Demo / Switch Role)
              </InputLabel>
              <Select
                labelId="quick-login-label"
                id="quick-login-select"
                value={selectedRole}
                label="⚡ Quick Login (Demo / Switch Role)"
                onChange={handleRoleChange}
                disabled={isAnyLoading}
                sx={{
                  borderRadius: 2,
                  bgcolor: '#F8FAFC',
                  fontSize: '0.875rem',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                  },
                }}
              >
                {ROLE_PRESETS.map((preset) => (
                  <MenuItem key={preset.id} value={preset.id} sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
                      {preset.icon}
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                          {preset.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                          {preset.name} ({preset.email})
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Microsoft Entra ID SSO Section */}
          {detectedAccount ? (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: 2.5,
                bgcolor: 'rgba(0, 164, 239, 0.06)',
                border: '1px solid rgba(0, 164, 239, 0.28)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: '#0078D4',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    width: 38,
                    height: 38,
                    boxShadow: '0 2px 8px rgba(0, 120, 212, 0.3)',
                  }}
                >
                  {(detectedAccount.name || detectedAccount.username || 'M').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#0284C7',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontSize: '0.68rem',
                      display: 'block',
                    }}
                  >
                    Detected Microsoft Session
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: '#0F172A',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {detectedAccount.name || detectedAccount.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748B',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.73rem',
                    }}
                  >
                    {detectedAccount.username}
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="medium"
                disabled={isAnyLoading}
                onClick={() => handleMicrosoftLogin(false)}
                startIcon={
                  msalLoading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <MicrosoftIcon size={18} />
                  )
                }
                sx={{
                  py: 1,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  background: 'linear-gradient(135deg, #0078D4 0%, #00A4EF 100%)',
                  color: '#FFFFFF',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #005A9E 0%, #0078D4 100%)',
                  },
                }}
              >
                {msalLoading
                  ? 'Signing in...'
                  : `Continue as ${
                      detectedAccount.name?.split(' ')[0] || detectedAccount.username
                    }`}
              </Button>

              <Button
                fullWidth
                variant="text"
                size="small"
                disabled={isAnyLoading}
                onClick={() => handleMicrosoftLogin(true)}
                sx={{
                  mt: 0.8,
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  color: '#64748B',
                  textTransform: 'none',
                  '&:hover': { color: '#0284C7', bgcolor: 'transparent' },
                }}
              >
                Use Another Microsoft Account / Switch
              </Button>
            </Paper>
          ) : (
            <Button
              fullWidth
              variant="outlined"
              size="large"
              disabled={isAnyLoading}
              onClick={() => handleMicrosoftLogin(true)}
              sx={{
                py: 1.2,
                mb: 2.5,
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#1E293B',
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#F8FAFC',
                  borderColor: '#94A3B8',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                },
              }}
            >
              {isCheckingSso ? (
                <CircularProgress size={18} sx={{ mr: 1.5, color: '#00A4EF' }} />
              ) : msalLoading ? (
                <CircularProgress size={18} sx={{ mr: 1.5, color: '#00A4EF' }} />
              ) : (
                <MicrosoftIcon size={18} />
              )}
              <Box component="span">
                {isCheckingSso
                  ? 'Detecting active Microsoft session...'
                  : msalLoading
                  ? 'Authenticating with Microsoft Entra ID...'
                  : 'Sign in with Microsoft Entra ID'}
              </Box>
            </Button>
          )}

          {/* Google SSO Button */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            disabled={isAnyLoading}
            onClick={handleGoogleSignInOfficial}
            sx={{
              py: 1.2,
              mb: 2.5,
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#1E293B',
              borderColor: '#CBD5E1',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: '#F8FAFC',
                borderColor: '#94A3B8',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              },
            }}
          >
            {googleLoading ? (
              <CircularProgress size={18} sx={{ mr: 1.5, color: '#4285F4' }} />
            ) : (
              <GoogleIcon size={18} />
            )}
            <Box component="span">
              {googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
            </Box>
          </Button>

          {/* Divider */}
          <Divider sx={{ mb: 2.5, fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
            OR SIGN IN WITH CREDENTIALS
          </Divider>

          {/* Credential Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email or Employee Number"
              variant="outlined"
              size="medium"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isAnyLoading}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              size="medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isAnyLoading}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      disabled={isAnyLoading}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 19, color: '#94A3B8' }} />
                      ) : (
                        <Visibility sx={{ fontSize: 19, color: '#94A3B8' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isAnyLoading}
              sx={{
                py: 1.3,
                fontWeight: 700,
                fontSize: '0.92rem',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #2563EB 100%)',
                  boxShadow: '0 12px 25px -4px rgba(79, 70, 229, 0.5)',
                },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          {/* Secure Footer Note */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mt: 3 }}>
            <ShieldOutlined sx={{ fontSize: 15, color: '#94A3B8' }} />
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 500 }}>
              Enterprise SSO & Progressive Attack Defense Shield
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Google Account Selector Dialog */}
      <Dialog
        open={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GoogleIcon size={22} />
          Sign in with Google
        </DialogTitle>
        <DialogContent dividers>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setShowGoogleModal(false);
              handleGoogleSignInOfficial();
            }}
            startIcon={<GoogleIcon size={18} />}
            sx={{
              py: 1.2,
              mb: 2,
              fontWeight: 700,
              bgcolor: '#4285F4',
              '&:hover': { bgcolor: '#3367D6' },
            }}
          >
            Launch Official Google Sign-In Popup
          </Button>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
              OR QUICK SELECT / ENTER ACCOUNT
            </Typography>
          </Divider>

          <List sx={{ pt: 0, mb: 1.5 }}>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleGoogleLogin('saqlainsupariwala@gmail.com', 'Saqlain Supariwala')}
                sx={{ borderRadius: 2, border: '1px solid #E2E8F0', py: 1.2, '&:hover': { bgcolor: '#F8FAFC' } }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#4285F4', fontWeight: 700, fontSize: '0.9rem' }}>SS</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Saqlain Supariwala</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">saqlainsupariwala@gmail.com</Typography>}
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleGoogleLogin('saqlain.khan@gmail.com', 'Saqlain Khan')}
                sx={{ borderRadius: 2, border: '1px solid #E2E8F0', py: 1.2, '&:hover': { bgcolor: '#F8FAFC' } }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#34A853', fontWeight: 700, fontSize: '0.9rem' }}>SK</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Saqlain Khan</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">saqlain.khan@gmail.com</Typography>}
                />
              </ListItemButton>
            </ListItem>
          </List>

          <Divider sx={{ my: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>OR ENTER EMAIL</Typography>
          </Divider>

          <TextField
            size="small"
            fullWidth
            label="Google Account Email"
            placeholder="e.g. saqlain@example.com"
            value={customGoogleEmail}
            onChange={(e) => setCustomGoogleEmail(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setShowGoogleModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!customGoogleEmail.trim()}
            onClick={() => handleGoogleLogin(customGoogleEmail.trim())}
            sx={{ bgcolor: '#4285F4', '&:hover': { bgcolor: '#3367D6' } }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2-Step Verification (MFA) Dialog */}
      <Dialog
        open={Boolean(twoFactorChallenge)}
        onClose={() => setTwoFactorChallenge(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldOutlined color="primary" />
          2-Step Verification
        </DialogTitle>
        <DialogContent dividers>
          {twoFactorChallenge?.isNewDevice && (
            <Alert severity="info" icon={<PhoneAndroidOutlined />} sx={{ mb: 2, borderRadius: 2 }}>
              <strong>New or Unrecognized Device:</strong> For your security, please verify your identity before signing in.
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 1, color: '#334155' }}>
            A 6-digit verification code has been dispatched to:
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
            📧 {twoFactorChallenge?.maskedEmail || 'your registered email'}
          </Typography>

          {twoFactorChallenge?.devOtp && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F0FDF4', border: '1px dashed #86EFAC', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#166534', display: 'block', mb: 0.5 }}>
                🧪 <strong>Development / Demo Mode:</strong>
              </Typography>
              <Chip
                icon={<KeyOutlined />}
                label={`Auto-fill OTP: ${twoFactorChallenge.devOtp}`}
                size="small"
                color="success"
                onClick={() => setTwoFactorOtp(twoFactorChallenge.devOtp || '')}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            </Box>
          )}

          {otpError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {otpError}
            </Alert>
          )}

          {resendStatus && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {resendStatus}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            label="6-Digit Verification Code"
            variant="outlined"
            placeholder="000000"
            value={twoFactorOtp}
            onChange={(e) => setTwoFactorOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '6px', fontSize: '1.4rem', fontWeight: 700 } }}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Trust this device (don't ask again on this device)
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            size="small"
            color="inherit"
            disabled={resendingOtp || verifyingOtp}
            onClick={handleResendOtp}
          >
            {resendingOtp ? 'Resending...' : 'Resend Code'}
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              disabled={verifyingOtp}
              onClick={() => setTwoFactorChallenge(null)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={verifyingOtp || twoFactorOtp.length < 6}
              onClick={handleVerifyOtp}
              startIcon={verifyingOtp ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutline />}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify & Sign In'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
