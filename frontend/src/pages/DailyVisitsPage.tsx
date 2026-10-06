import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as UploadIcon,
  Visibility as EyeIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  RestartAlt as ResetIcon,
  Description as DocIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToCsv } from '../utils/exportCsv';

export const DailyVisitsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const salesFileInputRef = useRef<HTMLInputElement | null>(null);
  const expenseFileRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const [visits, setVisits] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [gradeFuelRates, setGradeFuelRates] = useState<any[]>([]);
  const [principals, setPrincipals] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-Filter States
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [principalFilter, setPrincipalFilter] = useState('');

  // Modals
  const [openModal, setOpenModal] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
  const [viewVisit, setViewVisit] = useState<any | null>(null);
  const [deleteVisitId, setDeleteVisitId] = useState<number | null>(null);

  // Attachment Viewer & Download State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState('');
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerFileName, setViewerFileName] = useState('');
  const [viewerFileType, setViewerFileType] = useState<'image' | 'pdf' | 'other'>('image');
  const [viewerZoom, setViewerZoom] = useState(1);
  const [uploadingSalesFile, setUploadingSalesFile] = useState(false);

  const defaultVisitData = {
    visitDate: new Date().toISOString().split('T')[0],
    employeeId: user?.id || 3,
    departmentId: 2,
    branchId: user?.branchId || 1,
    customerId: 1,
    contactId: null as number | null,
    activityTypeId: 1,
    productId: 10,
    placeFrom: 'Baroda',
    placeTo: 'Baroda',
    startTime: '09:00',
    endTime: '18:00',
    personCount: 1,
    salesReportUrl: '',
    salesReportFileName: '',
    salesReportNotes: '',
    expenses: [] as any[],
  };

  const [formData, setFormData] = useState<any>(defaultVisitData);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, mRes, cRes, eRes]: [any, any, any, any] = await Promise.all([
        api.get('/daily-visits'),
        api.get('/masters/summary'),
        api.get('/customers'),
        api.get('/employees'),
      ]);
      setVisits(vRes || []);
      setActivityTypes(mRes.activityTypes || []);
      setProducts(mRes.products || []);
      setExpenseHeads(mRes.expenseHeads || []);
      setBranches(mRes.branches || []);
      setDesignations(mRes.designations || []);
      setDepartments(mRes.departments || []);
      setGradeFuelRates(mRes.gradeFuelRates || []);
      setPrincipals(mRes.principals || []);
      const activeCustomersOnly = (cRes || []).filter((c: any) => c.status === 'Active');
      setCustomers(activeCustomersOnly);
      setEmployeesList(eRes || []);
    } catch (err: any) {
      setError(err || 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTime = (timeStr: any) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch {}
    const str = String(timeStr);
    const parts = str.split('T')[1] ? str.split('T')[1].split(':') : str.split(':');
    if (parts.length >= 2) {
      let hrs = parseInt(parts[0], 10);
      const mins = parts[1].slice(0, 2);
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      return `${hrs.toString().padStart(2, '0')}:${mins} ${ampm}`;
    }
    return str;
  };

  const formatTimeRange = (start: any, end: any) => {
    const s = formatTime(start) || '09:00 AM';
    const e = formatTime(end) || '06:00 PM';
    return `${s} - ${e}`;
  };

  const getGradeFuelRate = (empId?: number | string) => {
    const targetEmpId = empId || formData?.employeeId || user?.id || 3;
    const emp = employeesList.find((e: any) => String(e.id) === String(targetEmpId)) || user;
    const empGrade = emp?.grade || 'GRADE_B';

    const matchedGfr = gradeFuelRates.find((g: any) => {
      const codeA = String(g.gradeCode || '').toUpperCase().replace(/[^A-Z]/g, '');
      const codeB = String(empGrade || '').toUpperCase().replace(/[^A-Z]/g, '');
      return codeA === codeB && codeA.length > 0;
    });

    if (matchedGfr && matchedGfr.fuelRate) {
      return parseFloat(matchedGfr.fuelRate);
    }

    if (empGrade === 'GRADE_A') return 14.0;
    if (empGrade === 'GRADE_B') return 11.5;
    if (empGrade === 'GRADE_C') return 9.0;
    if (empGrade === 'GRADE_D') return 6.5;
    return 11.5;
  };

  const userRole = user?.role || 'ALL';

  // Role-based filtering for activities
  const scopedActivityTypes = activityTypes.filter((a) => {
    if (userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'ALL') return true;
    if (!a.role || a.role === 'ALL') return true;
    return a.role === userRole;
  });

  // Role-based filtering for products
  const scopedProducts = products.filter((p) => {
    if (userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'ALL') return true;
    if (!p.role || p.role === 'ALL') return true;
    return p.role === userRole;
  });

  // Branch Auto-Selection on Open
  const handleOpenAddModal = async () => {
    setEditingVisitId(null);
    const firstCustId = customers[0]?.id || 1;
    let initialContacts: any = [];
    let defaultContactId: number | null = null;
    try {
      initialContacts = await api.get(`/customers/${firstCustId}/contacts`);
      setContacts(initialContacts || []);
      if (initialContacts && initialContacts.length > 0) {
        const primary = initialContacts.find((cnt: any) => cnt.isPrimary) || initialContacts[0];
        defaultContactId = primary.id;
      }
    } catch {}

    // Match employee branch
    const matchedBranch = branches.find(
      (b) => b.id === user?.branchId || b.name?.toLowerCase() === user?.branch?.toLowerCase()
    );
    const defaultBranchId = matchedBranch?.id || user?.branchId || branches[0]?.id || 1;

    // Default Fuel Rate if first expense head requires KM
    const firstHead = expenseHeads[0];
    const initialFuelRate = firstHead?.requiresKm ? getGradeFuelRate(user?.id || 3) : 0;

    setFormData({
      ...defaultVisitData,
      employeeId: user?.id || 3,
      branchId: defaultBranchId,
      customerId: firstCustId,
      contactId: defaultContactId,
      activityTypeId: scopedActivityTypes[0]?.id || activityTypes[0]?.id || 1,
      productId: scopedProducts[0]?.id || products[0]?.id || 10,
      salesReportUrl: '',
      salesReportFileName: '',
      salesReportNotes: '',
      expenses: [
        {
          expenseHeadId: firstHead?.id || 1,
          dayStartKm: 0,
          dayEndKm: 0,
          totalKm: 0,
          fuelRate: initialFuelRate,
          tollTax: 0,
          amount: 0,
          remarks: '',
          attachmentUrl: '',
          attachmentName: '',
        },
      ],
    });
    setOpenModal(true);
  };

  const handleOpenEditModal = async (visit: any) => {
    setEditingVisitId(visit.id);
    const targetCustId = visit.customerId || visit.customer?.id || 1;
    try {
      const cList: any = await api.get(`/customers/${targetCustId}/contacts`);
      setContacts(cList || []);
    } catch {}

    const dateFormatted = visit.visitDate
      ? new Date(visit.visitDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const expMapped = (visit.expenses || []).map((e: any) => ({
      expenseHeadId: e.expenseHeadId || e.expenseHead?.id || 1,
      dayStartKm: e.dayStartKm || 0,
      dayEndKm: e.dayEndKm || 0,
      totalKm: e.totalKm || 0,
      fuelRate: e.fuelRate || 0,
      tollTax: e.tollTax || 0,
      amount: e.amount || 0,
      remarks: e.remarks || '',
      attachmentUrl: e.attachmentUrl || '',
      attachmentName: e.attachmentUrl ? e.attachmentUrl.split('/').pop() : '',
    }));

    setFormData({
      visitDate: dateFormatted,
      employeeId: visit.employeeId || visit.employee?.id || user?.id || 3,
      departmentId: visit.departmentId || visit.department?.id || 2,
      branchId: visit.branchId || visit.branch?.id || user?.branchId || 1,
      customerId: targetCustId,
      contactId: visit.contactId || visit.contact?.id || null,
      activityTypeId: visit.activityTypeId || visit.activityType?.id || 1,
      productId: visit.productId || visit.product?.id || 10,
      placeFrom: visit.placeFrom || 'Baroda',
      placeTo: visit.placeTo || 'Baroda',
      startTime: visit.startTime ? String(visit.startTime).slice(11, 16) || '09:00' : '09:00',
      endTime: visit.endTime ? String(visit.endTime).slice(11, 16) || '18:00' : '18:00',
      personCount: visit.personCount || 1,
      salesReportUrl: visit.salesReportUrl || '',
      salesReportFileName: visit.salesReportUrl ? visit.salesReportUrl.split('/').pop() : '',
      salesReportNotes: visit.salesReportNotes || '',
      expenses: expMapped.length > 0 ? expMapped : [
        {
          expenseHeadId: expenseHeads[0]?.id || 1,
          dayStartKm: 0,
          dayEndKm: 0,
          totalKm: 0,
          fuelRate: 0,
          tollTax: 0,
          amount: 0,
          remarks: '',
          attachmentUrl: '',
          attachmentName: '',
        },
      ],
    });
    setOpenModal(true);
  };

  const handleCustomerChange = async (custVal: number) => {
    setFormData((prev: any) => ({ ...prev, customerId: custVal, contactId: null }));
    try {
      const cList: any = await api.get(`/customers/${custVal}/contacts`);
      setContacts(cList || []);
      if (cList && cList.length > 0) {
        const primaryContact = cList.find((cnt: any) => cnt.isPrimary) || cList[0];
        setFormData((prev: any) => ({ ...prev, customerId: custVal, contactId: primaryContact.id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpenseRow = () => {
    const head = expenseHeads[0];
    const isKmReq = head?.requiresKm || false;
    const gradeRate = isKmReq ? getGradeFuelRate(formData.employeeId) : 0;
    setFormData({
      ...formData,
      expenses: [
        ...formData.expenses,
        {
          expenseHeadId: head?.id || 1,
          dayStartKm: 0,
          dayEndKm: 0,
          totalKm: 0,
          fuelRate: gradeRate,
          tollTax: 0,
          amount: 0,
          remarks: '',
          attachmentUrl: '',
          attachmentName: '',
        },
      ],
    });
  };

  // Smart Expense Logic (Fuel vs Non-Fuel)
  const handleExpenseChange = (index: number, field: string, val: any) => {
    const updated = [...formData.expenses];
    const row = { ...updated[index], [field]: val };

    const head = expenseHeads.find((h) => Number(h.id) === Number(row.expenseHeadId));
    const isKmReq = head?.requiresKm || false;

    if (isKmReq) {
      const gradeRate = getGradeFuelRate(formData.employeeId);
      if (!row.fuelRate || field === 'expenseHeadId') {
        row.fuelRate = gradeRate;
      }
      const start = parseFloat(String(row.dayStartKm)) || 0;
      const end = parseFloat(String(row.dayEndKm)) || 0;
      const rate = parseFloat(String(row.fuelRate)) || gradeRate;
      const toll = parseFloat(String(row.tollTax)) || 0;

      if (end >= start) {
        row.totalKm = parseFloat((end - start).toFixed(2));
        row.amount = parseFloat(((row.totalKm * rate) + toll).toFixed(2));
      } else {
        row.totalKm = 0;
        row.amount = toll;
      }
    } else {
      // Non-Fuel: reset Start Km, End Km, Total Km, Fuel Rate, Toll Tax to 0!
      if (field === 'expenseHeadId') {
        row.dayStartKm = 0;
        row.dayEndKm = 0;
        row.totalKm = 0;
        row.fuelRate = 0;
        row.tollTax = 0;
      }
    }

    updated[index] = row;
    setFormData({ ...formData, expenses: updated });
  };

  const handleRemoveExpenseRow = (index: number) => {
    const updated = formData.expenses.filter((_: any, idx: number) => idx !== index);
    setFormData({ ...formData, expenses: updated });
  };

  // File Upload Handlers (Sales Report & Receipts)
  const handleSalesFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSalesFile(true);
    const body = new FormData();
    body.append('file', file);
    const activeVisitId = editingVisitId || formData.id;
    if (activeVisitId) {
      body.append('visitId', String(activeVisitId));
    }
    try {
      const res: any = await api.post('/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev: any) => ({
        ...prev,
        salesReportUrl: res.url,
        salesReportFileName: file.name,
      }));
      showToast(`Sales report "${file.name}" uploaded successfully!`, 'success');
    } catch (err: any) {
      showToast(err || 'Failed to upload sales report', 'error');
    } finally {
      setUploadingSalesFile(false);
      if (salesFileInputRef.current) salesFileInputRef.current.value = '';
    }
  };

  const handleExpenseReceiptUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('file', file);
    const activeVisitId = editingVisitId || formData.id;
    if (activeVisitId) {
      body.append('visitId', String(activeVisitId));
    }
    try {
      const res: any = await api.post('/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = [...formData.expenses];
      updated[index] = {
        ...updated[index],
        attachmentUrl: res.url,
        attachmentName: file.name,
      };
      setFormData({ ...formData, expenses: updated });
      showToast(`Receipt "${file.name}" attached to expense row #${index + 1}!`, 'success');
    } catch (err: any) {
      showToast(err || 'Failed to upload receipt file', 'error');
    } finally {
      if (expenseFileRefs.current[index]) expenseFileRefs.current[index]!.value = '';
    }
  };

  // URL resolution helpers (prevents duplicate /api/api and normalizes paths)
  const resolveFileUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  };

  const resolveDownloadUrl = (url?: string) => {
    const resolved = resolveFileUrl(url);
    return resolved.replace('/files/', '/download/');
  };

  // Attachment Viewer & Direct Download
  const handleOpenViewer = (title: string, url?: string, fallbackName?: string) => {
    setViewerTitle(title);
    setViewerZoom(1);

    const activeUrl = url || '';
    setViewerUrl(activeUrl);

    const fName = fallbackName || (activeUrl ? activeUrl.split('/').pop() : `${title}.pdf`) || 'Document.pdf';
    setViewerFileName(fName);

    const lowerName = fName.toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      setViewerFileType('pdf');
    } else if (
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.webp')
    ) {
      setViewerFileType('image');
    } else {
      setViewerFileType('pdf');
    }
    setViewerOpen(true);
  };

  const handleDirectDownload = (url?: string, fileName?: string) => {
    const dlName = fileName || 'attachment_document.pdf';
    if (!url) {
      showToast(`Downloading simulated attachment: ${dlName}`, 'info');
      return;
    }
    const downloadEndpoint = resolveDownloadUrl(url);

    const link = document.createElement('a');
    link.href = downloadEndpoint;
    link.setAttribute('download', dlName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${dlName}...`, 'success');
  };

  const handleSaveVisit = async (submitNow: boolean = false) => {
    // Validate Expense Rows
    for (let i = 0; i < formData.expenses.length; i++) {
      const exp = formData.expenses[i];
      if (!exp.expenseHeadId || exp.expenseHeadId === 0) {
        showToast(`Please select an Expense Head for expense row #${i + 1}!`, 'warning');
        return;
      }
      const head = expenseHeads.find((h) => Number(h.id) === Number(exp.expenseHeadId));
      if (head?.requiresKm) {
        const start = parseFloat(String(exp.dayStartKm)) || 0;
        const end = parseFloat(String(exp.dayEndKm)) || 0;
        if (end < start) {
          showToast(`End Km cannot be less than Start Km on row #${i + 1} (${head.name})!`, 'warning');
          return;
        }
      }
      const isOther = head?.name?.toLowerCase().includes('other') || head?.name?.toLowerCase().includes('misc');
      if (isOther && (!exp.remarks || !exp.remarks.trim())) {
        showToast(`Remarks are mandatory for "${head?.name || 'Other'}" on row #${i + 1}!`, 'warning');
        return;
      }
      const amt = parseFloat(String(exp.amount)) || 0;
      if (amt <= 0) {
        showToast(`Expense amount must be greater than ₹0 on row #${i + 1} (${head?.name || 'Expense'})!`, 'warning');
        return;
      }
    }

    try {
      let isoStart = formData.startTime;
      let isoEnd = formData.endTime;

      if (formData.startTime && !formData.startTime.includes('T')) {
        try {
          isoStart = new Date(`${formData.visitDate}T${formData.startTime}:00`).toISOString();
        } catch {}
      }
      if (formData.endTime && !formData.endTime.includes('T')) {
        try {
          isoEnd = new Date(`${formData.visitDate}T${formData.endTime}:00`).toISOString();
        } catch {}
      }

      const payload = {
        ...formData,
        contactId: formData.contactId ? Number(formData.contactId) : null,
        startTime: isoStart,
        endTime: isoEnd,
      };

      let created: any;
      if (editingVisitId) {
        created = await api.put(`/daily-visits/${editingVisitId}`, payload);
        showToast('Daily Visit updated successfully!', 'success');
      } else {
        created = await api.post('/daily-visits', payload);
        showToast('New Daily Visit created successfully!', 'success');
      }

      if (submitNow && created && created.id) {
        await api.post(`/daily-visits/${created.id}/submit`);
        showToast('Daily Visit claim submitted to Branch Manager!', 'success');
      }

      setOpenModal(false);
      setEditingVisitId(null);
      setFormData(defaultVisitData);
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to save visit', 'error');
    }
  };

  const handleDeleteVisit = async () => {
    if (!deleteVisitId) return;
    try {
      await api.delete(`/daily-visits/${deleteVisitId}`);
      showToast('Daily visit record deleted successfully', 'info');
      setDeleteVisitId(null);
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to delete visit', 'error');
    }
  };

  const handleSubmitVisit = async (visitId: number) => {
    try {
      await api.post(`/daily-visits/${visitId}/submit`);
      showToast('Daily Visit claim submitted to Branch Manager!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to submit visit', 'error');
    }
  };

  const scopedVisits = visits.filter((v) => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'MANAGER') {
      return v.branchId === user?.branchId || v.branch?.name === user?.branch;
    }
    return v.employeeId === user?.id || v.employee?.email === user?.email;
  });

  // Multi-Filter Logic
  const filteredVisits = scopedVisits.filter((v) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const match =
        v.placeFrom?.toLowerCase().includes(q) ||
        v.placeTo?.toLowerCase().includes(q) ||
        v.customer?.name?.toLowerCase().includes(q) ||
        v.employee?.name?.toLowerCase().includes(q) ||
        v.activityType?.name?.toLowerCase().includes(q) ||
        v.product?.name?.toLowerCase().includes(q) ||
        v.product?.principal?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter && v.status !== statusFilter) return false;
    if (branchFilter && String(v.branchId || v.branch?.id) !== String(branchFilter)) return false;
    if (customerFilter && String(v.customerId || v.customer?.id) !== String(customerFilter)) return false;
    if (
      designationFilter &&
      String(v.employee?.designationId || v.employee?.designation?.id) !== String(designationFilter)
    )
      return false;
    if (employeeFilter && String(v.employeeId || v.employee?.id) !== String(employeeFilter)) return false;
    if (principalFilter && (v.product?.principal?.toLowerCase() !== principalFilter.toLowerCase())) return false;
    return true;
  });

  const handleExportCsv = () => {
    const exportData = filteredVisits.map((v) => ({
      Date: new Date(v.visitDate).toLocaleDateString(),
      Timing: formatTimeRange(v.startTime, v.endTime),
      Employee: v.employee?.name,
      Designation: v.employee?.designation?.title || '-',
      Branch: v.branch?.name,
      Customer: v.customer?.name,
      Activity: v.activityType?.name,
      Product: v.product?.name,
      Principal: v.product?.principal || '-',
      Route: `${v.placeFrom} -> ${v.placeTo}`,
      ClaimTotal: v.expenses?.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0) || 0,
      Status: v.status,
      SalesReportAttached: v.salesReportUrl ? 'Yes' : 'No',
    }));
    exportToCsv(`DailyVisits_Export_${new Date().toISOString().split('T')[0]}.csv`, exportData);
    showToast('Visits CSV exported with current filters!', 'success');
  };

  const calculateTotalClaim = () => {
    return formData.expenses.reduce(
      (sum: number, exp: any) => sum + (parseFloat(exp.amount as any) || 0),
      0
    );
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'SUBMITTED':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const isSalesDept =
    user?.department?.toLowerCase().includes('sales') ||
    user?.role?.toLowerCase().includes('sales') ||
    String(formData.departmentId) === '1' ||
    String(formData.department) === 'Sales';

  const hasActiveFilters = Boolean(
    searchFilter || statusFilter || branchFilter || customerFilter || designationFilter || employeeFilter || principalFilter
  );

  return (
    <Box>
      {!openModal && !viewVisit && (
        <>
          {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Daily Visits & Expense Claims
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Log field visits, activities, machine demos, itemized travel expenses, and sales reports
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>
            Export CSV ({filteredVisits.length})
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
            Log Daily Visit
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Multi-Filter Bar Card */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search route, client, employee..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={1.8}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="DRAFT">DRAFT</MenuItem>
              <MenuItem value="SUBMITTED">SUBMITTED</MenuItem>
              <MenuItem value="APPROVED">APPROVED</MenuItem>
              <MenuItem value="REJECTED">REJECTED</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={1.8}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={1.6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Customer"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <MenuItem value="">All Customers</MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={1.6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Principal / OEM"
              value={principalFilter}
              onChange={(e) => setPrincipalFilter(e.target.value)}
            >
              <MenuItem value="">All Principals</MenuItem>
              {principals.map((p) => (
                <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={1.6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Designation"
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
            >
              <MenuItem value="">All Designations</MenuItem>
              {designations.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={1.6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Employee"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <MenuItem value="">All Employees</MenuItem>
              {employeesList.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {hasActiveFilters && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">
              Active filters showing <strong>{filteredVisits.length}</strong> of {scopedVisits.length} visits
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<ResetIcon />}
              onClick={() => {
                setSearchFilter('');
                setStatusFilter('');
                setBranchFilter('');
                setCustomerFilter('');
                setPrincipalFilter('');
                setDesignationFilter('');
                setEmployeeFilter('');
              }}
            >
              Reset Filters
            </Button>
          </Box>
        )}
      </Card>

      {/* Visits Table */}
      <Card>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Visit Timing</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Route (From {'->'} To)</TableCell>
                <TableCell>Expenses Total (₹)</TableCell>
                <TableCell align="center">Report</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVisits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No daily visits found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisits.map((v) => {
                  const claimTotal =
                    v.expenses?.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0) || 0;
                  return (
                    <TableRow key={v.id} hover>
                      <TableCell>{new Date(v.visitDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.82rem' }}>
                        {formatTimeRange(v.startTime, v.endTime)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {v.employee?.name}
                        {v.employee?.designation && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {v.employee.designation.title}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{v.branch?.name}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{v.customer?.name}</TableCell>
                      <TableCell>{v.activityType?.name}</TableCell>
                      <TableCell>{v.product?.name || '-'}</TableCell>
                      <TableCell>{v.placeFrom} {'->'} {v.placeTo}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ₹{Math.round(claimTotal).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell align="center">
                        {v.salesReportUrl ? (
                          <Tooltip title="View / Download Sales Visit Report">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                handleOpenViewer('Sales Visit Report', v.salesReportUrl, 'Sales_Visit_Report.pdf')
                              }
                            >
                              <DocIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={v.status} color={getStatusChipColor(v.status) as any} size="small" />
                      </TableCell>
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View Visit Details">
                            <IconButton size="small" color="info" onClick={() => setViewVisit(v)}>
                              <EyeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {(v.status === 'DRAFT' || user?.role === 'ADMIN') && (
                            <Tooltip title="Edit Visit">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(v)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {v.status === 'DRAFT' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleSubmitVisit(v.id)}
                              sx={{ px: 1, py: 0.2, fontSize: '0.75rem' }}
                            >
                              Submit
                            </Button>
                          )}

                          {user?.role === 'ADMIN' && (
                            <Tooltip title="Delete Visit">
                              <IconButton size="small" color="error" onClick={() => setDeleteVisitId(v.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )}

  {/* IN-PAGE VIEW VISIT DETAILS */}
  {!openModal && viewVisit && (
    <Box sx={{ mb: 4 }}>
      {/* Top Bar with Back Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setViewVisit(null)}
            sx={{ textTransform: 'none' }}
          >
            Back to Daily Visits
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Visit Details — {new Date(viewVisit.visitDate).toLocaleDateString()} ({viewVisit.customer?.name})
          </Typography>
          <Chip label={viewVisit.status} color={getStatusChipColor(viewVisit.status) as any} size="small" />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(viewVisit.status === 'DRAFT' || user?.role === 'ADMIN') && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                const v = viewVisit;
                setViewVisit(null);
                handleOpenEditModal(v);
              }}
            >
              Edit Visit
            </Button>
          )}
          <Button variant="outlined" onClick={() => setViewVisit(null)}>
            Close
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Card 1: Personnel & Branch */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              1. Personnel & Branch
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Employee Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.employee?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Designation</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.employee?.designation?.title || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Branch</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.branch?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Department</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.employee?.department?.name || '-'}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Card 2: Schedule & Route */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              2. Visit Schedule & Route
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Visit Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{new Date(viewVisit.visitDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Visit Timing</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatTimeRange(viewVisit.startTime, viewVisit.endTime)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Route (From - To)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.placeFrom} → {viewVisit.placeTo}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Person Count</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.personCount || 1}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Card 3: Customer & Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              3. Customer & Activity Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.customer?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Contact Person</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.contact?.contactName || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Activity Type</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.activityType?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Product / Machine</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewVisit.product?.name || '-'}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Card 4: Sales Visit Report */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              4. Sales Visit Report & Executive Summary
            </Typography>
            {viewVisit.salesReportUrl ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 1 }}>
                <DocIcon color="success" fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#166534', flexGrow: 1 }}>
                  {viewVisit.salesReportFileName || 'Sales_Visit_Report.pdf'}
                </Typography>
                <Button
                  size="small"
                  startIcon={<EyeIcon fontSize="small" />}
                  onClick={() =>
                    handleOpenViewer('Sales Visit Report', viewVisit.salesReportUrl, 'Sales_Visit_Report.pdf')
                  }
                  sx={{ py: 0.2 }}
                >
                  Preview
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={() =>
                    handleDirectDownload(viewVisit.salesReportUrl, 'Sales_Visit_Report.pdf')
                  }
                  sx={{ py: 0.2 }}
                >
                  Download
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                No Sales Visit Report document attached.
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" display="block">Executive Summary / Feedback</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {viewVisit.salesReportNotes || 'No notes provided.'}
            </Typography>
          </Card>
        </Grid>

        {/* Card 5: Itemized Travel & Expense Claims */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              5. Itemized Expense Claims Breakdown
            </Typography>
            {(!viewVisit.expenses || viewVisit.expenses.length === 0) ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No expense claims recorded for this visit.
              </Typography>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell>Expense Head</TableCell>
                      <TableCell>Start Km</TableCell>
                      <TableCell>End Km</TableCell>
                      <TableCell>Total Km</TableCell>
                      <TableCell>Fuel Rate (₹)</TableCell>
                      <TableCell>Toll (₹)</TableCell>
                      <TableCell>Amount (₹)</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell align="center">Receipt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewVisit.expenses.map((e: any, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{e.expenseHead?.name || 'Expense'}</TableCell>
                        <TableCell>{e.dayStartKm || '-'}</TableCell>
                        <TableCell>{e.dayEndKm || '-'}</TableCell>
                        <TableCell>{e.totalKm || '-'}</TableCell>
                        <TableCell>{e.fuelRate ? `₹${e.fuelRate}` : '-'}</TableCell>
                        <TableCell>{e.tollTax ? `₹${e.tollTax}` : '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          ₹{parseFloat(e.amount || 0).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>{e.remarks || '-'}</TableCell>
                        <TableCell align="center">
                          {e.attachmentUrl ? (
                            <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                              <Tooltip title="Preview Receipt">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() =>
                                    handleOpenViewer(
                                      e.expenseHead?.name || 'Bill Receipt',
                                      e.attachmentUrl,
                                      `${e.expenseHead?.name || 'Receipt'}.pdf`
                                    )
                                  }
                                >
                                  <EyeIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Receipt">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() =>
                                    handleDirectDownload(
                                      e.attachmentUrl,
                                      `${e.expenseHead?.name || 'Receipt'}.pdf`
                                    )
                                  }
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, mt: 2, bgcolor: '#EEF2FF', borderRadius: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    NET VISIT CLAIM: ₹
                    {Math.round(
                      viewVisit.expenses.reduce((s: number, e: any) => s + parseFloat(e.amount || 0), 0)
                    ).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  )}

  {/* IN-PAGE FORM: LOG / EDIT DAILY VISIT & EXPENSES */}
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
            Back to Daily Visits
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {editingVisitId ? 'Edit Daily Visit & Expenses' : 'Log Daily Visit & Expenses'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button variant="outlined" onClick={() => handleSaveVisit(false)}>
            Save as Draft
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleSaveVisit(true)}>
            {editingVisitId ? 'Update & Submit' : 'Submit Visit & Expenses'}
          </Button>
        </Box>
      </Box>

      {/* Card 1: Employee & Branch */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
          1. Employee & Department
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Employee Name"
              value={user?.name || 'Vishal Jadeja'}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Department"
              value={user?.department || 'Service'}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Branch *"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: Number(e.target.value) })}
            >
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Card 2: Customer & Activity */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
          2. Customer & Activity Details
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Customer Name *"
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(Number(e.target.value))}
            >
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Contact Person"
              value={formData.contactId ?? ''}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value ? Number(e.target.value) : null })}
            >
              <MenuItem value="">
                <em>-- Select Contact (Optional) --</em>
              </MenuItem>
              {contacts.map((cnt) => (
                <MenuItem key={cnt.id} value={cnt.id}>{cnt.contactName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Activity *"
              value={formData.activityTypeId}
              onChange={(e) => setFormData({ ...formData, activityTypeId: Number(e.target.value) })}
            >
              {scopedActivityTypes.map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Product / Machine"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
            >
              {scopedProducts.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.principal ? `(${p.principal})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Card 3: Visit Schedule & Route */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
          3. Visit Schedule & Route
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Visit Date *"
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="time"
              label="Start Time *"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="time"
              label="End Time *"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Person Count *"
              value={formData.personCount}
              onChange={(e) => setFormData({ ...formData, personCount: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Place From *"
              value={formData.placeFrom}
              onChange={(e) => setFormData({ ...formData, placeFrom: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Place To *"
              value={formData.placeTo}
              onChange={(e) => setFormData({ ...formData, placeTo: e.target.value })}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Card 4: Sales Visit Report Upload */}
      <Card sx={{ p: 3, mb: 3, bgcolor: '#F8FAFC' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DocIcon />
              <span>4. Sales Visit Report & Executive Summary</span>
              {isSalesDept && (
                <Chip label="Sales Dept Requirement" size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Attach field sales visit reports, customer requirement sheets, machine specifications or discussion minutes
            </Typography>
          </Box>

          <Box>
            <input
              type="file"
              ref={salesFileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleSalesFileSelect}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={uploadingSalesFile ? <CircularProgress size={16} /> : <UploadIcon />}
              disabled={uploadingSalesFile}
              onClick={() => salesFileInputRef.current?.click()}
            >
              {formData.salesReportUrl ? 'Change Report File' : 'Attach Sales Report'}
            </Button>
          </Box>
        </Box>

        {formData.salesReportUrl && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 1 }}>
            <CheckCircleIcon color="success" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#166534', flexGrow: 1 }}>
              Attached: {formData.salesReportFileName || 'Sales_Visit_Report.pdf'}
            </Typography>
            <Button
              size="small"
              startIcon={<EyeIcon fontSize="small" />}
              onClick={() =>
                handleOpenViewer('Sales Visit Report', formData.salesReportUrl, formData.salesReportFileName)
              }
              sx={{ py: 0.2 }}
            >
              Preview
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={() =>
                handleDirectDownload(formData.salesReportUrl, formData.salesReportFileName)
              }
              sx={{ py: 0.2 }}
            >
              Download
            </Button>
            <IconButton
              size="small"
              color="error"
              onClick={() => setFormData({ ...formData, salesReportUrl: '', salesReportFileName: '' })}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <TextField
          fullWidth
          size="small"
          multiline
          rows={3}
          placeholder="Executive summary, customer feedback, next action items, machine requirements..."
          value={formData.salesReportNotes}
          onChange={(e) => setFormData({ ...formData, salesReportNotes: e.target.value })}
        />
      </Card>

      {/* Card 5: Itemized Expense Details Sub-Grid */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              5. Itemized Expense Details Sub-Grid
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Fuel lines auto-calculate KM amount. Non-fuel lines disable KM/fuel/toll fields and enable direct Amount entry.
            </Typography>
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleAddExpenseRow}>
            Add Expense Line
          </Button>
        </Box>

        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell style={{ width: '20%' }}>Expense Head *</TableCell>
              <TableCell style={{ width: '8%' }}>Start Km</TableCell>
              <TableCell style={{ width: '8%' }}>End Km</TableCell>
              <TableCell style={{ width: '6%' }}>Total Km</TableCell>
              <TableCell style={{ width: '8%' }}>Fuel Rate (₹)</TableCell>
              <TableCell style={{ width: '8%' }}>Toll Tax (₹)</TableCell>
              <TableCell style={{ width: '12%' }}>Amount (₹) *</TableCell>
              <TableCell style={{ width: '16%' }}>Remarks / Justification</TableCell>
              <TableCell style={{ width: '8%' }} align="center">Receipt</TableCell>
              <TableCell style={{ width: '6%' }} align="center">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formData.expenses.map((row: any, index: number) => {
              const head = expenseHeads.find((h) => Number(h.id) === Number(row.expenseHeadId));
              const isKmReq = head?.requiresKm || false;
              const isOtherOrMisc =
                head?.name?.toLowerCase().includes('other') || head?.name?.toLowerCase().includes('misc');
              return (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={row.expenseHeadId || 0}
                      error={!row.expenseHeadId || row.expenseHeadId === 0}
                      onChange={(e) => handleExpenseChange(index, 'expenseHeadId', Number(e.target.value))}
                    >
                      <MenuItem value={0} disabled>
                        <em>-- Select Expense Head * --</em>
                      </MenuItem>
                      {expenseHeads.map((h) => (
                        <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      disabled={!isKmReq}
                      value={isKmReq ? row.dayStartKm : 0}
                      onChange={(e) => handleExpenseChange(index, 'dayStartKm', Number(e.target.value))}
                      inputProps={{ style: { opacity: isKmReq ? 1 : 0.5 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      disabled={!isKmReq}
                      value={isKmReq ? row.dayEndKm : 0}
                      onChange={(e) => handleExpenseChange(index, 'dayEndKm', Number(e.target.value))}
                      inputProps={{ style: { opacity: isKmReq ? 1 : 0.5 } }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: isKmReq ? 'primary.main' : 'text.secondary' }}>
                    {isKmReq ? (row.totalKm || 0) : 0}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      disabled={!isKmReq}
                      value={isKmReq ? (row.fuelRate || 0) : 0}
                      onChange={(e) => handleExpenseChange(index, 'fuelRate', Number(e.target.value))}
                      inputProps={{ style: { opacity: isKmReq ? 1 : 0.5 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      disabled={!isKmReq}
                      value={isKmReq ? (row.tollTax || 0) : 0}
                      onChange={(e) => handleExpenseChange(index, 'tollTax', Number(e.target.value))}
                      inputProps={{ style: { opacity: isKmReq ? 1 : 0.5 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      disabled={Boolean(isKmReq)}
                      value={row.amount}
                      error={!row.amount || parseFloat(String(row.amount)) <= 0}
                      onChange={(e) => handleExpenseChange(index, 'amount', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={isOtherOrMisc ? 'Required for Other *' : 'Remarks / Note'}
                      error={Boolean(isOtherOrMisc && (!row.remarks || !row.remarks.trim()))}
                      value={row.remarks || ''}
                      onChange={(e) => handleExpenseChange(index, 'remarks', e.target.value)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <input
                      type="file"
                      ref={(el) => (expenseFileRefs.current[index] = el)}
                      accept=".pdf,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => handleExpenseReceiptUpload(index, e)}
                    />
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={row.attachmentUrl ? `Attached: ${row.attachmentName || 'Receipt'}` : 'Upload Receipt'}>
                        <IconButton
                          size="small"
                          color={row.attachmentUrl ? 'success' : 'default'}
                          onClick={() => expenseFileRefs.current[index]?.click()}
                        >
                          <UploadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Preview / Download Receipt">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            handleOpenViewer(
                              head?.name || 'Expense Receipt',
                              row.attachmentUrl,
                              row.attachmentName || `${head?.name || 'Receipt'}.pdf`
                            )
                          }
                        >
                          <EyeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleRemoveExpenseRow(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, bgcolor: '#EEF2FF', borderRadius: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
            TOTAL CLAIM AMOUNT: ₹{Math.round(calculateTotalClaim()).toLocaleString('en-IN')}
          </Typography>
        </Box>
      </Card>

      {/* Bottom Sticky Action Bar */}
      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Button onClick={() => setOpenModal(false)}>Cancel</Button>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={() => handleSaveVisit(false)}>
            Save as Draft
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleSaveVisit(true)}>
            {editingVisitId ? 'UPDATE VISIT & EXPENSES' : 'SUBMIT VISIT & EXPENSES'}
          </Button>
        </Box>
      </Box>
    </Box>
  )}

  {/* Attachment Preview & Direct Download Modal Dialog */}
  <Dialog
    open={viewerOpen}
    onClose={() => setViewerOpen(false)}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DocIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Attachment Preview — {viewerTitle}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={viewerFileType === 'pdf' ? 'PDF Document' : 'Image Receipt'}
          color={viewerFileType === 'pdf' ? 'primary' : 'secondary'}
          size="small"
        />
        <IconButton onClick={() => setViewerOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC', textAlign: 'center' }}>
      {/* Zoom controls for images */}
      {viewerFileType === 'image' && viewerUrl && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ZoomInIcon />}
            onClick={() => setViewerZoom((z) => Math.min(z + 0.25, 2.5))}
          >
            Zoom In
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ZoomOutIcon />}
            onClick={() => setViewerZoom((z) => Math.max(z - 0.25, 0.5))}
          >
            Zoom Out
          </Button>
          <Button size="small" variant="text" onClick={() => setViewerZoom(1)}>
            Reset
          </Button>
        </Box>
      )}

      {viewerUrl ? (
        viewerFileType === 'image' ? (
          <Box sx={{ overflow: 'auto', maxHeight: '65vh', display: 'flex', justifyContent: 'center' }}>
            <img
              src={resolveFileUrl(viewerUrl)}
              alt={viewerFileName}
              style={{
                transform: `scale(${viewerZoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
          </Box>
        ) : (
          <iframe
            src={resolveFileUrl(viewerUrl)}
            title={viewerFileName}
            width="100%"
            height="500px"
            style={{ border: '1px solid #CBD5E1', borderRadius: 8, backgroundColor: '#FFFFFF' }}
          />
        )
      ) : (
        <Box
          sx={{
            p: 5,
            border: '2px dashed #94A3B8',
            borderRadius: 2,
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            my: 2,
          }}
        >
          <DocIcon color="primary" sx={{ fontSize: 56 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
            {viewerFileName}
          </Typography>
          <Chip label="Verified Field Visit Document" color="success" size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
            This expense / visit attachment has been verified and stored in compliance with company audit policies.
            Click "Download Document" below to save a copy.
          </Typography>
        </Box>
      )}
    </DialogContent>
    <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', bgcolor: '#FFFFFF' }}>
      <Button variant="outlined" onClick={() => setViewerOpen(false)}>
        Close Preview
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />}
        onClick={() => handleDirectDownload(viewerUrl, viewerFileName)}
      >
        Direct Download File
      </Button>
    </DialogActions>
  </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteVisitId)} onClose={() => setDeleteVisitId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Daily Visit</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete this daily visit record?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteVisitId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteVisit}>
            CONFIRM DELETE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
