import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Paper,
  Stack,
} from '@mui/material';
import {
  Devices as DevicesIcon,
  LaptopMac as LaptopIcon,
  PhoneAndroid as PhoneIcon,
  Language as BrowserIcon,
  DeleteOutline as DeleteIcon,
  Security as SecurityIcon,
  Close as CloseIcon,
  CheckCircle as CurrentIcon,
} from '@mui/icons-material';
import { useAuth, ActiveSession } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ActiveSessionsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ActiveSessionsModal: React.FC<ActiveSessionsModalProps> = ({ open, onClose }) => {
  const { getActiveSessions, terminateSession, terminateOtherSessions, sessionId } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [terminating, setTerminating] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getActiveSessions();
      setSessions(data);
    } catch (e: any) {
      showToast('Failed to load active sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const handleTerminateSession = async (targetSessionId: string) => {
    setTerminating(targetSessionId);
    try {
      await terminateSession(targetSessionId);
      showToast('Session terminated successfully.', 'info');
      fetchSessions();
    } catch (e: any) {
      showToast('Failed to terminate session', 'error');
    } finally {
      setTerminating(null);
    }
  };

  const handleTerminateOthers = async () => {
    setLoading(true);
    try {
      await terminateOtherSessions();
      showToast('All other active sessions have been logged out.', 'success');
      fetchSessions();
    } catch (e: any) {
      showToast('Failed to terminate other sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (os?: string) => {
    if (os?.includes('Android') || os?.includes('iOS')) {
      return <PhoneIcon sx={{ color: '#0EA5E9', fontSize: 20 }} />;
    }
    return <LaptopIcon sx={{ color: '#4F46E5', fontSize: 20 }} />;
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
              background: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            }}
          >
            <DevicesIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.15rem' }}>
              Active Login Sessions & Devices
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Monitor and revoke sessions authenticated with your credentials or Microsoft SSO.
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Alert severity="info" sx={{ py: 0.5, px: 2, borderRadius: 2, fontSize: '0.8rem', flex: 1 }}>
            Enterprise Concurrent Control is active. Each device session is bound to IP and fingerprint.
          </Alert>

          {otherSessionsCount > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleTerminateOthers}
              startIcon={<DeleteIcon />}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              Logout All Other Sessions ({otherSessionsCount})
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Device & Operating System</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Browser & IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Auth Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Login Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No active sessions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id} hover sx={{ bgcolor: s.isCurrent ? 'rgba(16, 185, 129, 0.04)' : 'inherit' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          {getDeviceIcon(s.operatingSystem)}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.84rem' }}>
                              {s.operatingSystem}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                              Hash: {s.deviceFingerprint?.substring(0, 10)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>
                          {s.browser}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600, fontSize: '0.74rem' }}>
                          {s.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.loginMethod}
                          size="small"
                          color={s.loginMethod === 'SSO' ? 'info' : 'default'}
                          sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#334155', fontWeight: 500 }}>
                          {new Date(s.loginTimestamp).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {s.isCurrent ? (
                          <Chip
                            icon={<CurrentIcon sx={{ fontSize: '14px !important' }} />}
                            label="Current Session"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                          />
                        ) : (
                          <Chip
                            label="Active Remote"
                            color="primary"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {s.isCurrent ? (
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                            Active
                          </Typography>
                        ) : (
                          <Tooltip title="Revoke and Logout this session">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={terminating === s.sessionId}
                              onClick={() => handleTerminateSession(s.sessionId)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
