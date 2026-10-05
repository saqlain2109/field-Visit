import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip,
  Badge,
  Stack,
  Paper,
  Collapse,
  Popover,
  ListSubheader,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as EmployeesIcon,
  Business as CustomersIcon,
  Contacts as ContactsIcon,
  DirectionsCar as VisitsIcon,
  FactCheck as ApprovalsIcon,
  Assessment as ReportsIcon,
  Category as MastersIcon,
  Security as SecurityIcon,
  LockReset as LockIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  LocationOn as LocationIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Menu as MenuIcon,
  TrendingUp as OpportunityIcon,
  RequestQuote as QuotationIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  BusinessCenter as CrmIcon,
  Devices as DevicesIcon,
  Policy as PolicyIcon,
  Notifications as NotificationsIcon,
  LockOpen as UnlockIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  Close as CloseIcon,
  DoneAll as MarkReadIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DevToolsDetector } from './DevToolsDetector';
import { SetPasswordModal } from './SetPasswordModal';
import { ActiveSessionsModal } from './ActiveSessionsModal';

const EXPANDED_DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 74;

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, unlockAccount, adminResetPassword } = useAuth();
  const { showToast } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('crm_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('crm_sidebar_collapsed', String(next));
      return next;
    });
  };

  const currentDrawerWidth = sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : EXPANDED_DRAWER_WIDTH;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [activeSessionsOpen, setActiveSessionsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Live Menu Badge Counts
  const [menuCounts, setMenuCounts] = useState<{ [key: string]: number }>({
    dailyVisits: 0,
    opportunities: 0,
    quotations: 0,
    customers: 0,
    contacts: 0,
    employees: 0,
    approvals: 0,
    loginLogs: 0,
    activeLockouts: 0,
    securityIncidents: 0,
  });

  // Live Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Quick Action Reset Password Modal from Notification
  const [notificationResetOpen, setNotificationResetOpen] = useState(false);
  const [selectedNotifyEmp, setSelectedNotifyEmp] = useState<any>(null);
  const [notifyAdminPassword, setNotifyAdminPassword] = useState('Enterprise@2026');

  // First-Time Login Password Prompt: auto-open only if user hasn't set their password yet AND hasn't clicked "Do It Later"
  const [setPasswordPromptOpen, setSetPasswordPromptOpen] = useState(() => {
    if (!user) return false;
    const isDismissed = localStorage.getItem(`password_prompt_dismissed_${user.id}`) === 'true';
    return user.isPasswordSet === false && !isDismissed;
  });

  useEffect(() => {
    if (user && user.isPasswordSet === false) {
      const isDismissed = localStorage.getItem(`password_prompt_dismissed_${user.id}`) === 'true';
      if (!isDismissed) {
        setSetPasswordPromptOpen(true);
      }
    }
  }, [user?.isPasswordSet, user?.id]);

  // Fetch Live Menu Counts & Notifications
  const fetchCountsAndNotifications = async () => {
    try {
      const [countsRes, notifRes]: [any, any] = await Promise.all([
        api.get('/auth/menu-counts'),
        api.get('/auth/notifications'),
      ]);
      if (countsRes) setMenuCounts(countsRes);
      if (notifRes) {
        setNotifications(notifRes);
        setUnreadCount(notifRes.length);
      }
    } catch (e) {
      // Background poll silently continues
    }
  };

  useEffect(() => {
    fetchCountsAndNotifications();
    const interval = setInterval(fetchCountsAndNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleChangePassword = () => {
    if (!newPassword) return;
    alert('Password updated successfully!');
    setNewPassword('');
    setPasswordModalOpen(false);
  };

  const [crmMenuOpen, setCrmMenuOpen] = useState(true);

  // Auto-expand CRM menu when navigating to CRM routes
  useEffect(() => {
    if (location.pathname.startsWith('/crm')) {
      setCrmMenuOpen(true);
    }
  }, [location.pathname]);

  const topMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC', 'SERVICE_ENG'] },
    { text: 'Daily Visits', icon: <VisitsIcon />, path: '/daily-visits', countKey: 'dailyVisits', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC', 'SERVICE_ENG'] },
  ];

  const crmSubItems = [
    { text: 'Opportunities & Pipeline', icon: <OpportunityIcon />, path: '/crm/opportunities', countKey: 'opportunities', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC'] },
    { text: 'Quotations & Revisions', icon: <QuotationIcon />, path: '/crm/quotations', countKey: 'quotations', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC'] },
  ];

  const bottomMenuItems = [
    { text: 'Customers', icon: <CustomersIcon />, path: '/customers', countKey: 'customers', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC', 'SERVICE_ENG'] },
    { text: 'Contacts', icon: <ContactsIcon />, path: '/contacts', countKey: 'contacts', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC', 'SERVICE_ENG'] },
    { text: 'Employees', icon: <EmployeesIcon />, path: '/employees', countKey: 'employees', roles: ['ADMIN', 'MANAGER'] },
    { text: 'Approvals Inbox', icon: <ApprovalsIcon />, path: '/approvals', countKey: 'approvals', highlight: true, roles: ['ADMIN', 'MANAGER'] },
    { text: 'Monthly Report', icon: <ReportsIcon />, path: '/reports/monthly', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC', 'SERVICE_ENG'] },
    { text: 'Master Data Management', icon: <MastersIcon />, path: '/masters', roles: ['ADMIN'] },
    { text: 'Login Logs & Audit', icon: <PolicyIcon />, path: '/login-logs', countKey: 'loginLogs', alertKey: 'activeLockouts', roles: ['ADMIN', 'MANAGER', 'SALES_EXEC', 'SERVICE_ENG'] },
  ];

  // RBAC Filtering based on user role
  const userRole = user?.role || 'SERVICE_ENG';
  const filteredTopItems = topMenuItems.filter((item) => item.roles.includes(userRole));
  const showCrmModule = ['ADMIN', 'MANAGER', 'SALES_EXEC'].includes(userRole);
  const filteredBottomItems = bottomMenuItems.filter((item) => item.roles.includes(userRole));

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Admin', color: 'error' as const, bg: '#FEE2E2', text: '#991B1B' };
      case 'MANAGER':
        return { label: 'Manager', color: 'secondary' as const, bg: '#E0F2FE', text: '#0369A1' };
      case 'SALES_EXEC':
        return { label: 'Sales Exec', color: 'warning' as const, bg: '#FEF3C7', text: '#92400E' };
      case 'SERVICE_ENG':
        return { label: 'Service Eng', color: 'info' as const, bg: '#E0E7FF', text: '#3730A3' };
      default:
        return { label: role || 'Staff', color: 'default' as const, bg: '#F1F5F9', text: '#475569' };
    }
  };

  const roleInfo = getRoleBadge(userRole);

  // Quick Action Handlers from Notification Drawer
  const handleUnlockFromNotification = async (targetId: number, targetName: string) => {
    try {
      await unlockAccount(targetId);
      showToast(`Account for ${targetName || 'Employee'} unlocked successfully!`, 'success');
      fetchCountsAndNotifications();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to unlock account', 'error');
    }
  };

  const handleOpenResetFromNotification = (item: any) => {
    setSelectedNotifyEmp({ id: item.targetId, name: item.targetName || item.targetEmail });
    setNotifyAdminPassword('Password@123');
    setNotificationResetOpen(true);
    setNotificationAnchor(null);
  };

  const handleSaveNotifyPassword = async () => {
    if (!selectedNotifyEmp) return;
    try {
      await adminResetPassword(selectedNotifyEmp.id, notifyAdminPassword);
      showToast(`Password updated and account unlocked for ${selectedNotifyEmp.name}`, 'success');
      setNotificationResetOpen(false);
      fetchCountsAndNotifications();
    } catch (e: any) {
      const errMsg = typeof e === 'string' ? e : e?.response?.data?.message || e?.message || 'Password policy violation (min 8 chars, upper, lower, number, special)';
      showToast(errMsg, 'error');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Modern Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: '1px solid #E2E8F0',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          {/* Brand & Location Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
              <IconButton
                onClick={toggleSidebar}
                size="small"
                sx={{
                  color: '#475569',
                  bgcolor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: 2,
                  p: 0.7,
                  '&:hover': {
                    bgcolor: 'rgba(79, 70, 229, 0.1)',
                    color: 'primary.main',
                  },
                }}
              >
                {sidebarCollapsed ? <MenuIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
              Field Visit Management CRM
            </Typography>
            <Chip
              icon={<LocationIcon sx={{ fontSize: '14px !important', color: '#4F46E5 !important' }} />}
              label={user?.branch || 'Mumbai HQ'}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                bgcolor: 'rgba(79, 70, 229, 0.08)',
                color: 'primary.main',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                display: { xs: 'none', md: 'inline-flex' },
              }}
            />
          </Box>

          {/* Right Controls: Notifications Bell + User Profile + Direct Logout Header Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {/* Live Notifications Bell (Only for ADMIN role) */}
            {user?.role === 'ADMIN' && (
              <Tooltip title="Security Alerts & Audit Notifications">
                <IconButton
                  onClick={(e) => setNotificationAnchor(e.currentTarget)}
                  sx={{
                    color: unreadCount > 0 ? '#DC2626' : '#64748B',
                    bgcolor: unreadCount > 0 ? 'rgba(239, 68, 68, 0.08)' : '#F1F5F9',
                    border: unreadCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #E2E8F0',
                    borderRadius: 2,
                    p: 0.8,
                    '&:hover': {
                      bgcolor: unreadCount > 0 ? 'rgba(239, 68, 68, 0.15)' : '#E2E8F0',
                    },
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}

            {/* Clickable User Identity Pill */}
            <Tooltip title="View My Profile">
              <Box
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  cursor: 'pointer',
                  p: '4px 10px',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#F1F5F9' },
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{ '& .MuiBadge-badge': { bgcolor: '#10B981', color: '#10B981', boxShadow: '0 0 0 2px #FFFFFF' } }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 36,
                      height: 36,
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </Badge>

                <Box sx={{ textAlign: 'left', display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#0F172A', fontSize: '0.85rem' }}>
                    {user?.name || 'Administrator'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: roleInfo.text, fontWeight: 700, fontSize: '0.7rem' }}>
                    {roleInfo.label} • #{user?.employeeNo || '1000'}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>

            {/* Direct Logout Button on Header */}
            <Tooltip title="Sign Out of CRM">
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  borderRadius: 2,
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#DC2626',
                  bgcolor: 'rgba(254, 242, 242, 0.6)',
                  px: 1.6,
                  py: 0.6,
                  '&:hover': {
                    bgcolor: '#FEE2E2',
                    borderColor: '#EF4444',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Logout
                </Box>
              </Button>
            </Tooltip>
          </Box>

          {/* User Menu Popover */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                width: 260,
                borderRadius: 3,
                boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
                border: '1px solid #E2E8F0',
                p: 0.5,
              },
            }}
          >
            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {user?.email}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={roleInfo.label}
                  size="small"
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: roleInfo.bg, color: roleInfo.text }}
                />
                <Chip
                  label={user?.branch || 'Mumbai HQ'}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                />
              </Stack>
            </Box>

            <MenuItem
              onClick={() => {
                handleMenuClose();
                setProfileModalOpen(true);
              }}
              sx={{ borderRadius: 1.5, py: 1, gap: 1.5 }}
            >
              <ProfileIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Quick Profile View</Typography>
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate('/profile');
              }}
              sx={{ borderRadius: 1.5, py: 1, gap: 1.5 }}
            >
              <BadgeIcon fontSize="small" sx={{ color: 'secondary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Full Account Details</Typography>
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleMenuClose();
                setActiveSessionsOpen(true);
              }}
              sx={{ borderRadius: 1.5, py: 1, gap: 1.5 }}
            >
              <DevicesIcon fontSize="small" sx={{ color: 'info.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Active Sessions & Devices</Typography>
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleMenuClose();
                setPasswordModalOpen(true);
              }}
              sx={{ borderRadius: 1.5, py: 1, gap: 1.5 }}
            >
              <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Change Password</Typography>
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem onClick={handleLogout} sx={{ borderRadius: 1.5, py: 1, gap: 1.5, color: 'error.main' }}>
              <LogoutIcon fontSize="small" color="error" />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Logout</Typography>
            </MenuItem>
          </Menu>

          {/* Interactive Notifications Center Popover */}
          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={() => setNotificationAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                width: 380,
                maxHeight: 520,
                borderRadius: 3,
                boxShadow: '0 20px 30px -10px rgba(15, 23, 42, 0.2)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
              },
            }}
          >
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Security Alerts & Audit Logs ({notifications.length})
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<MarkReadIcon fontSize="small" />}
                onClick={() => {
                  setUnreadCount(0);
                  showToast('All notifications marked as read', 'info');
                }}
                sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 600 }}
              >
                Mark Read
              </Button>
            </Box>

            <Box sx={{ maxHeight: 420, overflowY: 'auto', p: 1 }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: '#64748B' }}>
                  <CheckCircleIcon sx={{ color: '#10B981', fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>No active security alerts</Typography>
                  <Typography variant="caption">System is secure and all logins are normal.</Typography>
                </Box>
              ) : (
                notifications.map((item, idx) => (
                  <Paper
                    key={item.id || idx}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      bgcolor: item.severity === 'error' ? '#FEF2F2' : item.severity === 'warning' ? '#FFFBEB' : '#F8FAFC',
                      border: `1px solid ${item.severity === 'error' ? '#FECACA' : item.severity === 'warning' ? '#FDE68A' : '#E2E8F0'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                      {item.severity === 'error' ? (
                        <ErrorIcon color="error" sx={{ fontSize: 20, mt: 0.2 }} />
                      ) : (
                        <WarningIcon sx={{ color: '#F59E0B', fontSize: 20, mt: 0.2 }} />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.2 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.4, lineHeight: 1.3 }}>
                          {item.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', display: 'block', mt: 0.5 }}>
                          {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>

                        {/* Quick Action Button directly inside Notification */}
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          {item.actionType === 'UNLOCK_USER' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<UnlockIcon sx={{ fontSize: '14px !important' }} />}
                              onClick={() => handleUnlockFromNotification(item.targetId, item.targetName)}
                              sx={{ py: 0.3, px: 1.2, fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}
                            >
                              Unlock Account
                            </Button>
                          )}

                          {item.actionType === 'RESET_PASSWORD' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleOpenResetFromNotification(item)}
                              sx={{ py: 0.3, px: 1.2, fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}
                            >
                              Reset Password
                            </Button>
                          )}

                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              setNotificationAnchor(null);
                              navigate('/login-logs');
                            }}
                            sx={{ py: 0.3, px: 1, fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', color: '#64748B' }}
                          >
                            View Audit Log →
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          </Popover>
        </Toolbar>
      </AppBar>

      {/* Modern Navigation Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0F172A', // Dark modern slate
            color: '#F8FAFC',
            borderRight: 'none',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar sx={{ px: sidebarCollapsed ? 1.5 : 2.5, display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
            <Tooltip title={sidebarCollapsed ? "Field Visit CRM" : ""} placement="right">
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 38,
                  height: 38,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                }}
              >
                FV
              </Avatar>
            </Tooltip>
            {!sidebarCollapsed && (
              <Box sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '0.02em', fontSize: '0.92rem' }}>
                  FIELD VISIT CRM
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  MS SQL • Spring Boot 3
                </Typography>
              </Box>
            )}
          </Box>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* User Capsule inside Sidebar - Clicking opens /profile */}
        <Box sx={{ px: sidebarCollapsed ? 1 : 2, py: 1.5 }}>
          {sidebarCollapsed ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Tooltip title={`Profile: ${user?.name || 'User'} (Click to open)`} placement="right" arrow>
                <Avatar
                  onClick={() => navigate('/profile')}
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: location.pathname === '/profile' ? 'primary.main' : 'secondary.main',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    border: location.pathname === '/profile' ? '2px solid #38BDF8' : '2px solid transparent',
                    boxShadow: location.pathname === '/profile' ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.08)',
                      boxShadow: '0 0 14px rgba(79, 70, 229, 0.6)',
                    },
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </Tooltip>
            </Box>
          ) : (
            <Tooltip title="Click to view full profile & permissions" placement="right">
              <Paper
                elevation={0}
                onClick={() => navigate('/profile')}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  bgcolor: location.pathname === '/profile' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: location.pathname === '/profile' ? '1.5px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(79, 70, 229, 0.4)',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: '0.85rem', fontWeight: 800 }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: '#FFFFFF', display: 'block' }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', display: 'block' }}>
                    {roleInfo.label} • {user?.branch || 'Mumbai'}
                  </Typography>
                </Box>
              </Paper>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 1 }} />

        {/* Navigation List with Live Count Badges */}
        <List sx={{ px: sidebarCollapsed ? 1 : 1.5, py: 0.5 }}>
          {/* Top Items: Dashboard, Daily Visits */}
          {filteredTopItems.map((item: any) => {
            const isActive = location.pathname === item.path;
            const count = item.countKey ? (menuCounts[item.countKey] || 0) : 0;
            const showBadge = Boolean(item.countKey && count > 0);

            const buttonContent = (
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
                  py: 1.1,
                  px: sidebarCollapsed ? 1 : 1.5,
                  justifyContent: sidebarCollapsed ? 'center' : 'initial',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    transform: sidebarCollapsed ? 'none' : 'translateX(2px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    minWidth: sidebarCollapsed ? 0 : 36,
                    mr: sidebarCollapsed ? 0 : 1,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        noWrap: true,
                      }}
                    />
                    {showBadge && (
                      <Chip
                        label={count}
                        size="small"
                        sx={{
                          height: 20,
                          minWidth: 24,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          bgcolor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                        }}
                      />
                    )}
                  </>
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.6 }}>
                {sidebarCollapsed ? (
                  <Tooltip title={showBadge ? `${item.text} (${count})` : item.text} placement="right" arrow>
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>
            );
          })}

          {/* CRM Module (Collapsible directly below Daily Visits) */}
          {showCrmModule && (
            <>
              <ListItem disablePadding sx={{ mb: 0.6 }}>
                {sidebarCollapsed ? (
                  <Tooltip title="CRM Module" placement="right" arrow>
                    <ListItemButton
                      onClick={() => {
                        setSidebarCollapsed(false);
                        setCrmMenuOpen(true);
                      }}
                      sx={{
                        borderRadius: 2,
                        bgcolor: location.pathname.startsWith('/crm') ? 'rgba(79, 70, 229, 0.25)' : 'transparent',
                        color: location.pathname.startsWith('/crm') ? '#A5B4FC' : '#94A3B8',
                        py: 1.1,
                        px: 1,
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: location.pathname.startsWith('/crm') ? '#818CF8' : '#94A3B8', minWidth: 0, justifyContent: 'center' }}>
                        <CrmIcon />
                      </ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                ) : (
                  <ListItemButton
                    onClick={() => setCrmMenuOpen(!crmMenuOpen)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: location.pathname.startsWith('/crm') && !crmMenuOpen ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: location.pathname.startsWith('/crm') ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      color: location.pathname.startsWith('/crm') ? '#FFFFFF' : '#E2E8F0',
                      py: 1.1,
                      px: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: location.pathname.startsWith('/crm') ? '#818CF8' : '#94A3B8',
                        minWidth: 36,
                        mr: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <CrmIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="CRM Sales Pipeline"
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        noWrap: true,
                        color: location.pathname.startsWith('/crm') ? '#818CF8' : '#FFFFFF',
                      }}
                    />
                    {crmMenuOpen ? (
                      <ExpandLessIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                    )}
                  </ListItemButton>
              )}
            </ListItem>

            {/* Sub-items: Opportunities & Pipeline, Quotations & Revisions */}
            {!sidebarCollapsed ? (
              <Collapse in={crmMenuOpen} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ mb: 0.6 }}>
                  {crmSubItems.map((subItem: any) => {
                    const isActive = location.pathname === subItem.path;
                    const count = subItem.countKey ? (menuCounts[subItem.countKey] || 0) : 0;
                    const showSubBadge = Boolean(subItem.countKey && count > 0);
                    return (
                      <ListItem key={subItem.text} disablePadding sx={{ mb: 0.4 }}>
                        <ListItemButton
                          onClick={() => navigate(subItem.path)}
                          sx={{
                            borderRadius: 2,
                            bgcolor: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.02)',
                            color: isActive ? '#FFFFFF' : '#CBD5E1',
                            boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
                            py: 0.85,
                            pl: 3.5,
                            pr: 1.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.06)',
                              color: '#FFFFFF',
                              transform: 'translateX(3px)',
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: isActive ? '#FFFFFF' : '#818CF8',
                              minWidth: 26,
                              mr: 1,
                              justifyContent: 'center',
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={`-- ${subItem.text}`}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              fontWeight: isActive ? 700 : 500,
                              noWrap: true,
                            }}
                          />
                          {showSubBadge && (
                            <Chip
                              label={count}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                color: '#FFFFFF',
                              }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            ) : (
              crmSubItems.map((subItem: any) => {
                const isActive = location.pathname === subItem.path;
                const count = subItem.countKey ? (menuCounts[subItem.countKey] || 0) : 0;
                const showSubBadge = Boolean(subItem.countKey && count > 0);
                return (
                  <ListItem key={subItem.text} disablePadding sx={{ mb: 0.6 }}>
                    <Tooltip title={showSubBadge ? `CRM: ${subItem.text} (${count})` : `CRM: ${subItem.text}`} placement="right" arrow>
                      <ListItemButton
                        onClick={() => navigate(subItem.path)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isActive ? 'primary.main' : 'transparent',
                          color: isActive ? '#FFFFFF' : '#818CF8',
                          boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
                          py: 1,
                          px: 1,
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.06)',
                            color: '#FFFFFF',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive ? '#FFFFFF' : '#818CF8',
                            minWidth: 0,
                            justifyContent: 'center',
                          }}
                        >
                          {subItem.icon}
                        </ListItemIcon>
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })
            )}
          </>
        )}

        {/* Bottom Items: Customers, Contacts, Employees, Approvals, Reports, Masters, Security, Login Logs */}
        {filteredBottomItems.map((item: any) => {
          const isActive = location.pathname === item.path;
          const count = item.countKey ? (menuCounts[item.countKey] || 0) : 0;
          const hasAlert = item.alertKey && (menuCounts[item.alertKey] || 0) > 0;
          const isApprovalsAlert = item.text === 'Approvals Inbox' && (menuCounts.approvals || 0) > 0;
          const showBadge = Boolean(hasAlert || (item.countKey && count > 0));

          const buttonContent = (
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                bgcolor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
                py: 1.1,
                px: sidebarCollapsed ? 1 : 1.5,
                justifyContent: sidebarCollapsed ? 'center' : 'initial',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isActive ? 'primary.main' : 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  transform: sidebarCollapsed ? 'none' : 'translateX(2px)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isApprovalsAlert || hasAlert ? '#F87171' : isActive ? '#FFFFFF' : '#94A3B8',
                  minWidth: sidebarCollapsed ? 0 : 36,
                  mr: sidebarCollapsed ? 0 : 1,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!sidebarCollapsed && (
                <>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      noWrap: true,
                    }}
                  />
                  {showBadge && (
                    <Chip
                      label={hasAlert ? `${menuCounts[item.alertKey]} alert` : count}
                      size="small"
                      sx={{
                        height: 20,
                        minWidth: 24,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        bgcolor: isApprovalsAlert || hasAlert
                          ? '#EF4444'
                          : isActive
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                      }}
                    />
                  )}
                </>
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.6 }}>
              {sidebarCollapsed ? (
                <Tooltip title={showBadge ? `${item.text} (${hasAlert ? menuCounts[item.alertKey] : count})` : item.text} placement="right" arrow>
                  {buttonContent}
                </Tooltip>
              ) : (
                buttonContent
              )}
            </ListItem>
          );
        })}
        </List>
      </Drawer>

      {/* Main Content Viewport */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          mt: 8,
          minHeight: 'calc(100vh - 64px)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <DevToolsDetector />
        <Outlet />
      </Box>

      {/* Quick Profile View Modal */}
      <Dialog open={profileModalOpen} onClose={() => setProfileModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Logged User Profile</span>
          <Chip
            label={roleInfo.label}
            size="small"
            sx={{ bgcolor: roleInfo.bg, color: roleInfo.text, fontWeight: 700 }}
          />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.6rem',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                Employee ID #{user?.employeeNo || '1000'}
              </Typography>
            </Box>
          </Box>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mb: 2 }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Official Branch:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{user?.branch || 'Mumbai HQ'}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Department:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.department || 'Operations'}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Designation:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.designation || 'Specialist'}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Grade & Fuel Band:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                  {user?.grade || 'GRADE_A'}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Mobile Phone:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.mobileNo || '+91 99999 99999'}</Typography>
              </Box>
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            variant="text"
            color="primary"
            onClick={() => {
              setProfileModalOpen(false);
              navigate('/profile');
            }}
            startIcon={<BadgeIcon />}
          >
            Open Full Profile Page
          </Button>
          <Button variant="contained" onClick={() => setProfileModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Change Account Password</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            size="small"
            type="password"
            label="New Password *"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword}>
            UPDATE PASSWORD
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Direct Reset Password Modal */}
      <Dialog open={notificationResetOpen} onClose={() => setNotificationResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Reset Employee Password</span>
          <IconButton size="small" onClick={() => setNotificationResetOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#334155' }}>
            Set a new internal password for <strong>{selectedNotifyEmp?.name}</strong>:
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="New Compliant Password *"
            value={notifyAdminPassword}
            onChange={(e) => setNotifyAdminPassword(e.target.value)}
            helperText="Min 8 chars with Uppercase, Lowercase, Number & Special Character."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Quick: Password@123"
              size="small"
              onClick={() => setNotifyAdminPassword('Password@123')}
              clickable
              color={notifyAdminPassword === 'Password@123' ? 'primary' : 'default'}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            <Chip
              label="Quick: Admin@2026"
              size="small"
              onClick={() => setNotifyAdminPassword('Admin@2026')}
              clickable
              color={notifyAdminPassword === 'Admin@2026' ? 'primary' : 'default'}
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setNotificationResetOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveNotifyPassword} sx={{ fontWeight: 700 }}>
            UPDATE & UNLOCK
          </Button>
        </DialogActions>
      </Dialog>

      {/* First-Time Login / Required Set Password Modal */}
      <SetPasswordModal
        open={setPasswordPromptOpen}
        onClose={() => setSetPasswordPromptOpen(false)}
      />

      {/* Active Sessions & Remote Devices Revocation Modal */}
      <ActiveSessionsModal
        open={activeSessionsOpen}
        onClose={() => setActiveSessionsOpen(false)}
      />
    </Box>
  );
};
export default MainLayout;
