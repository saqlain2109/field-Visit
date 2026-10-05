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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AccountInfo } from '@azure/msal-browser';
import { useAuth } from '../context/AuthContext';
import { msalInstance, loginRequest, getCurrentRedirectUri } from '../config/msalConfig';

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
  const [isCheckingSso, setIsCheckingSso] = useState(true);
  const [detectedAccount, setDetectedAccount] = useState<AccountInfo | null>(null);

  const { login, loginWithMicrosoft, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Helper to clear stale MSAL interaction locks
  const clearMsalStorage = () => {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('msal') || key.includes('interaction') || key.includes('authority'))) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Could not clear sessionStorage:', e);
    }
  };

  const extractErrorText = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.message) return err.message;
    return 'Your account is inactive or authentication failed. Contact your administrator.';
  };

  const processMsalResponse = async (loginResponse: any) => {
    try {
      setMsalLoading(true);
      setError(null);
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
      });

      sessionStorage.removeItem('logged_out');
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

  // Seamless SSO Auto-Detection on page load
  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      navigate('/');
      return;
    }

    const initMsalAndAutoLogin = async () => {
      try {
        await msalInstance.initialize();

        // 1. Handle redirect promise if user arrived via redirect flow
        try {
          const redirectResponse = await msalInstance.handleRedirectPromise();
          if (redirectResponse && isMounted) {
            await processMsalResponse(redirectResponse);
            return;
          }
        } catch (redirErr: any) {
          console.warn('MSAL redirect promise note:', redirErr);
        }

        // 2. Check for existing cached Microsoft accounts
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0 && isMounted) {
          setDetectedAccount(accounts[0]);
        }

        // 3. Skip silent login attempt if user explicitly logged out in this browser session
        const hasLoggedOut = sessionStorage.getItem('logged_out') === 'true';
        if (hasLoggedOut) {
          if (isMounted) setIsCheckingSso(false);
          return;
        }

        // 4. Try silent token acquisition if cached account exists
        if (accounts.length > 0 && isMounted) {
          try {
            const silentResponse = await msalInstance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            if (silentResponse && isMounted) {
              await processMsalResponse(silentResponse);
              return;
            }
          } catch (silentErr) {
            console.log('Silent token acquisition from cache failed, trying ssoSilent...', silentErr);
          }
        }

        // 5. Try silent browser session detection via iframe (ssoSilent)
        try {
          const ssoResponse = await msalInstance.ssoSilent(loginRequest);
          if (ssoResponse && isMounted) {
            await processMsalResponse(ssoResponse);
            return;
          }
        } catch (ssoErr) {
          // No active Microsoft session in browser
        }
      } catch (err: any) {
        console.warn('MSAL initialization/SSO error:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSso(false);
        }
      }
    };

    initMsalAndAutoLogin();

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
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      const msg = extractErrorText(err);
      setError(msg);
      if (msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('lockout')) {
        setIsLockedOut(true);
      }
    }
  };

  const handleMicrosoftLogin = async (forceAccountPicker: boolean = false) => {
    setError(null);
    setMsalLoading(true);
    sessionStorage.removeItem('logged_out');
    try {
      await msalInstance.initialize();

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
          console.warn('Silent token acquire fallback to popup:', silentErr);
        }
      }

      const requestConfig: any = {
        ...loginRequest,
        redirectUri: getCurrentRedirectUri(),
        prompt: forceAccountPicker ? 'select_account' : undefined,
        loginHint: !forceAccountPicker && detectedAccount ? detectedAccount.username : undefined,
      };

      let loginResponse;
      try {
        loginResponse = await msalInstance.loginPopup(requestConfig);
      } catch (popupErr: any) {
        if (popupErr?.errorCode === 'user_cancelled') {
          setError('Microsoft sign-in was cancelled.');
          return;
        }
        if (
          popupErr?.errorCode === 'interaction_in_progress' ||
          popupErr?.message?.includes('interaction_in_progress')
        ) {
          clearMsalStorage();
          await msalInstance.initialize();
          loginResponse = await msalInstance.loginPopup(requestConfig);
        } else {
          await msalInstance.loginRedirect(requestConfig);
          return;
        }
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

  const isAnyLoading = loading || msalLoading;

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
    </Box>
  );
};

export default LoginPage;
