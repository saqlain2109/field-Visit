import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Pagination,
  Avatar,
  Checkbox,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  PictureAsPdf as PdfIcon,
  LockOpen as UnlockIcon,
  VpnKey as ResetKeyIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Cancel as FailedIcon,
  Block as BlockIcon,
  Devices as DevicesIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ShieldOutlined as ShieldIcon,
  BugReportOutlined as DevToolsIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToCsv } from '../utils/exportCsv';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const LoginLogsPage: React.FC = () => {
  const { user, unlockAccount, adminResetPassword } = useAuth();
  const { showToast } = useToast();

  const [tabValue, setTabValue] = useState(0);

  // Tab 1: Login Logs States
  const [logs, setLogs] = useState<any[]>([]);
  const [logStats, setLogStats] = useState<any>({});
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [ipFilter, setIpFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLogIds, setSelectedLogIds] = useState<number[]>([]);

  // Tab 2: Security Events States
  const [events, setEvents] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState<any>({});
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [eventPage, setEventPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

  // Tab 3: Locked Employees States
  const [lockedEmployees, setLockedEmployees] = useState<any[]>([]);
  const [loadingLocked, setLoadingLocked] = useState(false);

  // Admin Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('Enterprise@2026');

  // Delete Confirmation Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'logs-bulk' | 'events-bulk' | 'log-single' | 'event-single' | 'logs-clear-all'>('logs-bulk');
  const [targetDeleteId, setTargetDeleteId] = useState<number | null>(null);

  // Fetch Login Logs
  const fetchLoginLogs = async () => {
    setLoadingLogs(true);
    setSelectedLogIds([]);
    try {
      const res: any = await api.get('/auth/login-logs', {
        params: {
          search: search || undefined,
          loginStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
          loginMethod: methodFilter !== 'ALL' ? methodFilter : undefined,
          ipAddress: ipFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          limit: 25,
        },
      });
      if (Array.isArray(res)) {
        setLogs(res);
        setTotalLogs(res.length);
      } else if (res && typeof res === 'object') {
        setLogs(Array.isArray(res.data) ? res.data : []);
        setTotalLogs(typeof res.total === 'number' ? res.total : 0);
        setLogStats(res.stats || {});
      } else {
        setLogs([]);
        setTotalLogs(0);
      }
    } catch (e: any) {
      const errMsg = typeof e === 'string' ? e : e?.message || 'Failed to load login audit logs';
      showToast(errMsg, 'error');
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Security Events
  const fetchSecurityEvents = async () => {
    setLoadingEvents(true);
    setSelectedEventIds([]);
    try {
      const res: any = await api.get('/auth/security-events', {
        params: {
          search: eventSearch || undefined,
          severity: severityFilter !== 'ALL' ? severityFilter : undefined,
          page: eventPage,
          limit: 25,
        },
      });
      if (Array.isArray(res)) {
        setEvents(res);
        setTotalEvents(res.length);
      } else if (res && typeof res === 'object') {
        setEvents(Array.isArray(res.data) ? res.data : []);
        setTotalEvents(typeof res.total === 'number' ? res.total : 0);
        setEventStats(res.stats || {});
      } else {
        setEvents([]);
        setTotalEvents(0);
      }
    } catch (e: any) {
      const errMsg = typeof e === 'string' ? e : e?.message || 'Failed to load security incident events';
      showToast(errMsg, 'error');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch Locked Accounts
  const fetchLockedEmployees = async () => {
    setLoadingLocked(true);
    try {
      const res: any = await api.get('/auth/locked-employees');
      setLockedEmployees(Array.isArray(res) ? res : (res?.data || []));
    } catch (e: any) {
      const errMsg = typeof e === 'string' ? e : e?.message || 'Failed to load locked accounts';
      showToast(errMsg, 'error');
      setLockedEmployees([]);
    } finally {
      setLoadingLocked(false);
    }
  };

  useEffect(() => {
    if (tabValue === 0) fetchLoginLogs();
    else if (tabValue === 1) fetchSecurityEvents();
    else if (tabValue === 2) fetchLockedEmployees();
  }, [tabValue, page, eventPage, statusFilter, methodFilter, severityFilter, startDate, endDate]);

  // Selection handlers
  const handleToggleSelectAllLogs = () => {
    if (selectedLogIds.length === logs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(logs.map((l) => l.id));
    }
  };

  const handleToggleSelectLog = (id: number) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllEvents = () => {
    if (selectedEventIds.length === events.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(events.map((e) => e.id));
    }
  };

  const handleToggleSelectEvent = (id: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Delete Action Confirmations
  const confirmExecuteDelete = async () => {
    try {
      if (deleteType === 'logs-bulk') {
        await api.post('/auth/login-logs/delete', { ids: selectedLogIds });
        showToast(`Soft deleted ${selectedLogIds.length} login log(s) successfully!`, 'success');
        setSelectedLogIds([]);
        fetchLoginLogs();
      } else if (deleteType === 'log-single' && targetDeleteId) {
        await api.delete(`/auth/login-logs/${targetDeleteId}`);
        showToast('Login audit log soft deleted successfully!', 'success');
        fetchLoginLogs();
      } else if (deleteType === 'logs-clear-all') {
        await api.post('/auth/login-logs/clear-all');
        showToast('All active login logs cleared successfully!', 'success');
        setSelectedLogIds([]);
        fetchLoginLogs();
      } else if (deleteType === 'events-bulk') {
        await api.post('/auth/security-events/delete', { ids: selectedEventIds });
        showToast(`Soft deleted ${selectedEventIds.length} security event(s) successfully!`, 'success');
        setSelectedEventIds([]);
        fetchSecurityEvents();
      } else if (deleteType === 'event-single' && targetDeleteId) {
        await api.delete(`/auth/security-events/${targetDeleteId}`);
        showToast('Security incident event soft deleted successfully!', 'success');
        fetchSecurityEvents();
      }
    } catch (e: any) {
      const errMsg = typeof e === 'string' ? e : e?.response?.data?.message || e?.message || 'Failed to delete log(s)';
      showToast(errMsg, 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setTargetDeleteId(null);
    }
  };

  const handleUnlockUser = async (empId: number) => {
    try {
      await unlockAccount(empId);
      showToast('Employee account unlocked successfully!', 'success');
      fetchLockedEmployees();
      fetchLoginLogs();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to unlock account', 'error');
    }
  };

  const handleOpenResetModal = (emp: any) => {
    setSelectedEmp(emp);
    setNewAdminPassword('Password@123');
    setResetModalOpen(true);
  };

  const handleSaveAdminPassword = async () => {
    if (!selectedEmp) return;
    try {
      await adminResetPassword(selectedEmp.id, newAdminPassword);
      showToast(`Password successfully reset for ${selectedEmp.name}`, 'success');
      setResetModalOpen(false);
      fetchLockedEmployees();
      fetchLoginLogs();
    } catch (e: any) {
      const errMsg = typeof e === 'string' ? e : e?.response?.data?.message || e?.message || 'Password policy violation (min 8 chars, upper, lower, number, special)';
      showToast(errMsg, 'error');
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const dataToExport = logs.map((l) => ({
      LogID: l.id,
      Timestamp: new Date(l.loginTimestamp).toLocaleString('en-IN'),
      EmployeeID: l.employeeId || 'N/A',
      EmployeeName: l.employeeName || 'Anonymous',
      Email: l.email,
      LoginMethod: l.loginMethod,
      LoginStatus: l.loginStatus,
      FailureReason: l.failureReason || 'None',
      IPAddress: l.ipAddress,
      Browser: l.browser,
      OperatingSystem: l.operatingSystem,
      DeviceFingerprint: l.deviceFingerprint,
      SessionID: l.sessionId || 'N/A',
      SessionDurationSec: l.sessionDuration || 'Active',
      AutoProvisioned: l.autoProvisioned ? 'YES' : 'NO',
      Details: l.details || '',
    }));

    exportToCsv(`Security_Login_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`, dataToExport);
    showToast('Login logs exported to CSV/Excel successfully!', 'success');
  };

  const handleDatePreset = (preset: 'today' | 'yesterday' | '7days' | 'month' | 'all') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatDate(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      setStartDate(formatDate(past7));
      setEndDate(formatDate(today));
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else {
      setStartDate('');
      setEndDate('');
    }
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return <Chip icon={<SuccessIcon sx={{ fontSize: '15px !important' }} />} label="Success" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'Failed':
        return <Chip icon={<FailedIcon sx={{ fontSize: '15px !important' }} />} label="Failed" color="error" size="small" sx={{ fontWeight: 700 }} />;
      case 'Blocked':
        return <Chip icon={<BlockIcon sx={{ fontSize: '15px !important' }} />} label="Blocked" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case 'Locked':
        return <Chip icon={<WarningIcon sx={{ fontSize: '15px !important' }} />} label="Account Locked" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'Logout':
        return <Chip label="Logged Out" color="default" size="small" sx={{ fontWeight: 700, bgcolor: '#E2E8F0', color: '#475569' }} />;
      default:
        return <Chip label={status || 'Unknown'} size="small" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return <Chip label="CRITICAL" color="error" size="small" sx={{ fontWeight: 900, bgcolor: '#991B1B', color: '#FFF' }} />;
      case 'High':
        return <Chip label="HIGH" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'Medium':
        return <Chip label="MEDIUM" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case 'Low':
        return <Chip label="LOW" color="info" size="small" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip label={sev || 'Info'} size="small" />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
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
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Enterprise Security & Login Audit
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Comprehensive authentication logs, lockout monitoring & incident audit trail.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={() => {
              if (tabValue === 0) fetchLoginLogs();
              else if (tabValue === 1) fetchSecurityEvents();
              else if (tabValue === 2) fetchLockedEmployees();
            }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Export Audit (CSV)
          </Button>
        </Stack>
      </Box>

      {/* KPI Date Range Presets */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mr: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          📅 Filter Period:
        </Typography>
        <Chip
          label="All Time"
          clickable
          color={!startDate && !endDate ? 'primary' : 'default'}
          variant={!startDate && !endDate ? 'filled' : 'outlined'}
          onClick={() => handleDatePreset('all')}
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
        <Chip
          label="Today"
          clickable
          color={startDate === new Date().toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0] ? 'primary' : 'default'}
          variant={startDate === new Date().toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0] ? 'filled' : 'outlined'}
          onClick={() => handleDatePreset('today')}
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
        <Chip
          label="Yesterday"
          clickable
          onClick={() => handleDatePreset('yesterday')}
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
        <Chip
          label="Last 7 Days"
          clickable
          onClick={() => handleDatePreset('7days')}
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
        <Chip
          label="This Month"
          clickable
          onClick={() => handleDatePreset('month')}
          size="small"
          sx={{ fontWeight: 700, borderRadius: 1.5 }}
        />
      </Box>

      {/* KPI Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Logins (Audited)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mt: 0.5 }}>
              {logStats.totalLogins !== undefined ? logStats.totalLogins : totalLogs}
            </Typography>
            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
              ✓ {logStats.successfulLogins || 0} Successful Logins
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #FECACA', bgcolor: '#FEF2F2' }}>
            <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 700, textTransform: 'uppercase' }}>
              Failed / Blocked Attempts
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#DC2626', mt: 0.5 }}>
              {logStats.failedLogins || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 600 }}>
              Progressive lockout protection active
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F0FDFA' }}>
            <Typography variant="caption" sx={{ color: '#0D9488', fontWeight: 700, textTransform: 'uppercase' }}>
              Microsoft Entra SSO Logins
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F766E', mt: 0.5 }}>
              {logStats.ssoLogins || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 600 }}>
              {logStats.autoProvisionedCount || 0} auto-provisioned accounts
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #FDE68A', bgcolor: '#FFFBEB' }}>
            <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700, textTransform: 'uppercase' }}>
              Active Lockouts Watcher
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
              {lockedEmployees.length}
            </Typography>
            <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600 }}>
              Accounts temporarily locked
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Tabs Container */}
      <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#F8FAFC', px: 2 }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab
              label={`Login & Session Logs (${totalLogs})`}
              icon={<ShieldIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ fontWeight: 700 }}
            />
            <Tab
              label={`Security Incidents & DevTools (${eventStats.totalEvents || totalEvents})`}
              icon={<DevToolsIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ fontWeight: 700 }}
            />
            <Tab
              label={`Locked Accounts Watcher (${lockedEmployees.length})`}
              icon={<WarningIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ fontWeight: 700 }}
            />
          </Tabs>
        </Box>

        {/* TAB 1: LOGIN LOGS */}
        <CustomTabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            {/* Filter Bar & Bulk Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search email, employee, IP, browser..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ minWidth: 240 }}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 19 }} />,
                  }}
                />

                <TextField
                  select
                  size="small"
                  label="Login Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="Success">Success</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                  <MenuItem value="Blocked">Blocked / Inactive</MenuItem>
                  <MenuItem value="Locked">Account Locked</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Login Method"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="ALL">All Methods</MenuItem>
                  <MenuItem value="Microsoft SSO">Microsoft SSO</MenuItem>
                  <MenuItem value="Google SSO">Google SSO</MenuItem>
                  <MenuItem value="Credential">Internal Credential</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  label="Filter IP"
                  placeholder="e.g. 192.168"
                  value={ipFilter}
                  onChange={(e) => setIpFilter(e.target.value)}
                  sx={{ width: 130 }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{ width: 135 }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="End Date"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{ width: 135 }}
                />

                <Button variant="contained" onClick={() => { setPage(1); fetchLoginLogs(); }}>
                  Search Logs
                </Button>

                {(search || statusFilter !== 'ALL' || methodFilter !== 'ALL' || ipFilter || startDate || endDate) && (
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                      setMethodFilter('ALL');
                      setIpFilter('');
                      setStartDate('');
                      setEndDate('');
                      setPage(1);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Box>

              {/* Bulk & Maintenance Actions */}
              <Stack direction="row" spacing={1}>
                {selectedLogIds.length > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setDeleteType('logs-bulk');
                      setDeleteConfirmOpen(true);
                    }}
                    sx={{ fontWeight: 700, textTransform: 'none' }}
                  >
                    Delete Selected ({selectedLogIds.length})
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => {
                    setDeleteType('logs-clear-all');
                    setDeleteConfirmOpen(true);
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Clear All Logs
                </Button>
              </Stack>
            </Box>

            {/* Table */}
            {loadingLogs ? (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={logs.length > 0 && selectedLogIds.length === logs.length}
                          indeterminate={selectedLogIds.length > 0 && selectedLogIds.length < logs.length}
                          onChange={handleToggleSelectAllLogs}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Log ID & Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Employee Identity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Login Method</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status & Event</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Failure Reason</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Browser & OS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#64748B' }}>
                          No login records match the selected filter criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => {
                        const isSelected = selectedLogIds.includes(log.id);
                        return (
                          <TableRow key={log.id} hover selected={isSelected}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleSelectLog(log.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.82rem' }}>
                                #{log.id}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                {new Date(log.loginTimestamp).toLocaleString('en-IN', {
                                  dateStyle: 'short',
                                  timeStyle: 'medium',
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#4F46E5', fontWeight: 700 }}>
                                  {(log.employeeName || log.email).charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>
                                    {log.employeeName || 'Unregistered User'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                    {log.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.loginMethod}
                                size="small"
                                color={log.loginMethod === 'Microsoft SSO' ? 'info' : log.loginMethod === 'Google SSO' ? 'success' : 'primary'}
                                variant={log.loginMethod?.includes('SSO') ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                {getStatusBadge(log.loginStatus)}
                                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                                  {log.eventType}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {log.failureReason ? (
                                <Typography variant="caption" sx={{ color: log.loginStatus === 'Logout' ? '#64748B' : '#DC2626', fontWeight: 600 }}>
                                  {log.failureReason}
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#10B981' }}>
                                  None (Clean)
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0284C7', fontSize: '0.82rem' }}>
                                {log.ipAddress}
                              </Typography>
                              {log.country && (
                                <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontWeight: 600, fontSize: '0.72rem' }}>
                                  📍 {log.country}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                {log.browser}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                {log.operatingSystem}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Soft Delete Log">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setTargetDeleteId(log.id);
                                    setDeleteType('log-single');
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, totalLogs)} of {totalLogs} login logs
                  </Typography>
                  <Pagination
                    count={Math.ceil(totalLogs / 25) || 1}
                    page={page}
                    onChange={(_, val) => setPage(val)}
                    color="primary"
                    size="small"
                  />
                </Box>
              </Box>
            )}
          </Box>
        </CustomTabPanel>

        {/* TAB 2: SECURITY INCIDENTS & DEVTOOLS ALERTS */}
        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search incident, user, IP, description..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  sx={{ minWidth: 260 }}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 19 }} />,
                  }}
                />
                <TextField
                  select
                  size="small"
                  label="Severity Filter"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="ALL">All Severities</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </TextField>
                <Button variant="contained" onClick={() => { setEventPage(1); fetchSecurityEvents(); }}>
                  Filter Incidents
                </Button>
              </Box>

              {selectedEventIds.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setDeleteType('events-bulk');
                    setDeleteConfirmOpen(true);
                  }}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Delete Selected ({selectedEventIds.length})
                </Button>
              )}
            </Box>

            {loadingEvents ? (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={events.length > 0 && selectedEventIds.length === events.length}
                          indeterminate={selectedEventIds.length > 0 && selectedEventIds.length < events.length}
                          onChange={handleToggleSelectAllEvents}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>User / Employee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Incident Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP & Device</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Page URL</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description & Metadata</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#64748B' }}>
                          No security incidents or DevTools inspection violations detected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((ev) => {
                        const isSelected = selectedEventIds.includes(ev.id);
                        return (
                          <TableRow key={ev.id} hover selected={isSelected}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleSelectEvent(ev.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                {new Date(ev.timestamp).toLocaleString('en-IN', {
                                  dateStyle: 'short',
                                  timeStyle: 'medium',
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>
                                {ev.employeeName || 'Anonymous / Pre-auth'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {ev.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={<DevToolsIcon sx={{ fontSize: '14px !important' }} />}
                                label={ev.eventType}
                                size="small"
                                sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                              />
                            </TableCell>
                            <TableCell>{getSeverityBadge(ev.severity)}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0284C7', fontSize: '0.82rem' }}>
                                {ev.ipAddress}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                {ev.browser}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', bgcolor: '#F1F5F9', px: 1, py: 0.3, borderRadius: 1 }}>
                                {ev.pageUrl || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 350 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#1E293B', lineHeight: 1.3 }}>
                                {ev.description}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Soft Delete Event">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setTargetDeleteId(ev.id);
                                    setDeleteType('event-single');
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        </CustomTabPanel>

        {/* TAB 3: LOCKED ACCOUNTS WATCHER */}
        <CustomTabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Accounts Locked by Progressive Login Lockout Engine
              </Typography>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchLockedEmployees} size="small">
                Refresh Lockouts
              </Button>
            </Box>

            {loadingLocked ? (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Emp #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Failed Attempts</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lockout Tier & Expiry</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Admin Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lockedEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#10B981', fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <SuccessIcon color="success" />
                          <span>All accounts are in good standing. No active employee lockouts!</span>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lockedEmployees.map((emp) => (
                      <TableRow key={emp.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{emp.employeeNo}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.branch || 'Mumbai HQ'}</TableCell>
                        <TableCell>
                          <Chip label={`${emp.failedLoginAttempts || 0} Failed Attempts`} color="error" size="small" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          {emp.isLocked ? (
                            <Chip label="Permanent Lockout (Tier 3)" color="error" size="small" sx={{ fontWeight: 800 }} />
                          ) : emp.lockoutExpiresAt ? (
                            <Chip
                              label={`Temp Lockout until ${new Date(emp.lockoutExpiresAt).toLocaleTimeString('en-IN')}`}
                              color="warning"
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          ) : (
                            <Chip label={`Tier ${emp.lockoutTier}`} size="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Unlock Account Now">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<UnlockIcon />}
                                onClick={() => handleUnlockUser(emp.id)}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.4 }}
                              >
                                Unlock
                              </Button>
                            </Tooltip>
                            <Tooltip title="Reset Password Directly">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<ResetKeyIcon />}
                                onClick={() => handleOpenResetModal(emp)}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.4 }}
                              >
                                Reset Password
                              </Button>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        </CustomTabPanel>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
          Confirm Soft Delete
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#334155' }}>
            {deleteType === 'logs-clear-all'
              ? 'Are you sure you want to clear all active login logs? They will be soft deleted and hidden from the table.'
              : deleteType === 'logs-bulk'
              ? `Are you sure you want to soft delete ${selectedLogIds.length} selected login log(s)?`
              : deleteType === 'events-bulk'
              ? `Are you sure you want to soft delete ${selectedEventIds.length} selected security incident(s)?`
              : 'Are you sure you want to soft delete this item? It will no longer appear in the audit trail.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmExecuteDelete} sx={{ fontWeight: 700 }}>
            Yes, Soft Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Direct Password Reset Modal */}
      <Dialog open={resetModalOpen} onClose={() => setResetModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Reset Employee Password</span>
          <IconButton size="small" onClick={() => setResetModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#334155' }}>
            Enter a compliant password for <strong>{selectedEmp?.name}</strong> (#{selectedEmp?.employeeNo}):
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="New Password *"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            helperText="Min 8 characters with Uppercase, Lowercase, Numbers, and Special characters."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Quick: Password@123"
              size="small"
              onClick={() => setNewAdminPassword('Password@123')}
              clickable
              color={newAdminPassword === 'Password@123' ? 'primary' : 'default'}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            <Chip
              label="Quick: Admin@2026"
              size="small"
              onClick={() => setNewAdminPassword('Admin@2026')}
              clickable
              color={newAdminPassword === 'Admin@2026' ? 'primary' : 'default'}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setResetModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveAdminPassword} sx={{ fontWeight: 700 }}>
            UPDATE & UNLOCK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginLogsPage;
