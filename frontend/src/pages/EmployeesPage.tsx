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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as DownloadIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  LockReset as LockResetIcon,
  LockOpen as LockOpenIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToCsv } from '../utils/exportCsv';

export const EmployeesPage: React.FC = () => {
  const { user, adminResetPassword, adminResetAllPasswords, unlockAccount } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [designationFilter, setDesignationFilter] = useState<string>('');

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Admin Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmp, setResetEmp] = useState<any>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('Password@123');
  const [bulkResetOpen, setBulkResetOpen] = useState(false);
  const [bulkResetting, setBulkResetting] = useState(false);

  const defaultFormData = {
    employeeNo: '',
    name: '',
    gender: 'Male',
    dob: '1992-01-01',
    departmentId: 1,
    designationId: 1,
    branchId: 1,
    joiningDate: new Date().toISOString().split('T')[0],
    mobileNo: '',
    email: '',
    role: 'SERVICE_ENG',
    grade: 'GRADE_B',
    status: 'Active',
    password: '',
  };

  const [formData, setFormData] = useState(defaultFormData);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, mastersRes]: [any, any] = await Promise.all([
        api.get('/employees', {
          params: {
            search: search || undefined,
            branchId: branchFilter || undefined,
            designationId: designationFilter || undefined,
          },
        }),
        api.get('/masters/summary'),
      ]);
      setEmployees(empRes);
      setBranches(mastersRes.branches || []);
      setDepartments(mastersRes.departments || []);
      setDesignations(mastersRes.designations || []);
    } catch (err: any) {
      setError(err || 'Failed to load employee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchFilter, designationFilter]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      ...defaultFormData,
      employeeNo: '',
      departmentId: departments[0]?.id || 1,
      designationId: designations[0]?.id || 1,
      branchId: branches[0]?.id || 1,
    });
    setOpenModal(true);
  };

  const handleOpenEditModal = (emp: any) => {
    setEditingId(emp.id);
    setFormData({
      employeeNo: emp.employeeNo || '',
      name: emp.name || '',
      gender: emp.gender || 'Male',
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '1992-01-01',
      departmentId: emp.department?.id || 1,
      designationId: emp.designation?.id || 1,
      branchId: emp.branch?.id || 1,
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '2026-01-01',
      mobileNo: emp.mobileNo || '',
      email: emp.email || '',
      role: emp.role || 'SERVICE_ENG',
      grade: emp.grade || 'GRADE_B',
      status: emp.status || 'Active',
      password: '',
    });
    setOpenModal(true);
  };

  const handleSaveEmployee = async () => {
    try {
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password;

      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
        showToast('Employee profile updated successfully!', 'success');
      } else {
        await api.post('/employees', payload);
        showToast('New employee created successfully!', 'success');
      }
      setOpenModal(false);
      setFormData(defaultFormData);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to save employee', 'error');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/employees/${deleteId}`);
      showToast('Employee deactivated successfully (status set to Inactive)', 'info');
      setDeleteId(null);
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to delete employee', 'error');
    }
  };

  const handleExportCsv = () => {
    const exportData = employees.map((e) => ({
      EmpNo: e.employeeNo,
      Name: e.name,
      Gender: e.gender,
      Department: e.department?.name,
      Designation: e.designation?.title,
      Branch: e.branch?.name,
      Grade: e.grade,
      Role: e.role,
      Mobile: e.mobileNo,
      Email: e.email,
      Status: e.status,
    }));
    exportToCsv(`Employees_Export_${new Date().toISOString().split('T')[0]}.csv`, exportData);
    showToast('Employees CSV exported successfully!', 'success');
  };

  return (
    <Box>
      {!openModal && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Employees Directory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage field sales executives, service engineers, branch managers, and security roles
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              {isAdmin && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<KeyIcon />}
                  onClick={() => setBulkResetOpen(true)}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Quick Reset All (Password@123)
                </Button>
              )}
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>
                Export CSV
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
                Add Employee
              </Button>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Card sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search name, code, email..."
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
                label="Branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All Branches</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Designation"
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">All Designations</MenuItem>
                {designations.map((d) => (
                  <MenuItem key={d.id} value={d.title}>{d.title}</MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={fetchData}>
                Search
              </Button>
              {(search || branchFilter || designationFilter) && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setSearch('');
                    setBranchFilter('');
                    setDesignationFilter('');
                  }}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Card>

          <Card>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Emp #</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Mobile No</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No employee records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => (
                      <TableRow key={emp.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{emp.employeeNo}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{emp.name}</TableCell>
                        <TableCell>{emp.gender}</TableCell>
                        <TableCell>{emp.department?.name || '-'}</TableCell>
                        <TableCell>{emp.designation?.title || '-'}</TableCell>
                        <TableCell>{emp.branch?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip label={(emp.grade || 'GRADE_B').replace('_', ' ').replace('GRADE', 'Grade')} size="small" color="secondary" variant="filled" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={emp.role} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{emp.mobileNo}</TableCell>
                        <TableCell>
                          <Chip
                            label={emp.status}
                            color={emp.status === 'Active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {emp.isLocked && (
                              <Tooltip title="Unlock Locked Account">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={async () => {
                                    try {
                                      await unlockAccount(emp.id);
                                      showToast(`Account for ${emp.name} unlocked!`, 'success');
                                      fetchData();
                                    } catch (e: any) {
                                      showToast(e?.response?.data?.message || 'Failed to unlock', 'error');
                                    }
                                  }}
                                >
                                  <LockOpenIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {isAdmin && (
                              <Tooltip title="Admin Reset / Update Password">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => {
                                    setResetEmp(emp);
                                    setNewAdminPassword('Enterprise@2026');
                                    setResetModalOpen(true);
                                  }}
                                >
                                  <KeyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="Edit Employee">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(emp)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Employee">
                              <IconButton size="small" color="error" onClick={() => setDeleteId(emp.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* IN-PAGE CREATE / EDIT EMPLOYEE FORM */}
      {openModal && (
        <Box sx={{ mb: 4 }}>
          {/* Top Bar with Back Button and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setOpenModal(false)}
                sx={{ textTransform: 'none' }}
              >
                Back to Employees
              </Button>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {editingId ? 'Edit Employee Profile' : 'Add New Employee'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveEmployee}>
                {editingId ? 'Update Employee' : 'Save Employee'}
              </Button>
            </Box>
          </Box>

          {/* Card 1: Personal & Contact Information */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              1. Personal & Contact Information
            </Typography>
            <Grid container spacing={2.5}>
              {editingId && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    disabled
                    label="Employee No"
                    value={formData.employeeNo}
                    helperText="Auto-generated (Read-only)"
                  />
                </Grid>
              )}
              <Grid item xs={12} md={editingId ? 6 : 12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Gender *"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Date of Birth"
                  InputLabelProps={{ shrink: true }}
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Joining Date *"
                  InputLabelProps={{ shrink: true }}
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mobile No *"
                  value={formData.mobileNo}
                  onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Card 2: Department, Branch & Classification */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              2. Department, Branch & Classification
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department *"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                >
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Designation *"
                  value={formData.designationId}
                  onChange={(e) => setFormData({ ...formData, designationId: Number(e.target.value) })}
                >
                  {designations.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Branch *"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
                >
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Employee Grade *"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                >
                  <MenuItem value="GRADE_A">Grade A</MenuItem>
                  <MenuItem value="GRADE_B">Grade B</MenuItem>
                  <MenuItem value="GRADE_C">Grade C</MenuItem>
                  <MenuItem value="GRADE_D">Grade D</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Card>

          {/* Card 3: Security Role & Credentials */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              3. Security Role & System Credentials
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Security Role *"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="ADMIN">System Administrator (ADMIN)</MenuItem>
                  <MenuItem value="MANAGER">Branch Manager (MANAGER)</MenuItem>
                  <MenuItem value="SALES_EXEC">Sales Executive (SALES_EXEC)</MenuItem>
                  <MenuItem value="SERVICE_ENG">Service Engineer (SERVICE_ENG)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status *"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label={editingId ? 'Password (Leave blank to keep existing password)' : 'Account Password *'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Bottom Sticky Action Bar */}
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleSaveEmployee}>
              {editingId ? 'UPDATE EMPLOYEE' : 'SAVE EMPLOYEE'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Employee Record</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete this employee record?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteEmployee}>
            CONFIRM DELETE
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
            Set a new internal password for <strong>{resetEmp?.name}</strong> (#{resetEmp?.employeeNo}):
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="New Compliant Password *"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            helperText="Min 8 chars with Uppercase, Lowercase, Number & Special Character."
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
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!resetEmp) return;
              try {
                await adminResetPassword(resetEmp.id, newAdminPassword);
                showToast(`Password updated for ${resetEmp.name}`, 'success');
                setResetModalOpen(false);
                fetchData();
              } catch (e: any) {
                const errMsg = typeof e === 'string' ? e : e?.response?.data?.message || e?.message || 'Password policy violation (min 8 chars, uppercase, lowercase, number, special character)';
                showToast(errMsg, 'error');
              }
            }}
            sx={{ fontWeight: 700 }}
          >
            UPDATE PASSWORD
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Reset All Passwords Modal */}
      <Dialog open={bulkResetOpen} onClose={() => setBulkResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#D97706' }}>
          Quick Reset All Passwords
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#334155', mb: 2 }}>
            Are you sure you want to reset all employee passwords to <strong>Password@123</strong> and clear any active account lockouts?
          </Typography>
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            All employees will immediately be able to sign in using their employee ID/email and <strong>Password@123</strong>.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setBulkResetOpen(false)} disabled={bulkResetting}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={bulkResetting}
            onClick={async () => {
              setBulkResetting(true);
              try {
                const res = await adminResetAllPasswords('Password@123');
                showToast(res?.message || 'All passwords reset to Password@123 successfully!', 'success');
                setBulkResetOpen(false);
                fetchData();
              } catch (e: any) {
                const errMsg = typeof e === 'string' ? e : e?.response?.data?.message || e?.message || 'Failed to reset all passwords';
                showToast(errMsg, 'error');
              } finally {
                setBulkResetting(false);
              }
            }}
            sx={{ fontWeight: 700 }}
          >
            {bulkResetting ? 'RESETTING...' : 'RESET ALL TO Password@123'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
