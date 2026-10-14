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
  Divider,
  Paper,
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
    is2faEnabled: true,
    isRegionRestricted: false,
    allowedRegions: 'IN',
    allowedLatitude: '' as number | string,
    allowedLongitude: '' as number | string,
    allowedRadiusKm: 25 as number | string,
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
      is2faEnabled: u.is2faEnabled !== false,
      isRegionRestricted: Boolean(u.isRegionRestricted),
      allowedRegions: u.allowedRegions || 'IN',
      allowedLatitude: u.allowedLatitude != null ? u.allowedLatitude : '',
      allowedLongitude: u.allowedLongitude != null ? u.allowedLongitude : '',
      allowedRadiusKm: u.allowedRadiusKm != null ? u.allowedRadiusKm : 25,
    });
    setOpenModal(true);
  };

  const handleGetCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            allowedLatitude: Number(pos.coords.latitude.toFixed(6)),
            allowedLongitude: Number(pos.coords.longitude.toFixed(6)),
          }));
        },
        (err) => {
          alert('Could not retrieve current GPS position: ' + err.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;
    try {
      const latVal = formData.allowedLatitude !== '' && formData.allowedLatitude !== null ? Number(formData.allowedLatitude) : null;
      const lonVal = formData.allowedLongitude !== '' && formData.allowedLongitude !== null ? Number(formData.allowedLongitude) : null;
      const payload = {
        ...formData,
        allowedLatitude: latVal,
        allowedLongitude: lonVal,
        allowedRadiusKm: formData.allowedRadiusKm !== '' && formData.allowedRadiusKm !== null ? Number(formData.allowedRadiusKm) : 25,
      };
      await api.put(`/employees/${editingUser.id}`, payload);
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
                  <TableCell align="center">2-Step 2FA</TableCell>
                  <TableCell align="center">Geo-Fencing</TableCell>
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
                      <Chip
                        label={u.is2faEnabled !== false ? 'Enabled' : 'Disabled'}
                        color={u.is2faEnabled !== false ? 'success' : 'default'}
                        variant={u.is2faEnabled !== false ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {u.isRegionRestricted ? (
                        <Chip
                          label={
                            u.allowedLatitude != null && u.allowedLongitude != null
                              ? `Zone (${Number(u.allowedLatitude).toFixed(2)}, ${Number(u.allowedLongitude).toFixed(2)} - ${u.allowedRadiusKm || 25}km)`
                              : `Restricted (${u.allowedRegions || 'IN'})`
                          }
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      ) : (
                        <Chip
                          label="Any Region"
                          color="default"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.72rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Security Role & Geo-Fencing">
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

            {/* 2-Step Verification Policy */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is2faEnabled}
                      onChange={(e) => setFormData({ ...formData, is2faEnabled: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Enable 2-Step Verification (MFA)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Requires 6-digit OTP when logging in from an unrecognized device or browser.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>

            {/* Region / Geo-Fencing Policy */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: formData.isRegionRestricted ? '#FFFBEB' : '#F8FAFC', borderRadius: 2, border: formData.isRegionRestricted ? '1px solid #FDE68A' : '1px solid #E2E8F0' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRegionRestricted}
                      onChange={(e) => setFormData({ ...formData, isRegionRestricted: e.target.checked })}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: formData.isRegionRestricted ? '#B45309' : '#1E293B' }}>
                        Restrict Login by Geographical Region (Geo-Fencing)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Enforce login restriction so this user can only access the system from authorized countries.
                      </Typography>
                    </Box>
                  }
                />

                {formData.isRegionRestricted && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Allowed Country ISO Codes / Names *"
                      value={formData.allowedRegions}
                      onChange={(e) => setFormData({ ...formData, allowedRegions: e.target.value })}
                      placeholder="e.g. IN (India) or IN, US"
                      helperText="Comma-separated country codes (e.g. IN for India). User will only be allowed to sign in from these countries."
                    />

                    <Divider sx={{ my: 0.5 }}>
                      <Chip label="OR SPECIFIC GEOGRAPHIC WORK ZONE (GPS COORDINATES)" size="small" sx={{ fontSize: '0.68rem', fontWeight: 600 }} />
                    </Divider>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Latitude"
                          placeholder="e.g. 19.0760"
                          value={formData.allowedLatitude}
                          onChange={(e) => setFormData({ ...formData, allowedLatitude: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Longitude"
                          placeholder="e.g. 72.8777"
                          value={formData.allowedLongitude}
                          onChange={(e) => setFormData({ ...formData, allowedLongitude: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Allowed Radius (km)"
                          placeholder="25"
                          value={formData.allowedRadiusKm}
                          onChange={(e) => setFormData({ ...formData, allowedRadiusKm: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          onClick={handleGetCurrentLocation}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          📍 Detect & Set Current GPS Coordinates
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="inherit"
                          onClick={() => setFormData((prev) => ({ ...prev, allowedLatitude: '', allowedLongitude: '', allowedRadiusKm: 25 }))}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          🗑️ Clear Coordinates (Country Only)
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', width: '100%', mt: 0.5 }}>
                          If coordinates are set, the employee will only be permitted to log in within the specified radius of this location. If blank, only Country restriction will be enforced.
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Live Geo-Fence Visual Map */}
                    {formData.allowedLatitude !== '' &&
                    formData.allowedLongitude !== '' &&
                    !isNaN(Number(formData.allowedLatitude)) &&
                    !isNaN(Number(formData.allowedLongitude)) ? (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: '1px solid #CBD5E1',
                          bgcolor: '#F8FAFC',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                              🗺️ Authorized Work Zone Radius Preview ({formData.allowedRadiusKm || 25} km)
                            </Typography>
                            <Chip
                              label={`${Number(formData.allowedLatitude).toFixed(4)}°, ${Number(formData.allowedLongitude).toFixed(4)}°`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                            />
                          </Box>
                          <Button
                            size="small"
                            variant="text"
                            component="a"
                            href={`https://www.google.com/maps/search/?api=1&query=${formData.allowedLatitude},${formData.allowedLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
                          >
                            Open in Google Maps ↗
                          </Button>
                        </Box>

                        {/* Interactive Leaflet Map with Real Geo-Fence Circle Overlay */}
                        <Box
                          sx={{
                            width: '100%',
                            height: 250,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid #E2E8F0',
                            position: 'relative',
                          }}
                        >
                          <iframe
                            title="Geo-Fence Range Map"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            srcDoc={`
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <meta charset="utf-8" />
                                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                                  <style>
                                    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                                    .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                                  </style>
                                </head>
                                <body>
                                  <div id="map"></div>
                                  <script>
                                    var lat = ${Number(formData.allowedLatitude)};
                                    var lon = ${Number(formData.allowedLongitude)};
                                    var radiusKm = ${Number(formData.allowedRadiusKm) || 25};
                                    var radiusMeters = radiusKm * 1000;

                                    var map = L.map('map', { zoomControl: true }).setView([lat, lon], 10);
                                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                                    }).addTo(map);

                                    // Add Allowed Work Zone Geofence Circle
                                    var circle = L.circle([lat, lon], {
                                      color: '#4F46E5',
                                      fillColor: '#6366F1',
                                      fillOpacity: 0.22,
                                      weight: 2,
                                      radius: radiusMeters
                                    }).addTo(map);

                                    // Add Center Marker
                                    var marker = L.marker([lat, lon]).addTo(map);
                                    marker.bindPopup('<b>Authorized Work Zone</b><br>Radius: ' + radiusKm + ' km<br>Center: ' + lat.toFixed(4) + ', ' + lon.toFixed(4)).openPopup();

                                    // Fit map viewport to circle boundaries
                                    map.fitBounds(circle.getBounds(), { padding: [15, 15] });
                                  </script>
                                </body>
                              </html>
                            `}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1, fontSize: '0.72rem' }}>
                          📍 The shaded circle shows the exact physical boundary ({formData.allowedRadiusKm || 25} km radius) wherein this employee is authorized to sign in. Logins from outside this radius will be rejected.
                        </Typography>
                      </Paper>
                    ) : (
                      <Box sx={{ p: 1.5, bgcolor: '#F1F5F9', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                        <Typography variant="caption" color="text.secondary">
                          ℹ️ No GPS coordinates configured yet. This user is governed by Country ISO restriction ({formData.allowedRegions || 'IN'}). To configure an exact GPS perimeter with visual map view, enter Latitude & Longitude or click <strong>"Detect & Set Current GPS Coordinates"</strong>.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
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
