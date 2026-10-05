import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  LinearProgress,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface SetPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({ open, onClose }) => {
  const { user, setPassword, logLifecycleEvent } = useAuth();
  const { showToast } = useToast();

  const [password, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Policy Checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const validCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthPercentage = (validCount / 5) * 100;
  const isFullyValid = validCount === 5 && passwordsMatch;

  useEffect(() => {
    if (open && user) {
      logLifecycleEvent({
        eventType: 'PASSWORD_SET_PROMPT',
        details: 'First-time login internal password setting modal prompt shown to user',
      });
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!isFullyValid) {
      setError('Please satisfy all password policy criteria and ensure confirmation matches.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await setPassword(password);
      showToast('Internal password set successfully! You can now log in using SSO or credentials.', 'success');
      onClose();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err?.response?.data?.message || err?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleDoItLater = async () => {
    if (user?.id) {
      localStorage.setItem(`password_prompt_dismissed_${user.id}`, 'true');
    }
    try {
      await api.post('/auth/skip-set-password');
      showToast(
        `Password setup instructions sent to your email (${user?.email || 'registered email'}). You can set your password anytime from your profile menu.`,
        'info'
      );
    } catch (e) {
      showToast('Password setup reminder saved. You can set it anytime from your profile menu.', 'info');
    }
    onClose();
  };

  const getStrengthColor = () => {
    if (validCount <= 2) return 'error';
    if (validCount <= 4) return 'warning';
    return 'success';
  };

  return (
    <Dialog
      open={open}
      onClose={handleDoItLater}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}
          >
            <SecurityIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.15rem' }}>
              Set your internal password for direct login
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Welcome to Field Visit CRM! Secure your account for dual sign-in.
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleDoItLater}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: '#334155', mb: 2.5, lineHeight: 1.5 }}>
          You have successfully logged in via <strong>Microsoft Entra ID SSO</strong>. Setting an internal password enables you to sign in directly using either Microsoft SSO or your Employee Email / Number with your password interchangeably.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            size="small"
            label="New Internal Password *"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} size="small" edge="end">
                    {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            size="small"
            label="Confirm Password *"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                  Password Strength:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: getStrengthColor() + '.main' }}>
                  {validCount <= 2 ? 'Weak' : validCount <= 4 ? 'Moderate' : 'Strong & Compliant'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={strengthPercentage}
                color={getStrengthColor() as any}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          {/* Enterprise Policy Checklist */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', display: 'block', mb: 1.2 }}>
              ENTERPRISE SECURITY PASSWORD POLICY:
            </Typography>
            <Stack spacing={0.8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {hasMinLength ? (
                  <CheckIcon color="success" sx={{ fontSize: 17 }} />
                ) : (
                  <CancelIcon color="disabled" sx={{ fontSize: 17 }} />
                )}
                <Typography variant="caption" sx={{ color: hasMinLength ? 'success.dark' : '#64748B', fontWeight: hasMinLength ? 600 : 400 }}>
                  Minimum 8 characters length ({password.length}/8)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {hasUppercase ? (
                  <CheckIcon color="success" sx={{ fontSize: 17 }} />
                ) : (
                  <CancelIcon color="disabled" sx={{ fontSize: 17 }} />
                )}
                <Typography variant="caption" sx={{ color: hasUppercase ? 'success.dark' : '#64748B', fontWeight: hasUppercase ? 600 : 400 }}>
                  At least one uppercase letter (A-Z)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {hasLowercase ? (
                  <CheckIcon color="success" sx={{ fontSize: 17 }} />
                ) : (
                  <CancelIcon color="disabled" sx={{ fontSize: 17 }} />
                )}
                <Typography variant="caption" sx={{ color: hasLowercase ? 'success.dark' : '#64748B', fontWeight: hasLowercase ? 600 : 400 }}>
                  At least one lowercase letter (a-z)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {hasNumber ? (
                  <CheckIcon color="success" sx={{ fontSize: 17 }} />
                ) : (
                  <CancelIcon color="disabled" sx={{ fontSize: 17 }} />
                )}
                <Typography variant="caption" sx={{ color: hasNumber ? 'success.dark' : '#64748B', fontWeight: hasNumber ? 600 : 400 }}>
                  At least one numeric digit (0-9)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {hasSpecial ? (
                  <CheckIcon color="success" sx={{ fontSize: 17 }} />
                ) : (
                  <CancelIcon color="disabled" sx={{ fontSize: 17 }} />
                )}
                <Typography variant="caption" sx={{ color: hasSpecial ? 'success.dark' : '#64748B', fontWeight: hasSpecial ? 600 : 400 }}>
                  At least one special character (!@#$%^&* etc.)
                </Typography>
              </Box>
              {password.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 0.5 }}>
                  {passwordsMatch ? (
                    <CheckIcon color="success" sx={{ fontSize: 17 }} />
                  ) : (
                    <CancelIcon color="error" sx={{ fontSize: 17 }} />
                  )}
                  <Typography variant="caption" sx={{ color: passwordsMatch ? 'success.dark' : 'error.main', fontWeight: 600 }}>
                    {passwordsMatch ? 'Passwords match correctly' : 'Passwords do not match'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
        <Button
          variant="text"
          color="inherit"
          onClick={handleDoItLater}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
        >
          Do It Later (Remind next login)
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!isFullyValid || loading}
          onClick={handleSave}
          sx={{
            px: 3,
            py: 1,
            fontWeight: 700,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
          }}
        >
          {loading ? 'Saving...' : 'Set Password Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
