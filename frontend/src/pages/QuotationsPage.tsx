import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
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
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as EyeIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  RestartAlt as ResetIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  AutoStories as ReviseIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Send as SendIcon,
  MonetizationOn as CurrencyIcon,
  Description as DocIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToCsv } from '../utils/exportCsv';

export const QuotationsPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [principals, setPrincipals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [principalFilter, setPrincipalFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [opportunityFilter, setOpportunityFilter] = useState('');

  // Modals & Drawers
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewQuote, setViewQuote] = useState<any | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<any[]>([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Revision Dialog
  const [reviseDialogOpen, setReviseDialogOpen] = useState(false);
  const [baseQuoteForRev, setBaseQuoteForRev] = useState<any | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const defaultQuoteData = {
    quoteNo: '',
    quoteDate: new Date().toISOString().split('T')[0],
    customerId: 1,
    contactId: 1,
    opportunityId: null as number | null,
    validityDays: 30,
    validityDate: '',
    subtotal: 0,
    discountPercent: 0,
    taxPercent: 18,
    totalValue: 0,
    status: 'DRAFT',
    termsAndConditions:
      '1. Price Basis: Ex-works warehouse, packaging & forwarding extra as applicable.\n' +
      '2. Payment Terms: 30% advance with order, balance 70% against dispatch proforma.\n' +
      '3. Delivery: 4 to 6 weeks from receipt of technically & commercially clear order.\n' +
      '4. Warranty: 12 months from commissioning date.\n' +
      '5. Taxes: GST @ 18% extra as applicable.',
    notes: '',
    salespersonId: user?.id || 1,
    items: [] as any[],
  };

  const [formData, setFormData] = useState<any>(defaultQuoteData);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, cRes, oRes, mRes, eRes]: [any, any, any, any, any] = await Promise.all([
        api.get('/crm/quotations'),
        api.get('/customers'),
        api.get('/crm/opportunities'),
        api.get('/masters/summary'),
        api.get('/employees'),
      ]);
      setQuotations(qRes || []);
      const activeCust = (cRes || []).filter((c: any) => c.status === 'Active');
      setCustomers(activeCust);
      setOpportunities(oRes || []);
      setProducts(mRes.products || []);
      setPrincipals(mRes.principals || []);
      setEmployees(eRes || []);
    } catch (err: any) {
      setError(err || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle route state if redirected from Opportunity with prefilled data
  useEffect(() => {
    if (location.state && (location.state as any).createFromOpp && customers.length > 0) {
      const opp = (location.state as any).createFromOpp;
      handleCreateFromOpportunity(opp);
    }
  }, [location.state, customers]);

  const loadContactsForCustomer = async (custId: number) => {
    try {
      const res: any = await api.get(`/customers/${custId}/contacts`);
      setContacts(res || []);
      if (res && res.length > 0) {
        const primary = res.find((c: any) => c.isPrimary) || res[0];
        setFormData((prev: any) => ({ ...prev, customerId: custId, contactId: primary.id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateQuoteTotals = (items: any[], discPct: number = 0, taxPct: number = 18) => {
    const subtotal = items.reduce((s, it) => s + (parseFloat(it.totalPrice) || 0), 0);
    const discAmt = (subtotal * discPct) / 100;
    const afterDisc = subtotal - discAmt;
    const taxAmt = (afterDisc * taxPct) / 100;
    const totalValue = afterDisc + taxAmt;
    return { subtotal, totalValue };
  };

  const handleOpenAddModal = async () => {
    setEditingId(null);
    const firstCustId = customers[0]?.id || 1;
    await loadContactsForCustomer(firstCustId);

    const firstProd = products[0];
    const initialItems = firstProd
      ? [
          {
            productId: firstProd.id,
            productName: firstProd.name,
            productCode: firstProd.code,
            principal: firstProd.principal || 'General',
            quantity: 1,
            unitPrice: firstProd.unitPrice ? parseFloat(firstProd.unitPrice) : 250000,
            discountPercent: 0,
            totalPrice: firstProd.unitPrice ? parseFloat(firstProd.unitPrice) : 250000,
          },
        ]
      : [];

    const { subtotal, totalValue } = calculateQuoteTotals(initialItems, 0, 18);

    setFormData({
      ...defaultQuoteData,
      customerId: firstCustId,
      salespersonId: user?.id || employees[0]?.id || 1,
      items: initialItems,
      subtotal,
      totalValue,
    });
    setOpenModal(true);
  };

  const handleCreateFromOpportunity = async (opp: any) => {
    setEditingId(null);
    await loadContactsForCustomer(opp.customerId);

    const mappedItems = (opp.products || []).map((p: any) => ({
      productId: p.productId,
      productName: p.productName,
      productCode: p.productCode,
      principal: p.principal || opp.principal,
      quantity: p.quantity || 1,
      unitPrice: p.unitPrice ? parseFloat(p.unitPrice) : 0,
      discountPercent: 0,
      totalPrice: p.totalPrice ? parseFloat(p.totalPrice) : 0,
    }));

    const { subtotal, totalValue } = calculateQuoteTotals(mappedItems, 0, 18);

    setFormData({
      ...defaultQuoteData,
      customerId: opp.customerId,
      contactId: opp.contactId || 1,
      opportunityId: opp.id,
      salespersonId: opp.salespersonId || user?.id || 1,
      notes: `Generated from Opportunity ${opp.opportunityNo}: ${opp.name}`,
      items: mappedItems,
      subtotal,
      totalValue,
    });
    setOpenModal(true);
    showToast(`Quotation initialized from Opportunity ${opp.opportunityNo}`, 'info');
  };

  const handleOpenEditModal = async (q: any) => {
    setEditingId(q.id);
    await loadContactsForCustomer(q.customerId);

    const itemsMapped = (q.items || []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productCode: i.productCode,
      principal: i.principal,
      quantity: i.quantity,
      unitPrice: i.unitPrice ? parseFloat(i.unitPrice) : 0,
      discountPercent: i.discountPercent ? parseFloat(i.discountPercent) : 0,
      totalPrice: i.totalPrice ? parseFloat(i.totalPrice) : 0,
    }));

    setFormData({
      quoteNo: q.quoteNo,
      quoteDate: q.quoteDate ? new Date(q.quoteDate).toISOString().split('T')[0] : '',
      customerId: q.customerId,
      contactId: q.contactId,
      opportunityId: q.opportunityId,
      validityDays: q.validityDays || 30,
      validityDate: q.validityDate ? new Date(q.validityDate).toISOString().split('T')[0] : '',
      subtotal: q.subtotal ? parseFloat(q.subtotal) : 0,
      discountPercent: q.discountPercent ? parseFloat(q.discountPercent) : 0,
      taxPercent: q.taxPercent ? parseFloat(q.taxPercent) : 18,
      totalValue: q.totalValue ? parseFloat(q.totalValue) : 0,
      status: q.status || 'DRAFT',
      termsAndConditions: q.termsAndConditions || defaultQuoteData.termsAndConditions,
      notes: q.notes || '',
      salespersonId: q.salespersonId || user?.id || 1,
      items: itemsMapped,
    });
    setOpenModal(true);
  };

  // Line item manipulation
  const handleItemRowChange = (index: number, field: string, val: any) => {
    const updated = [...formData.items];
    const row = { ...updated[index], [field]: val };

    if (field === 'productId') {
      const selectedProd = products.find((p) => p.id === val);
      if (selectedProd) {
        row.productName = selectedProd.name;
        row.productCode = selectedProd.code;
        row.principal = selectedProd.principal || 'General';
        row.unitPrice = selectedProd.unitPrice ? parseFloat(selectedProd.unitPrice) : row.unitPrice || 100000;
      }
    }

    const qty = parseInt(String(row.quantity), 10) || 1;
    const rate = parseFloat(String(row.unitPrice)) || 0;
    const disc = parseFloat(String(row.discountPercent)) || 0;

    const gross = qty * rate;
    const lineDisc = (gross * disc) / 100;
    row.totalPrice = gross - lineDisc;

    updated[index] = row;

    const { subtotal, totalValue } = calculateQuoteTotals(
      updated,
      formData.discountPercent || 0,
      formData.taxPercent || 18
    );

    setFormData({
      ...formData,
      items: updated,
      subtotal,
      totalValue,
    });
  };

  const handleAddItemRow = () => {
    const firstProd = products[0];
    const newRow = {
      productId: firstProd?.id || null,
      productName: firstProd?.name || 'Machine Model',
      productCode: firstProd?.code || 'CODE-01',
      principal: firstProd?.principal || 'General',
      quantity: 1,
      unitPrice: firstProd?.unitPrice ? parseFloat(firstProd.unitPrice) : 100000,
      discountPercent: 0,
      totalPrice: firstProd?.unitPrice ? parseFloat(firstProd.unitPrice) : 100000,
    };

    const updated = [...formData.items, newRow];
    const { subtotal, totalValue } = calculateQuoteTotals(
      updated,
      formData.discountPercent || 0,
      formData.taxPercent || 18
    );

    setFormData({
      ...formData,
      items: updated,
      subtotal,
      totalValue,
    });
  };

  const handleRemoveItemRow = (index: number) => {
    const updated = formData.items.filter((_: any, idx: number) => idx !== index);
    const { subtotal, totalValue } = calculateQuoteTotals(
      updated,
      formData.discountPercent || 0,
      formData.taxPercent || 18
    );

    setFormData({
      ...formData,
      items: updated,
      subtotal,
      totalValue,
    });
  };

  const handleSaveQuotation = async () => {
    if (!formData.customerId) {
      showToast('Please select a customer for this quotation!', 'warning');
      return;
    }
    if (formData.items.length === 0) {
      showToast('Please add at least one line item to the quotation!', 'warning');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/crm/quotations/${editingId}`, formData);
        showToast('Quotation updated successfully!', 'success');
      } else {
        await api.post('/crm/quotations', formData);
        showToast('New Quotation created successfully!', 'success');
      }
      setOpenModal(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to save quotation', 'error');
    }
  };

  // Revision Workflow
  const handleOpenReviseModal = (quote: any) => {
    setBaseQuoteForRev(quote);
    setRevisionNotes(`Revision created based on client commercial discussion on ${new Date().toLocaleDateString()}`);
    setReviseDialogOpen(true);
  };

  const handleExecuteRevision = async () => {
    if (!baseQuoteForRev) return;
    try {
      const payload = {
        quoteDate: new Date().toISOString().split('T')[0],
        customerId: baseQuoteForRev.customerId,
        contactId: baseQuoteForRev.contactId,
        opportunityId: baseQuoteForRev.opportunityId,
        validityDays: baseQuoteForRev.validityDays || 30,
        termsAndConditions: baseQuoteForRev.termsAndConditions,
        notes: revisionNotes,
        salespersonId: baseQuoteForRev.salespersonId,
        discountPercent: baseQuoteForRev.discountPercent,
        taxPercent: baseQuoteForRev.taxPercent,
        items: baseQuoteForRev.items?.map((it: any) => ({
          productId: it.productId,
          productName: it.productName,
          productCode: it.productCode,
          principal: it.principal,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          totalPrice: it.totalPrice,
        })),
      };

      const res: any = await api.post(`/crm/quotations/${baseQuoteForRev.id}/revise`, payload);
      showToast(`Created ${res.versionLabel} for quote ${baseQuoteForRev.quoteNo}!`, 'success');
      setReviseDialogOpen(false);
      setBaseQuoteForRev(null);
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to create revision', 'error');
    }
  };

  // View Revision History
  const handleViewHistory = async (quoteNo: string) => {
    try {
      const res: any = await api.get(`/crm/quotations/history/${quoteNo}`);
      setRevisionHistory(res || []);
      setHistoryDrawerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (quoteId: number, newStatus: string) => {
    try {
      await api.patch(`/crm/quotations/${quoteId}/status`, { status: newStatus });
      showToast(`Quotation status updated to "${newStatus}"`, 'success');
      fetchData();
      if (viewQuote && viewQuote.id === quoteId) {
        setViewQuote((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      showToast(err || 'Failed to update quotation status', 'error');
    }
  };

  // Filter logic
  const filteredQuotes = quotations.filter((q) => {
    if (searchFilter) {
      const s = searchFilter.toLowerCase();
      const match =
        q.quoteNo?.toLowerCase().includes(s) ||
        q.customer?.name?.toLowerCase().includes(s) ||
        q.opportunity?.opportunityNo?.toLowerCase().includes(s) ||
        q.opportunity?.name?.toLowerCase().includes(s) ||
        q.opportunity?.principal?.toLowerCase().includes(s) ||
        q.items?.some((it: any) => it.principal?.toLowerCase().includes(s)) ||
        q.versionLabel?.toLowerCase().includes(s);
      if (!match) return false;
    }
    if (statusFilter && q.status !== statusFilter) return false;
    if (principalFilter) {
      const matchItem = q.items?.some((it: any) => it.principal?.toLowerCase() === principalFilter.toLowerCase());
      const matchOpp = q.opportunity?.principal?.toLowerCase() === principalFilter.toLowerCase();
      if (!matchItem && !matchOpp) return false;
    }
    if (customerFilter && String(q.customerId) !== String(customerFilter)) return false;
    if (opportunityFilter && String(q.opportunityId) !== String(opportunityFilter)) return false;
    return true;
  });

  // Status KPI calculations (based on active filters excluding statusFilter for accurate group totals)
  const baseQuotesForKpi = quotations.filter((q) => {
    if (searchFilter) {
      const qLower = searchFilter.toLowerCase();
      const matchQuote = q.quoteNo?.toLowerCase().includes(qLower);
      const matchCust = q.customer?.name?.toLowerCase().includes(qLower);
      const matchOpp = q.opportunity?.opportunityNo?.toLowerCase().includes(qLower);
      if (!matchQuote && !matchCust && !matchOpp) return false;
    }
    if (principalFilter) {
      const matchItem = q.items?.some((it: any) => it.principal?.toLowerCase() === principalFilter.toLowerCase());
      const matchOpp = q.opportunity?.principal?.toLowerCase() === principalFilter.toLowerCase();
      if (!matchItem && !matchOpp) return false;
    }
    if (customerFilter && String(q.customerId) !== String(customerFilter)) return false;
    if (opportunityFilter && String(q.opportunityId) !== String(opportunityFilter)) return false;
    return true;
  });

  const totalQuotesCount = baseQuotesForKpi.length;
  const totalQuoteVal = baseQuotesForKpi.reduce((s, q) => s + (parseFloat(q.totalValue) || 0), 0);

  const draftList = baseQuotesForKpi.filter((q) => q.status === 'DRAFT');
  const draftVal = draftList.reduce((s, q) => s + (parseFloat(q.totalValue) || 0), 0);

  const sentList = baseQuotesForKpi.filter((q) => q.status === 'SENT');
  const sentVal = sentList.reduce((s, q) => s + (parseFloat(q.totalValue) || 0), 0);

  const acceptedList = baseQuotesForKpi.filter((q) => q.status === 'ACCEPTED');
  const acceptedVal = acceptedList.reduce((s, q) => s + (parseFloat(q.totalValue) || 0), 0);

  const rejectedList = baseQuotesForKpi.filter((q) => q.status === 'REJECTED' || q.status === 'EXPIRED');
  const rejectedVal = rejectedList.reduce((s, q) => s + (parseFloat(q.totalValue) || 0), 0);

  const handleExportCsv = () => {
    const data = filteredQuotes.map((q) => ({
      QuoteNo: q.quoteNo,
      Version: q.versionLabel,
      Date: q.quoteDate,
      Customer: q.customer?.name,
      OpportunityNo: q.opportunity?.opportunityNo || 'Direct',
      Subtotal: q.subtotal,
      DiscountPercent: q.discountPercent,
      TaxPercent: q.taxPercent,
      TotalValue: q.totalValue,
      Status: q.status,
      Salesperson: q.salesperson?.name,
    }));
    exportToCsv(`Quotations_${new Date().toISOString().split('T')[0]}.csv`, data);
    showToast('Quotations exported to CSV!', 'success');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'SENT': return 'primary';
      case 'REJECTED': return 'error';
      case 'REVISED': return 'default';
      default: return 'warning';
    }
  };

  return (
    <Box>
      {!openModal && !viewQuote && (
        <>
          {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Quotation Management & Revisions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate formal machine quotes, versioned revisions (Rev 0, 1, 2), commercial terms, and order confirmations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>
            Export CSV ({filteredQuotes.length})
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
            New Quotation
          </Button>
        </Box>
      </Box>

      {/* Status KPI Cards (Single-Line Side-by-Side Matching Opportunities) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Quotes */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            onClick={() => setStatusFilter('')}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: statusFilter === '' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              bgcolor: statusFilter === '' ? '#F0F7FF' : '#FFFFFF',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex', flexShrink: 0 }}>
              <DocIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontWeight: 600 }}>
                Total Quotations
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
                  {totalQuotesCount}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB' }} noWrap>
                  ₹{Math.round(totalQuoteVal).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Draft */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            onClick={() => setStatusFilter(statusFilter === 'DRAFT' ? '' : 'DRAFT')}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: statusFilter === 'DRAFT' ? '2px solid #D97706' : '1px solid #E2E8F0',
              bgcolor: statusFilter === 'DRAFT' ? '#FFFBEB' : '#FFFFFF',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <Box sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: 2, color: '#D97706', display: 'flex', flexShrink: 0 }}>
              <EditIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontWeight: 600 }}>
                Draft / Working
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>
                  {draftList.length}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#B45309' }} noWrap>
                  ₹{Math.round(draftVal).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Sent */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            onClick={() => setStatusFilter(statusFilter === 'SENT' ? '' : 'SENT')}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: statusFilter === 'SENT' ? '2px solid #4F46E5' : '1px solid #E2E8F0',
              bgcolor: statusFilter === 'SENT' ? '#EEF2FF' : '#FFFFFF',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <Box sx={{ p: 1.5, bgcolor: '#E0E7FF', borderRadius: 2, color: '#4F46E5', display: 'flex', flexShrink: 0 }}>
              <SendIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontWeight: 600 }}>
                Sent to Client
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#4F46E5' }}>
                  {sentList.length}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#4338CA' }} noWrap>
                  ₹{Math.round(sentVal).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Accepted */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            onClick={() => setStatusFilter(statusFilter === 'ACCEPTED' ? '' : 'ACCEPTED')}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: statusFilter === 'ACCEPTED' ? '2px solid #059669' : '1px solid #E2E8F0',
              bgcolor: statusFilter === 'ACCEPTED' ? '#ECFDF5' : '#FFFFFF',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <Box sx={{ p: 1.5, bgcolor: '#D1FAE5', borderRadius: 2, color: '#059669', display: 'flex', flexShrink: 0 }}>
              <AcceptIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontWeight: 600 }}>
                Accepted (Won)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>
                  {acceptedList.length}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#047857' }} noWrap>
                  ₹{Math.round(acceptedVal).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Rejected */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card
            onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? '' : 'REJECTED')}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: statusFilter === 'REJECTED' ? '2px solid #E11D48' : '1px solid #E2E8F0',
              bgcolor: statusFilter === 'REJECTED' ? '#FFF1F2' : '#FFFFFF',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
            }}
          >
            <Box sx={{ p: 1.5, bgcolor: '#FFE4E6', borderRadius: 2, color: '#E11D48', display: 'flex', flexShrink: 0 }}>
              <RejectIcon sx={{ fontSize: 30 }} />
            </Box>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontWeight: 600 }}>
                Rejected / Expired
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#E11D48' }}>
                  {rejectedList.length}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#BE123C' }} noWrap>
                  ₹{Math.round(rejectedVal).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={6} md={2.6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search quote #, customer, opp..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
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
              <MenuItem value="SENT">SENT TO CLIENT</MenuItem>
              <MenuItem value="ACCEPTED">ACCEPTED (WON)</MenuItem>
              <MenuItem value="REJECTED">REJECTED</MenuItem>
              <MenuItem value="REVISED">REVISED (ARCHIVED)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2.2}>
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
          <Grid item xs={6} sm={3} md={2.6}>
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
          <Grid item xs={12} sm={6} md={2.6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Linked Opportunity"
              value={opportunityFilter}
              onChange={(e) => setOpportunityFilter(e.target.value)}
            >
              <MenuItem value="">All Opportunities</MenuItem>
              {opportunities.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.opportunityNo} — {o.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {(searchFilter || statusFilter || principalFilter || customerFilter || opportunityFilter) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">
              Filtered quotations showing: <strong>{filteredQuotes.length}</strong> of {quotations.length}
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<ResetIcon />}
              onClick={() => {
                setSearchFilter('');
                setStatusFilter('');
                setPrincipalFilter('');
                setCustomerFilter('');
                setOpportunityFilter('');
              }}
            >
              Reset Filters
            </Button>
          </Box>
        )}
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell>Quote #</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer Client</TableCell>
                <TableCell>Linked Opportunity</TableCell>
                <TableCell align="right">Subtotal (₹)</TableCell>
                <TableCell align="right">Total Value (₹)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned Rep</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No quotations found. Click "New Quotation" to generate a price quote.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((q) => (
                  <TableRow key={q.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {q.quoteNo}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={q.versionLabel}
                        size="small"
                        color={q.revisionNo > 0 ? 'secondary' : 'default'}
                        variant={q.revisionNo > 0 ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell>{q.quoteDate ? new Date(q.quoteDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{q.customer?.name}</TableCell>
                    <TableCell>
                      {q.opportunity ? (
                        <Tooltip title={q.opportunity.name}>
                          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                            {q.opportunity.opportunityNo}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Direct Client</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">₹{Math.round(parseFloat(q.subtotal || 0)).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ₹{Math.round(parseFloat(q.totalValue || 0)).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={q.status}
                        color={getStatusColor(q.status) as any}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell>{q.salesperson?.name || '-'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}>
                        <Tooltip title="View & Print Quote">
                          <IconButton size="small" color="info" onClick={() => setViewQuote(q)}>
                            <EyeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Revision History">
                          <IconButton size="small" color="secondary" onClick={() => handleViewHistory(q.quoteNo)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Create Revision (Rev N+1)">
                          <IconButton size="small" color="primary" onClick={() => handleOpenReviseModal(q)}>
                            <ReviseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {q.status === 'DRAFT' && (
                          <Tooltip title="Edit Draft">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(q)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
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

      {/* IN-PAGE FORMAL PRINTABLE QUOTATION VIEWER */}
      {!openModal && viewQuote && (
        <Box sx={{ mb: 4 }}>
          {/* Top In-Page Action Header */}
          <Box
            className="no-print"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              pb: 2,
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setViewQuote(null)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Back to Quotations
              </Button>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Quotation {viewQuote?.quoteNo}
                  </Typography>
                  <Chip
                    label={viewQuote?.versionLabel || `Rev ${viewQuote?.revisionNo}`}
                    size="small"
                    color={viewQuote?.revisionNo > 0 ? 'secondary' : 'primary'}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip label={viewQuote?.status} color={getStatusColor(viewQuote?.status) as any} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Customer: {viewQuote?.customer?.name} | Date: {viewQuote?.quoteDate ? new Date(viewQuote.quoteDate).toLocaleDateString() : '-'} | Valid for {viewQuote?.validityDays || 30} days
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
              >
                Print Document
              </Button>
              <Button variant="outlined" onClick={() => setViewQuote(null)}>
                Close Viewer
              </Button>
            </Box>
          </Box>
          <Box className="printable-quotation-sheet" sx={{ p: 2, bgcolor: '#FFFFFF' }}>
          {viewQuote && (
            <Box>
              {/* Formal Company Letterhead for Print */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563EB', pb: 2, mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: 0.5 }}>
                    FIELD VISIT CRM & INDUSTRIAL SYSTEMS
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Industrial Machinery, Sheet Metal Automation & CNC Solutions
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    HQ: Mumbai Industrial Corridor | Phone: +91 99999 99999 | Email: sales@crm.com
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                    COMMERCIAL QUOTATION
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Quote No: {viewQuote.quoteNo}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Revision: {viewQuote.versionLabel || `Rev ${viewQuote.revisionNo}`} | Date: {viewQuote.quoteDate ? new Date(viewQuote.quoteDate).toLocaleDateString() : '-'}
                  </Typography>
                </Box>
              </Box>

              {/* Header Details */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    QUOTATION TO:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {viewQuote.customer?.name}
                  </Typography>
                  <Typography variant="body2">{viewQuote.customer?.address || 'Client Address'}</Typography>
                  <Typography variant="body2">{viewQuote.customer?.city}, {viewQuote.customer?.state}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                    Attn: {viewQuote.contact?.contactName || 'Primary Point of Contact'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {viewQuote.contact?.email || ''} | {viewQuote.contact?.mobileNo || ''}
                  </Typography>
                </Grid>

                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    QUOTE METADATA:
                  </Typography>
                  <Typography variant="body2"><strong>Quote Ref:</strong> {viewQuote.quoteNo}</Typography>
                  <Typography variant="body2"><strong>Revision:</strong> {viewQuote.versionLabel}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date(viewQuote.quoteDate).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Valid Until:</strong> {viewQuote.validityDate ? new Date(viewQuote.validityDate).toLocaleDateString() : '-'}</Typography>
                  {viewQuote.opportunity && (
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      <strong>Opportunity:</strong> {viewQuote.opportunity.opportunityNo}
                    </Typography>
                  )}
                  <Typography variant="body2"><strong>Sales Rep:</strong> {viewQuote.salesperson?.name || user?.name}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Items Table */}
              {/* Competitor Benchmark Comparison */}
              {viewQuote.opportunity?.competitorName && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      ⚡ Competitor Intelligence Benchmark: {viewQuote.opportunity.competitorName} {viewQuote.opportunity.competitorModel ? `(${viewQuote.opportunity.competitorModel})` : ''}
                    </Typography>
                    {viewQuote.opportunity.threatLevel && (
                      <Chip
                        label={`Threat: ${viewQuote.opportunity.threatLevel}`}
                        size="small"
                        color={viewQuote.opportunity.threatLevel === 'HIGH' || viewQuote.opportunity.threatLevel === 'DOMINANT' ? 'error' : viewQuote.opportunity.threatLevel === 'MEDIUM' ? 'warning' : 'success'}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Competitor Quoted / Benchmark:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#DC2626' }}>
                        {viewQuote.opportunity.competitorPrice ? `₹${parseFloat(viewQuote.opportunity.competitorPrice).toLocaleString('en-IN')}` : 'Not Specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Our Net Quotation Total:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        ₹{Math.round(parseFloat(viewQuote.totalValue || 0)).toLocaleString('en-IN')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Price Variance / Value Edge:</Typography>
                      {viewQuote.opportunity.competitorPrice ? (
                        (() => {
                          const comp = parseFloat(viewQuote.opportunity.competitorPrice);
                          const our = parseFloat(viewQuote.totalValue || 0);
                          const diff = our - comp;
                          const pct = Math.round((Math.abs(diff) / comp) * 100);
                          const isLower = diff < 0;
                          return (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: isLower ? '#059669' : '#D97706' }}>
                              {isLower ? `₹${Math.round(Math.abs(diff)).toLocaleString('en-IN')} (${pct}%) Lower than Competitor` : `₹${Math.round(diff).toLocaleString('en-IN')} (${pct}%) Higher than Competitor`}
                            </Typography>
                          );
                        })()
                      ) : (
                        <Typography variant="body2" color="text.secondary">No competitor price recorded</Typography>
                      )}
                    </Grid>
                  </Grid>
                  {viewQuote.opportunity.competitorStrengths && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                      <strong>Competitor Pitch / Strengths:</strong> {viewQuote.opportunity.competitorStrengths}
                    </Typography>
                  )}
                </Paper>
              )}

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                ITEMIZED PRODUCT SPECIFICATIONS & PRICING
              </Typography>
              <Table size="small" border={1} style={{ borderColor: '#E2E8F0', marginBottom: 20 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell style={{ width: '5%' }}>#</TableCell>
                    <TableCell style={{ width: '40%' }}>Description / Model</TableCell>
                    <TableCell style={{ width: '15%' }}>Code</TableCell>
                    <TableCell style={{ width: '10%' }} align="right">Qty</TableCell>
                    <TableCell style={{ width: '15%' }} align="right">Unit Price (₹)</TableCell>
                    <TableCell style={{ width: '15%' }} align="right">Line Total (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewQuote.items?.map((it: any, idx: number) => (
                    <TableRow key={it.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{it.productName}</TableCell>
                      <TableCell>{it.productCode || '-'}</TableCell>
                      <TableCell align="right">{it.quantity}</TableCell>
                      <TableCell align="right">₹{parseFloat(it.unitPrice || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{parseFloat(it.totalPrice || 0).toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Commercial Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Box sx={{ width: 320 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Gross Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{Math.round(parseFloat(viewQuote.subtotal || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  {parseFloat(viewQuote.discountPercent || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: '#059669' }}>
                      <Typography variant="body2">Commercial Discount ({viewQuote.discountPercent}%):</Typography>
                      <Typography variant="body2">
                        - ₹{Math.round(((parseFloat(viewQuote.subtotal || 0) * parseFloat(viewQuote.discountPercent)) / 100)).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">GST Tax ({viewQuote.taxPercent || 18}%):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{Math.round(((parseFloat(viewQuote.subtotal || 0) * (1 - (parseFloat(viewQuote.discountPercent || 0) / 100)) * (parseFloat(viewQuote.taxPercent || 18))) / 100)).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: '#EEF2FF', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      NET TOTAL AMOUNT:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ₹{Math.round(parseFloat(viewQuote.totalValue || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Commercial Terms & Conditions */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                COMMERCIAL TERMS & CONDITIONS:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#F8FAFC', whiteSpace: 'pre-line', fontSize: '0.82rem', color: '#334155', mb: 3 }}>
                {viewQuote.termsAndConditions || 'Standard terms apply.'}
              </Paper>

              {/* Workflow Actions */}
              <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {viewQuote.status === 'DRAFT' && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={() => handleUpdateStatus(viewQuote.id, 'SENT')}
                    >
                      Mark as Sent to Client
                    </Button>
                  )}
                  {viewQuote.status === 'SENT' && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<AcceptIcon />}
                        onClick={() => handleUpdateStatus(viewQuote.id, 'ACCEPTED')}
                      >
                        Accept & Win Order
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleUpdateStatus(viewQuote.id, 'REJECTED')}
                      >
                        Client Rejected
                      </Button>
                    </>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ReviseIcon />}
                  onClick={() => {
                    setViewQuote(null);
                    handleOpenReviseModal(viewQuote);
                  }}
                >
                  Create New Revision
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      )}

      {/* REVISION HISTORY DIALOG */}
      <Dialog
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Quotation Version History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Audit trail of commercial revisions, pricing modifications, and status changes
            </Typography>
          </Box>
          <IconButton onClick={() => setHistoryDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {revisionHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No revision records found.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {revisionHistory.map((rev) => (
                <Card key={rev.id} sx={{ p: 2, borderLeft: `4px solid ${getStatusColor(rev.status) === 'success' ? '#10B981' : '#3B82F6'}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {rev.quoteNo} ({rev.versionLabel})
                    </Typography>
                    <Chip label={rev.status} color={getStatusColor(rev.status) as any} size="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
                    ₹{Math.round(parseFloat(rev.totalValue || 0)).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created: {new Date(rev.createdAt || rev.quoteDate).toLocaleString()}
                  </Typography>
                  {rev.notes && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#475569', display: 'block', mt: 0.5 }}>
                      "{rev.notes}"
                    </Typography>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1, py: 0.2, fontSize: '0.75rem' }}
                    onClick={() => {
                      setViewQuote(rev);
                      setHistoryDrawerOpen(false);
                    }}
                  >
                    View This Version
                  </Button>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setHistoryDrawerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* CREATE REVISION DIALOG */}
      <Dialog
        open={reviseDialogOpen}
        onClose={() => setReviseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Create Revision for {baseQuoteForRev?.quoteNo}
          </Typography>
          <IconButton onClick={() => setReviseDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
            This will archive {baseQuoteForRev?.versionLabel} and generate <strong>Rev {(baseQuoteForRev?.revisionNo || 0) + 1}</strong> with cloned products, commercial values, and linked opportunity.
          </Alert>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={4}
            label="Revision Reason / Commercial Notes *"
            placeholder="e.g. Revised after price negotiation: applied 5% special discount."
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setReviseDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleExecuteRevision}>
            CONFIRM & CREATE REVISION
          </Button>
        </DialogActions>
      </Dialog>

      {/* IN-PAGE CREATE / EDIT QUOTATION FORM */}
      {openModal && (
        <Box sx={{ mb: 4 }}>
          {/* Top In-Page Action Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              pb: 2,
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setOpenModal(false)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Back to Quotations
              </Button>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {editingId ? `Edit Quotation Details: ${formData.quoteNo || ''}` : 'Generate Machine Price Quotation'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure customer proposal, line item pricing, commercial terms, and GST calculations
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveQuotation} sx={{ px: 3, fontWeight: 700 }}>
                {editingId ? 'UPDATE QUOTATION' : 'SAVE QUOTATION'}
              </Button>
            </Box>
          </Box>

          {/* Card 1: Quotation & Client Details (Uniform 2-Column Grid) */}
          <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2.5 }}>
              1. Quotation & Client Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Quotation Date *"
                  value={formData.quoteDate}
                  onChange={(e) => setFormData({ ...formData, quoteDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Customer Client *"
                  value={formData.customerId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setFormData({ ...formData, customerId: id });
                    loadContactsForCustomer(id);
                  }}
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
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: Number(e.target.value) })}
                >
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
                  label="Linked Sales Opportunity (Optional)"
                  value={formData.opportunityId || ''}
                  onChange={(e) => {
                    const oppId = e.target.value ? Number(e.target.value) : null;
                    setFormData({ ...formData, opportunityId: oppId });
                  }}
                >
                  <MenuItem value="">-- None (Direct Quotation) --</MenuItem>
                  {opportunities.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.opportunityNo} — {o.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Validity Period (Days)"
                  value={formData.validityDays}
                  onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Quotation Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="DRAFT">DRAFT</MenuItem>
                  <MenuItem value="SENT">SENT TO CLIENT</MenuItem>
                  <MenuItem value="ACCEPTED">ACCEPTED (ORDER WON)</MenuItem>
                  <MenuItem value="REJECTED">REJECTED</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Assigned Sales Representative"
                  value={formData.salespersonId}
                  onChange={(e) => setFormData({ ...formData, salespersonId: Number(e.target.value) })}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Card>

          {/* Card 2: Quotation Line Items & Commercial Pricing */}
          <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  2. Quotation Line Items & Machinery Models ({formData.items.length})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Select products, customize specifications, and configure unit pricing and discounts.
                </Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleAddItemRow}>
                Add Product Line
              </Button>
            </Box>

            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell style={{ width: '32%' }}>Product / Model Name *</TableCell>
                  <TableCell style={{ width: '13%' }}>Code</TableCell>
                  <TableCell style={{ width: '13%' }}>Principal</TableCell>
                  <TableCell style={{ width: '9%' }}>Qty</TableCell>
                  <TableCell style={{ width: '13%' }}>Unit Rate (₹)</TableCell>
                  <TableCell style={{ width: '9%' }}>Disc %</TableCell>
                  <TableCell style={{ width: '11%' }}>Total (₹)</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((row: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={row.productId || ''}
                        onChange={(e) => handleItemRowChange(index, 'productId', Number(e.target.value))}
                      >
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={row.productCode || ''}
                        onChange={(e) => handleItemRowChange(index, 'productCode', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={row.principal || ''}
                        onChange={(e) => handleItemRowChange(index, 'principal', e.target.value)}
                      >
                        <MenuItem value="">-- Select --</MenuItem>
                        {principals.map((p) => (
                          <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={row.quantity}
                        onChange={(e) => handleItemRowChange(index, 'quantity', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={row.unitPrice}
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: '#F8FAFC' }}
                        helperText="Master Rate"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={row.discountPercent}
                        onChange={(e) => handleItemRowChange(index, 'discountPercent', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      ₹{Math.round(row.totalPrice || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveItemRow(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Card 3: Commercial Terms & Pricing Summary */}
          <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              3. Commercial Terms & Pricing Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={6}
                  label="Commercial Terms & Conditions"
                  placeholder="Payment terms, delivery timeline, warranty, freight, installation terms..."
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Gross Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{Math.round(formData.subtotal || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Overall Discount (%):</Typography>
                    <TextField
                      size="small"
                      type="number"
                      sx={{ width: 90 }}
                      value={formData.discountPercent}
                      onChange={(e) => {
                        const disc = Number(e.target.value);
                        const { subtotal, totalValue } = calculateQuoteTotals(
                          formData.items,
                          disc,
                          formData.taxPercent || 18
                        );
                        setFormData({ ...formData, discountPercent: disc, subtotal, totalValue });
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Applicable GST (%):</Typography>
                    <TextField
                      size="small"
                      type="number"
                      sx={{ width: 90 }}
                      value={formData.taxPercent}
                      onChange={(e) => {
                        const tax = Number(e.target.value);
                        const { subtotal, totalValue } = calculateQuoteTotals(
                          formData.items,
                          formData.discountPercent || 0,
                          tax
                        );
                        setFormData({ ...formData, taxPercent: tax, subtotal, totalValue });
                      }}
                    />
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#EEF2FF', borderRadius: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      GRAND TOTAL:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      ₹{Math.round(formData.totalValue || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Card>

          {/* Bottom Action Bar */}
          <Box
            sx={{
              p: 2,
              px: 3,
              borderTop: '1px solid #E2E8F0',
              bgcolor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              borderRadius: 1,
            }}
          >
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleSaveQuotation} sx={{ px: 4, fontWeight: 700 }}>
              {editingId ? 'UPDATE QUOTATION' : 'SAVE QUOTATION'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
