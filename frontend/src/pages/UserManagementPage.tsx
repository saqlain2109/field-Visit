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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  FileDownload as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
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

export const UserManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SERVICE_ENG',
    status: 'Active',
    branchId: 1,
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, mRes]: [any, any] = await Promise.all([
        api.get('/employees'),
        api.get('/masters/summary'),
      ]);
      setUsers(uRes || []);
      setBranches(mRes.branches || []);
    } catch (err: any) {
      setError(err || 'Failed to load user security accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role || 'SERVICE_ENG',
      status: u.status || 'Active',
      branchId: u.branchId || 1,
    });
    setOpenModal(true);
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/employees/${editingUser.id}`, formData);
      setOpenModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err || 'Failed to update user security profile');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeNo.includes(search);
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const handleExportCsv = () => {
    const exportData = users.map((u) => ({
      EmpNo: u.employeeNo,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Branch: u.branch?.name,
      Status: u.status,
    }));
    exportToCsv(`Security_Users_Export_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const permissionsMatrix = [
    { module: 'Executive Operations Dashboard', admin: true, manager: true, sales: true, service: true },
    { module: 'Employees Directory', admin: true, manager: true, sales: false, service: false },
    { module: 'Customers & Prospects Directory', admin: true, manager: true, sales: true, service: true },
    { module: 'Contacts Directory', admin: true, manager: true, sales: true, service: true },
    { module: 'Daily Visit & Expense Logging', admin: true, manager: true, sales: true, service: true },
    { module: 'Branch Manager Approvals Inbox', admin: true, manager: true, sales: false, service: false },
    { module: 'Monthly Expense Matrix Report', admin: true, manager: true, sales: true, service: true },
    { module: 'Master Data Management (MDM)', admin: true, manager: false, sales: false, service: false },
    { module: 'User Security & Access Control', admin: true, manager: false, sales: false, service: false },
  ];

  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            User Security & Access Control (IAM)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system login accounts, security roles, branch scopes, and module access permissions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SecurityIcon />}
            onClick={() => navigate('/login-logs')}
            sx={{ fontWeight: 700 }}
          >
            View Login Logs & Security Audit
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>
            Export Users CSV
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ p: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab label={`User Accounts (${users.length})`} />
            <Tab label="Security Access Matrix (RBAC)" />
          </Tabs>
        </Box>

        {/* Tab 1: User Accounts List */}
        <CustomTabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search user name, email, emp #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 260 }}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              select
              size="small"
              label="Filter Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="ADMIN">System Administrator</MenuItem>
              <MenuItem value="MANAGER">Branch Manager</MenuItem>
              <MenuItem value="SALES_EXEC">Sales Executive</MenuItem>
              <MenuItem value="SERVICE_ENG">Service Engineer</MenuItem>
            </TextField>
          </Box>

          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Emp #</TableCell>
                  <TableCell>User Name</TableCell>
                  <TableCell>Login Email</TableCell>
                  <TableCell>Branch Scope</TableCell>
                  <TableCell>Assigned Role</TableCell>
                  <TableCell>Account Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u.employeeNo}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.branch?.name || 'Mumbai'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role}
                        color={
                          u.role === 'ADMIN'
                            ? 'error'
                            : u.role === 'MANAGER'
                            ? 'secondary'
                            : u.role === 'SALES_EXEC'
                            ? 'info'
                            : 'primary'
                        }
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.status}
                        color={u.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Security Role & Scope">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CustomTabPanel>

        {/* Tab 2: Role Access Matrix */}
        <CustomTabPanel value={tabValue} index={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            System Module Access Control Matrix (Role-Based Access Control)
          </Typography>
          <Table size="small" border={1} style={{ borderColor: '#E2E8F0' }}>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: '40%' }}>System Module / Screen</TableCell>
                <TableCell align="center">ADMIN</TableCell>
                <TableCell align="center">MANAGER</TableCell>
                <TableCell align="center">SALES_EXEC</TableCell>
                <TableCell align="center">SERVICE_ENG</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissionsMatrix.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.module}</TableCell>
                  <TableCell align="center">
                    {row.admin ? <CheckIcon color="success" /> : <CrossIcon color="disabled" />}
                  </TableCell>
                  <TableCell align="center">
                    {row.manager ? <CheckIcon color="success" /> : <CrossIcon color="disabled" />}
                  </TableCell>
                  <TableCell align="center">
                    {row.sales ? <CheckIcon color="success" /> : <CrossIcon color="disabled" />}
                  </TableCell>
                  <TableCell align="center">
                    {row.service ? <CheckIcon color="success" /> : <CrossIcon color="disabled" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CustomTabPanel>
      </Card>

      {/* Edit User Security Profile Modal Dialog */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Edit Security Profile — {editingUser?.name}
          </Typography>
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Assigned Security Role *"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="ADMIN">System Administrator (Full Access)</MenuItem>
                <MenuItem value="MANAGER">Branch Manager (Approvals Access)</MenuItem>
                <MenuItem value="SALES_EXEC">Sales Executive (Visits & Claims)</MenuItem>
                <MenuItem value="SERVICE_ENG">Service Engineer (Visits & Claims)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Branch Scope *"
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
              >
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Account Status *"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveUserRole}>
            UPDATE SECURITY ROLE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
