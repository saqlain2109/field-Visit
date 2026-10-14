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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Paper,
  InputAdornment,
  TableContainer,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as EyeIcon,
  FileDownload as DownloadIcon,
  Search as SearchIcon,
  RestartAlt as ResetIcon,
  ViewKanban as KanbanIcon,
  TableRows as TableIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as WonIcon,
  Cancel as LostIcon,
  AssignmentTurnedIn as QuoteIcon,
  Schedule as FollowUpIcon,
  Business as CustomerIcon,
  Person as PersonIcon,
  MonetizationOn as CurrencyIcon,
  RequestQuote as RequestQuoteIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  AutoStories as ReviseIcon,
  CheckCircleOutline as AcceptIcon,
  HighlightOff as RejectIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { exportToCsv } from '../utils/exportCsv';

const PIPELINE_STAGES = [
  { key: 'NEW_LEAD', label: 'New Leads', color: '#3B82F6', bgcolor: '#EFF6FF' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#8B5CF6', bgcolor: '#F5F3FF' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: '#F59E0B', bgcolor: '#FFFBEB' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: '#EC4899', bgcolor: '#FDF2F8' },
  { key: 'WON', label: 'Won Deals', color: '#10B981', bgcolor: '#ECFDF5' },
  { key: 'LOST', label: 'Lost Deals', color: '#EF4444', bgcolor: '#FEF2F2' },
];

const STANDARD_PRINCIPALS = [
  'Fanuc',
  'Siemens',
  'Mazak',
  'Haas Automation',
  'DMG Mori',
  'Trumpf',
  'Brother',
  'Universal Robots',
  'Yaskawa',
  'Mitsubishi Electric',
  'General Machinery',
];

export const OpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [principals, setPrincipals] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View switch: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Multi-Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [principalFilter, setPrincipalFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');

  // Modals & Details
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalTab, setModalTab] = useState(0);
  const [viewOpp, setViewOpp] = useState<any | null>(null);
  const [viewOppTab, setViewOppTab] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // In-Opportunity Quote Revision Dialog / State
  const [oppReviseDialogOpen, setOppReviseDialogOpen] = useState(false);
  const [oppBaseQuoteForRev, setOppBaseQuoteForRev] = useState<any | null>(null);
  const [oppReviseNotes, setOppReviseNotes] = useState('');
  const [generateQuoteOnSave, setGenerateQuoteOnSave] = useState(false);

  // Follow-up sub-modal & Dedicated List State
  const [oppFollowUps, setOppFollowUps] = useState<any[]>([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<number | null>(null);
  const [followUpTargetOppId, setFollowUpTargetOppId] = useState<number | null>(null);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState<any>({
    followUpDate: new Date().toISOString().split('T')[0],
    notes: '',
    nextAction: 'Send Quotation',
    nextFollowUpDate: '',
    salespersonId: user?.id || 1,
    status: 'SCHEDULED',
  });

  // Competitor Intelligence On the Go Modal
  const [competitorDialogOpen, setCompetitorDialogOpen] = useState(false);
  const [competitorTargetOpp, setCompetitorTargetOpp] = useState<any | null>(null);
  const [competitorForm, setCompetitorForm] = useState<any>({
    competitorName: '',
    competitorModel: '',
    competitorPrice: '',
    competitorStrengths: '',
    competitorWeaknesses: '',
    threatLevel: 'MEDIUM',
    winLossReason: '',
  });

  // Embedded On-the-Go Quotation States
  const [oppQuotations, setOppQuotations] = useState<any[]>([]);
  const [quickQuoteOpen, setQuickQuoteOpen] = useState(false);
  const [quickQuoteOpp, setQuickQuoteOpp] = useState<any | null>(null);
  const [quickQuoteForm, setQuickQuoteForm] = useState<any>({
    quoteDate: new Date().toISOString().split('T')[0],
    customerId: 1,
    contactId: 1,
    opportunityId: 0,
    validityDays: 30,
    validityDate: '',
    discountPercent: 0,
    taxPercent: 18.0,
    notes: '',
    termsAndConditions: '',
    status: 'DRAFT',
    items: [] as any[],
  });
  const [previewQuote, setPreviewQuote] = useState<any | null>(null);
  const [previewQuoteOpen, setPreviewQuoteOpen] = useState(false);

  const defaultFormData = {
    opportunityNo: '',
    name: '',
    customerId: 1,
    contactId: 1,
    isNewClient: false,
    leadSource: 'Direct Visit',
    requirement: '',
    principal: 'Fanuc',
    estimatedValue: 0,
    leadDate: new Date().toISOString().split('T')[0],
    expectedClosureDate: '',
    status: 'NEW_LEAD',
    salespersonId: user?.id || 1,
    products: [] as any[],
    // Competitor Intelligence
    competitorName: '',
    competitorModel: '',
    competitorPrice: '',
    competitorStrengths: '',
    competitorWeaknesses: '',
    threatLevel: 'MEDIUM',
    winLossReason: '',
  };

  const [formData, setFormData] = useState<any>(defaultFormData);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [oppRes, custRes, mastersRes, empRes]: [any, any, any, any] = await Promise.all([
        api.get('/crm/opportunities'),
        api.get('/customers'),
        api.get('/masters/summary'),
        api.get('/employees'),
      ]);
      setOpportunities(oppRes || []);
      const activeCust = (custRes || []).filter((c: any) => c.status === 'Active');
      setCustomers(activeCust);
      setProducts(mastersRes?.products || []);
      setPrincipals(mastersRes?.principals || []);
      setEmployees(empRes || []);
    } catch (err: any) {
      setError(err || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const principalOptions = principals.length > 0 ? principals.map((p: any) => p.name) : STANDARD_PRINCIPALS;

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch linked quotations whenever viewOpp changes
  useEffect(() => {
    if (viewOpp && viewOpp.id) {
      api.get(`/crm/quotations?opportunityId=${viewOpp.id}`)
        .then((res: any) => setOppQuotations(res || []))
        .catch(() => setOppQuotations([]));
    } else {
      setOppQuotations([]);
    }
  }, [viewOpp]);

  // Open Quick Quotation on the Go
  const handleOpenQuickQuote = (opp: any) => {
    setQuickQuoteOpp(opp);
    let items: any[] = [];
    if (opp.products && opp.products.length > 0) {
      items = opp.products.map((p: any) => {
        const matchedProd = products.find((pr) => pr.id === p.productId || pr.name === p.productName);
        const resolvedUnitPrice = matchedProd?.unitPrice != null ? Number(matchedProd.unitPrice) : (Number(p.unitPrice) || 0);
        return {
          productId: matchedProd?.id || p.productId || null,
          productName: matchedProd?.name || p.productName || 'Product',
          productCode: matchedProd?.code || p.productCode || '',
          principal: matchedProd?.principal || p.principal || opp.principal || 'General',
          quantity: p.quantity || 1,
          unitPrice: resolvedUnitPrice,
          discountPercent: 0,
          totalPrice: (p.quantity || 1) * resolvedUnitPrice,
        };
      });
    } else {
      const defaultProd = products.find((p) => p.principal === opp.principal) || products[0];
      items = [
        {
          productId: defaultProd?.id || null,
          productName: defaultProd?.name || opp.name || 'Industrial Equipment',
          productCode: defaultProd?.code || 'PRD-CUSTOM',
          principal: defaultProd?.principal || opp.principal || 'General',
          quantity: 1,
          unitPrice: defaultProd?.unitPrice != null ? Number(defaultProd.unitPrice) : (Number(opp.estimatedValue) || 100000),
          discountPercent: 0,
          totalPrice: defaultProd?.unitPrice != null ? Number(defaultProd.unitPrice) : (Number(opp.estimatedValue) || 100000),
        },
      ];
    }

    setQuickQuoteForm({
      quoteNo: '',
      quoteDate: new Date().toISOString().split('T')[0],
      customerId: opp.customerId || opp.customer?.id || 1,
      contactId: opp.contactId || opp.contact?.id || 1,
      opportunityId: opp.id,
      validityDays: 30,
      validityDate: '',
      discountPercent: 0,
      taxPercent: 18.0,
      notes: `Commercial proposal generated on the go for Opportunity #${opp.opportunityNo}`,
      termsAndConditions:
        "1. Price Basis: Ex-works manufacturing facility.\n2. Taxes: GST @ 18% extra as applicable.\n3. Payment Terms: 30% advance with PO, 60% against Proforma Invoice before dispatch, 10% after commissioning.\n4. Delivery Schedule: 4 to 6 weeks from receipt of technically and commercially clear order.\n5. Warranty: 12 months comprehensive OEM warranty against defects.",
      salespersonId: opp.salespersonId || user?.id || 1,
      status: 'DRAFT',
      items,
    });
    setQuickQuoteOpen(true);
  };

  const handleQuickQuoteItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...quickQuoteForm.items];
    const item = { ...updatedItems[index], [field]: value };

    if (field === 'productId') {
      const selectedProd = products.find((p: any) => p.id === Number(value));
      if (selectedProd) {
        item.productId = selectedProd.id;
        item.productName = selectedProd.name;
        item.productCode = selectedProd.code;
        item.principal = selectedProd.principal || quickQuoteOpp?.principal || 'General';
        item.unitPrice = selectedProd.unitPrice != null ? Number(selectedProd.unitPrice) : 0;
      }
    }

    const qty = Number(item.quantity) || 1;
    const rate = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    const gross = qty * rate;
    const lineTotal = Math.max(0, gross - (gross * disc) / 100);
    item.totalPrice = lineTotal;

    updatedItems[index] = item;
    setQuickQuoteForm({ ...quickQuoteForm, items: updatedItems });
  };

  const calculateQuickQuoteTotals = () => {
    const items = quickQuoteForm.items || [];
    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.totalPrice) || 0), 0);
    const overallDisc = Number(quickQuoteForm.discountPercent) || 0;
    const discountedSubtotal = Math.max(0, subtotal - (subtotal * overallDisc) / 100);
    const taxRate = Number(quickQuoteForm.taxPercent) || 18.0;
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const grandTotal = discountedSubtotal + taxAmount;
    return { subtotal, discountedSubtotal, taxAmount, grandTotal };
  };

  const handleSaveQuickQuote = async () => {
    try {
      const created: any = await api.post('/crm/quotations', quickQuoteForm);
      showToast(
        `Quotation ${created.quoteNo} (${created.versionLabel}) generated successfully on the go!`,
        'success'
      );
      setQuickQuoteOpen(false);
      fetchData();
      const targetOppId = viewOpp?.id || editingId || quickQuoteForm.opportunityId;
      if (targetOppId) {
        api.get(`/crm/quotations?opportunityId=${targetOppId}`).then((res: any) => {
          setOppQuotations(res || []);
        });
        const updatedOpp: any = await api.get(`/crm/opportunities/${targetOppId}`);
        if (updatedOpp && viewOpp) setViewOpp(updatedOpp);
      }
    } catch (err: any) {
      showToast(err || 'Failed to generate quotation', 'error');
    }
  };

  const loadFollowUps = async (oppId: number) => {
    if (!oppId) return;
    setLoadingFollowUps(true);
    try {
      const res: any = await api.get(`/crm/opportunities/${oppId}/follow-ups`);
      setOppFollowUps(res || []);
    } catch (err) {
      console.error('Failed to load follow-ups', err);
      setOppFollowUps([]);
    } finally {
      setLoadingFollowUps(false);
    }
  };

  const handleOpenViewOpp = async (opp: any) => {
    setViewOpp(opp);
    setViewOppTab(0);
    setFollowUpTargetOppId(opp.id);
    loadFollowUps(opp.id);
    try {
      const qRes: any = await api.get(`/crm/quotations?opportunityId=${opp.id}`);
      setOppQuotations(qRes || []);
    } catch {}
  };

  const handleOpenOppRevise = (q: any) => {
    setOppBaseQuoteForRev(q);
    setOppReviseNotes(`Commercial revision from ${q.versionLabel}: price & terms updated`);
    setOppReviseDialogOpen(true);
  };

  const handleExecuteOppRevision = async () => {
    if (!oppBaseQuoteForRev) return;
    try {
      const payload = {
        notes: oppReviseNotes,
      };
      const res: any = await api.post(`/crm/quotations/${oppBaseQuoteForRev.id}/revise`, payload);
      showToast(`Revision ${res.versionLabel} generated for quote ${res.quoteNo}!`, 'success');
      setOppReviseDialogOpen(false);
      setOppBaseQuoteForRev(null);
      const targetOppId = viewOpp?.id || editingId || oppBaseQuoteForRev.opportunityId;
      if (targetOppId) {
        const qRes: any = await api.get(`/crm/quotations?opportunityId=${targetOppId}`);
        setOppQuotations(qRes || []);
        const updatedOpp: any = await api.get(`/crm/opportunities/${targetOppId}`);
        if (updatedOpp && viewOpp) setViewOpp(updatedOpp);
      }
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to create revision', 'error');
    }
  };

  const handleUpdateOppQuoteStatus = async (quoteId: number, newStatus: string) => {
    try {
      await api.patch(`/crm/quotations/${quoteId}/status`, { status: newStatus });
      showToast(`Quotation status updated to ${newStatus}`, 'success');
      const targetOppId = viewOpp?.id || editingId;
      if (targetOppId) {
        const qRes: any = await api.get(`/crm/quotations?opportunityId=${targetOppId}`);
        setOppQuotations(qRes || []);
        const updatedOpp: any = await api.get(`/crm/opportunities/${targetOppId}`);
        if (updatedOpp && viewOpp) setViewOpp(updatedOpp);
      }
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to update quotation status', 'error');
    }
  };

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

  const handleOpenAddModal = async () => {
    setEditingId(null);
    setFollowUpTargetOppId(null);
    setOppFollowUps([]);
    setModalTab(0);
    setOppQuotations([]);
    setGenerateQuoteOnSave(false);
    const firstCustId = customers[0]?.id || 1;
    await loadContactsForCustomer(firstCustId);

    // Initial product line
    const filteredProds = products.filter((p) => !p.principal || p.principal === 'Fanuc');
    const firstProd = filteredProds[0] || products[0];

    setFormData({
      ...defaultFormData,
      customerId: firstCustId,
      salespersonId: user?.id || employees[0]?.id || 1,
      products: firstProd
        ? [
            {
              productId: firstProd.id,
              productName: firstProd.name,
              productCode: firstProd.code,
              principal: firstProd.principal || 'Fanuc',
              quantity: 1,
              unitPrice: firstProd.unitPrice ? parseFloat(firstProd.unitPrice) : 250000,
              totalPrice: firstProd.unitPrice ? parseFloat(firstProd.unitPrice) : 250000,
            },
          ]
        : [],
      estimatedValue: firstProd?.unitPrice ? parseFloat(firstProd.unitPrice) : 250000,
    });
    setOpenModal(true);
  };

  const handleOpenEditModal = async (opp: any) => {
    setEditingId(opp.id);
    setFollowUpTargetOppId(opp.id);
    setModalTab(0);
    setGenerateQuoteOnSave(false);
    loadFollowUps(opp.id);
    try {
      const qRes: any = await api.get(`/crm/quotations?opportunityId=${opp.id}`);
      setOppQuotations(qRes || []);
    } catch {}
    await loadContactsForCustomer(opp.customerId);

    const prodsMapped = (opp.products || []).map((p: any) => ({
      id: p.id,
      productId: p.productId,
      productName: p.productName,
      productCode: p.productCode,
      principal: p.principal,
      quantity: p.quantity,
      unitPrice: p.unitPrice ? parseFloat(p.unitPrice) : 0,
      totalPrice: p.totalPrice ? parseFloat(p.totalPrice) : 0,
    }));

    setFormData({
      opportunityNo: opp.opportunityNo,
      name: opp.name,
      customerId: opp.customerId,
      contactId: opp.contactId,
      isNewClient: Boolean(opp.isNewClient),
      leadSource: opp.leadSource || 'Direct Visit',
      requirement: opp.requirement || '',
      principal: opp.principal || 'Fanuc',
      estimatedValue: opp.estimatedValue ? parseFloat(opp.estimatedValue) : 0,
      leadDate: opp.leadDate ? new Date(opp.leadDate).toISOString().split('T')[0] : '',
      expectedClosureDate: opp.expectedClosureDate
        ? new Date(opp.expectedClosureDate).toISOString().split('T')[0]
        : '',
      status: opp.status || 'NEW_LEAD',
      salespersonId: opp.salespersonId || user?.id || 1,
      products: prodsMapped,
      // Competitor Intelligence
      competitorName: opp.competitorName || '',
      competitorModel: opp.competitorModel || '',
      competitorPrice: opp.competitorPrice ? parseFloat(opp.competitorPrice) : '',
      competitorStrengths: opp.competitorStrengths || '',
      competitorWeaknesses: opp.competitorWeaknesses || '',
      threatLevel: opp.threatLevel || 'MEDIUM',
      winLossReason: opp.winLossReason || '',
    });
    setOpenModal(true);
  };

  // Dynamic Product line changes
  const handleProductRowChange = (index: number, field: string, val: any) => {
    const updated = [...formData.products];
    const row = { ...updated[index], [field]: val };

    if (field === 'productId') {
      const selectedProd = products.find((p) => p.id === val);
      if (selectedProd) {
        row.productName = selectedProd.name;
        row.productCode = selectedProd.code;
        row.principal = selectedProd.principal || formData.principal;
        row.unitPrice = selectedProd.unitPrice ? parseFloat(selectedProd.unitPrice) : row.unitPrice || 100000;
      }
    }

    const qty = parseInt(String(row.quantity), 10) || 1;
    const rate = parseFloat(String(row.unitPrice)) || 0;
    row.totalPrice = qty * rate;

    updated[index] = row;

    const sumTotal = updated.reduce((s, item) => s + (parseFloat(item.totalPrice) || 0), 0);
    setFormData({
      ...formData,
      products: updated,
      estimatedValue: sumTotal,
    });
  };

  const handleAddProductRow = () => {
    const principalProds = products.filter(
      (p) => !p.principal || p.principal?.toLowerCase() === formData.principal?.toLowerCase()
    );
    const candidate = principalProds[0] || products[0];

    const newRow = {
      productId: candidate?.id || null,
      productName: candidate?.name || 'New Machine Model',
      productCode: candidate?.code || 'MACH-001',
      principal: candidate?.principal || formData.principal,
      quantity: 1,
      unitPrice: candidate?.unitPrice ? parseFloat(candidate.unitPrice) : 150000,
      totalPrice: candidate?.unitPrice ? parseFloat(candidate.unitPrice) : 150000,
    };

    const updated = [...formData.products, newRow];
    const sumTotal = updated.reduce((s, item) => s + (parseFloat(item.totalPrice) || 0), 0);
    setFormData({
      ...formData,
      products: updated,
      estimatedValue: sumTotal,
    });
  };

  const handleRemoveProductRow = (index: number) => {
    const updated = formData.products.filter((_: any, idx: number) => idx !== index);
    const sumTotal = updated.reduce((s: number, item: any) => s + (parseFloat(item.totalPrice) || 0), 0);
    setFormData({
      ...formData,
      products: updated,
      estimatedValue: sumTotal,
    });
  };

  const handleSaveOpportunity = async () => {
    if (!formData.name.trim()) {
      showToast('Opportunity Title / Requirement Name is required!', 'warning');
      return;
    }
    if (!formData.customerId) {
      showToast('Please select a Customer for this opportunity!', 'warning');
      return;
    }

    try {
      const payload = {
        ...formData,
        competitorPrice: formData.competitorPrice !== '' && formData.competitorPrice != null
          ? Number(formData.competitorPrice)
          : null,
      };

      let oppId = editingId;
      if (editingId) {
        const updatedOpp: any = await api.put(`/crm/opportunities/${editingId}`, payload);
        showToast('Opportunity updated successfully!', 'success');
        if (viewOpp && viewOpp.id === editingId) {
          setViewOpp({ ...viewOpp, ...updatedOpp });
        }
        setOpportunities((prev) => prev.map((o) => (o.id === editingId ? { ...o, ...updatedOpp } : o)));
      } else {
        const createdOpp: any = await api.post('/crm/opportunities', payload);
        oppId = createdOpp?.id;
        showToast('New Opportunity created in pipeline!', 'success');

        if (generateQuoteOnSave && oppId) {
          const quotePayload = {
            quoteDate: new Date().toISOString().split('T')[0],
            customerId: formData.customerId,
            contactId: formData.contactId,
            opportunityId: oppId,
            validityDays: 30,
            discountPercent: 0,
            taxPercent: 18.0,
            notes: `Initial Quotation Rev 0 auto-generated for Opportunity #${createdOpp.opportunityNo || ''}`,
            termsAndConditions:
              "1. Price Basis: Ex-works manufacturing facility.\n2. Taxes: GST @ 18% extra.\n3. Payment Terms: 30% advance, 70% before dispatch.\n4. Delivery: 4-6 weeks.",
            salespersonId: formData.salespersonId || user?.id || 1,
            status: 'DRAFT',
            items: formData.products.map((p: any) => ({
              productId: p.productId || null,
              productName: p.productName || 'Machine Model',
              productCode: p.productCode || '',
              principal: p.principal || formData.principal,
              quantity: p.quantity || 1,
              unitPrice: p.unitPrice || 0,
              discountPercent: 0,
              totalPrice: p.totalPrice || 0,
            })),
          };
          try {
            const qRes: any = await api.post('/crm/quotations', quotePayload);
            showToast(`Initial Quotation ${qRes.quoteNo} (Rev 0) created successfully!`, 'success');
          } catch (qErr) {
            console.error('Failed to auto-generate quote', qErr);
          }
        }
      }
      setOpenModal(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to save opportunity', 'error');
    }
  };

  // Follow-up handlers
  const handleOpenAddFollowUp = (targetOppId?: number) => {
    const oppId = targetOppId || followUpTargetOppId || viewOpp?.id || editingId;
    if (!oppId) {
      showToast('Save the Opportunity first before logging follow-ups.', 'info');
      return;
    }
    setFollowUpTargetOppId(oppId);
    setEditingFollowUpId(null);
    setFollowUpForm({
      followUpDate: new Date().toISOString().split('T')[0],
      notes: '',
      nextAction: 'Commercial Proposal Follow-up',
      nextFollowUpDate: '',
      salespersonId: formData.salespersonId || viewOpp?.salespersonId || user?.id || 1,
      status: 'SCHEDULED',
    });
    setFollowUpDialogOpen(true);
  };

  const handleEditFollowUp = (f: any, targetOppId?: number) => {
    const oppId = targetOppId || followUpTargetOppId || viewOpp?.id || editingId;
    setFollowUpTargetOppId(oppId);
    setEditingFollowUpId(f.id);
    setFollowUpForm({
      followUpDate: f.followUpDate ? new Date(f.followUpDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: f.notes || '',
      nextAction: f.nextAction || '',
      nextFollowUpDate: f.nextFollowUpDate ? new Date(f.nextFollowUpDate).toISOString().split('T')[0] : '',
      salespersonId: f.salespersonId || user?.id || 1,
      status: f.status || 'SCHEDULED',
    });
    setFollowUpDialogOpen(true);
  };

  const handleDeleteFollowUp = async (followUpId: number, targetOppId?: number) => {
    const oppId = targetOppId || followUpTargetOppId || viewOpp?.id || editingId;
    if (!window.confirm('Are you sure you want to delete this follow-up record?')) return;
    try {
      await api.delete(`/crm/opportunities/follow-ups/${followUpId}`);
      showToast('Follow-up record deleted', 'info');
      if (oppId) {
        await loadFollowUps(oppId);
        fetchData();
        if (viewOpp && viewOpp.id === oppId) {
          const updatedOpp: any = await api.get(`/crm/opportunities/${oppId}`);
          setViewOpp(updatedOpp);
        }
      }
    } catch (err: any) {
      showToast(err || 'Failed to delete follow-up', 'error');
    }
  };

  const handleToggleFollowUpStatus = async (f: any, newStatus: string, targetOppId?: number) => {
    const oppId = targetOppId || followUpTargetOppId || viewOpp?.id || editingId;
    try {
      await api.put(`/crm/opportunities/follow-ups/${f.id}`, {
        ...f,
        status: newStatus,
        followUpDate: f.followUpDate ? new Date(f.followUpDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        nextFollowUpDate: f.nextFollowUpDate ? new Date(f.nextFollowUpDate).toISOString().split('T')[0] : null,
      });
      showToast(`Follow-up marked as ${newStatus}`, 'success');
      if (oppId) {
        await loadFollowUps(oppId);
        fetchData();
        if (viewOpp && viewOpp.id === oppId) {
          const updatedOpp: any = await api.get(`/crm/opportunities/${oppId}`);
          setViewOpp(updatedOpp);
        }
      }
    } catch (err: any) {
      showToast(err || 'Failed to update follow-up status', 'error');
    }
  };

  const handleSaveFollowUp = async () => {
    if (!followUpForm.notes.trim()) {
      showToast('Follow-up discussion notes are required!', 'warning');
      return;
    }
    const targetOppId = followUpTargetOppId || viewOpp?.id || editingId;
    if (!targetOppId) {
      showToast('Save the Opportunity first before logging follow-ups.', 'info');
      return;
    }
    try {
      if (editingFollowUpId) {
        await api.put(`/crm/opportunities/follow-ups/${editingFollowUpId}`, followUpForm);
        showToast('Follow-up interaction updated successfully!', 'success');
      } else {
        await api.post(`/crm/opportunities/${targetOppId}/follow-ups`, followUpForm);
        showToast('Follow-up interaction logged successfully!', 'success');
      }
      setFollowUpDialogOpen(false);
      setEditingFollowUpId(null);
      await loadFollowUps(targetOppId);
      fetchData();
      if (viewOpp && viewOpp.id === targetOppId) {
        const updatedOpp: any = await api.get(`/crm/opportunities/${targetOppId}`);
        setViewOpp(updatedOpp);
      }
    } catch (err: any) {
      showToast(err || 'Failed to save follow-up', 'error');
    }
  };

  // Competitor Intelligence On the Go Handlers
  const handleOpenCompetitorDialog = (opp?: any) => {
    const target = opp || viewOpp;
    if (!target || !target.id) return;
    setCompetitorTargetOpp(target);
    setCompetitorForm({
      competitorName: target.competitorName || '',
      competitorModel: target.competitorModel || '',
      competitorPrice: target.competitorPrice ? parseFloat(target.competitorPrice) : '',
      competitorStrengths: target.competitorStrengths || '',
      competitorWeaknesses: target.competitorWeaknesses || '',
      threatLevel: target.threatLevel || 'MEDIUM',
      winLossReason: target.winLossReason || '',
    });
    setCompetitorDialogOpen(true);
  };

  const handleSaveCompetitorIntel = async () => {
    if (!competitorTargetOpp?.id) return;
    try {
      const payload = {
        competitorName: competitorForm.competitorName,
        competitorModel: competitorForm.competitorModel,
        competitorPrice: competitorForm.competitorPrice !== '' && competitorForm.competitorPrice != null
          ? Number(competitorForm.competitorPrice)
          : null,
        competitorStrengths: competitorForm.competitorStrengths,
        competitorWeaknesses: competitorForm.competitorWeaknesses,
        threatLevel: competitorForm.threatLevel || 'MEDIUM',
        winLossReason: competitorForm.winLossReason,
      };

      const updatedOpp: any = await api.put(`/crm/opportunities/${competitorTargetOpp.id}/competitor`, payload);

      if (viewOpp && viewOpp.id === competitorTargetOpp.id) {
        setViewOpp({ ...viewOpp, ...updatedOpp });
      }
      setOpportunities((prev) => prev.map((o) => (o.id === competitorTargetOpp.id ? { ...o, ...updatedOpp } : o)));

      setCompetitorDialogOpen(false);
      showToast('Competitor intelligence updated on the go!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to update competitor intelligence', 'error');
    }
  };

  const handleClearCompetitorIntel = async (oppId?: number) => {
    const targetId = oppId || competitorTargetOpp?.id || viewOpp?.id;
    if (!targetId) return;
    if (!window.confirm('Are you sure you want to remove competitor intelligence for this opportunity?')) return;
    try {
      const updatedOpp: any = await api.delete(`/crm/opportunities/${targetId}/competitor`);
      if (viewOpp && viewOpp.id === targetId) {
        setViewOpp({ ...viewOpp, ...updatedOpp });
      }
      setOpportunities((prev) => prev.map((o) => (o.id === targetId ? { ...o, ...updatedOpp } : o)));
      setCompetitorDialogOpen(false);
      showToast('Competitor intelligence removed.', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to clear competitor intelligence', 'error');
    }
  };

  const handleStageDrop = async (oppId: number, newStage: string) => {
    try {
      await api.put(`/crm/opportunities/${oppId}`, { status: newStage });
      showToast(`Moved deal to "${newStage.replace('_', ' ')}"`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err || 'Failed to update deal stage', 'error');
    }
  };

  // Filter logic
  const filteredOpps = opportunities.filter((o) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const match =
        o.name?.toLowerCase().includes(q) ||
        o.opportunityNo?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.principal?.toLowerCase().includes(q) ||
        o.salesperson?.name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter && o.status !== statusFilter) return false;
    if (principalFilter && o.principal?.toLowerCase() !== principalFilter.toLowerCase()) return false;
    if (customerFilter && String(o.customerId) !== String(customerFilter)) return false;
    if (salespersonFilter && String(o.salespersonId) !== String(salespersonFilter)) return false;
    return true;
  });

  // KPI Calculations
  const totalPipelineValue = filteredOpps
    .filter((o) => o.status !== 'LOST' && o.status !== 'WON')
    .reduce((s, o) => s + (parseFloat(o.estimatedValue) || 0), 0);

  const totalWonValue = filteredOpps
    .filter((o) => o.status === 'WON')
    .reduce((s, o) => s + (parseFloat(o.estimatedValue) || 0), 0);

  const wonCount = filteredOpps.filter((o) => o.status === 'WON').length;
  const closedCount = filteredOpps.filter((o) => o.status === 'WON' || o.status === 'LOST').length;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  const handleExportCsv = () => {
    const data = filteredOpps.map((o) => ({
      OpportunityNo: o.opportunityNo,
      Name: o.name,
      Customer: o.customer?.name,
      NewClient: o.isNewClient ? 'New' : 'Existing',
      Contact: o.contact?.contactName,
      LeadSource: o.leadSource,
      Principal: o.principal,
      EstimatedValue: o.estimatedValue,
      LeadDate: o.leadDate,
      ExpectedClosure: o.expectedClosureDate,
      Status: o.status,
      Salesperson: o.salesperson?.name,
      ProductsCount: o.products?.length || 0,
      FollowUpsCount: o.followUps?.length || 0,
    }));
    exportToCsv(`Opportunities_${new Date().toISOString().split('T')[0]}.csv`, data);
    showToast('Opportunities CSV exported successfully!', 'success');
  };

  const getStageColor = (status: string) => {
    const found = PIPELINE_STAGES.find((s) => s.key === status);
    return found ? found.color : '#64748B';
  };

  return (
    <Box>
      {!openModal && !viewOpp && (
        <>
          {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Sales CRM: Opportunities & Pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage inquiries, leads, principal machine requirements, follow-ups, and deal progression
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ bgcolor: '#F1F5F9', p: 0.5, borderRadius: 2, display: 'flex' }}>
            <Button
              size="small"
              variant={viewMode === 'kanban' ? 'contained' : 'text'}
              startIcon={<KanbanIcon />}
              onClick={() => setViewMode('kanban')}
              sx={{ textTransform: 'none', px: 1.5 }}
            >
              Pipeline Board
            </Button>
            <Button
              size="small"
              variant={viewMode === 'table' ? 'contained' : 'text'}
              startIcon={<TableIcon />}
              onClick={() => setViewMode('table')}
              sx={{ textTransform: 'none', px: 1.5 }}
            >
              Data Table
            </Button>
          </Box>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>
            Export CSV ({filteredOpps.length})
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
            New Opportunity
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB' }}>
              <TrendingUpIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Active Opportunities
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {filteredOpps.length}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: '#F5F3FF', borderRadius: 2, color: '#7C3AED' }}>
              <CurrencyIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Active Pipeline Value
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                ₹{Math.round(totalPipelineValue).toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: 2, color: '#059669' }}>
              <WonIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Deals Won Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#059669' }}>
                ₹{Math.round(totalWonValue).toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: 2, color: '#D97706' }}>
              <QuoteIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Win Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>
                {winRate}%
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Multi-Filters Card */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search title, deal #, client..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2.2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Stage / Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Stages</MenuItem>
              {PIPELINE_STAGES.map((s) => (
                <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2.2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Principal"
              value={principalFilter}
              onChange={(e) => setPrincipalFilter(e.target.value)}
            >
              <MenuItem value="">All Principals</MenuItem>
              {principalOptions.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2.3}>
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
          <Grid item xs={6} sm={3} md={2.3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Salesperson"
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
            >
              <MenuItem value="">All Salespeople</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {(searchFilter || statusFilter || principalFilter || customerFilter || salespersonFilter) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary">
              Filtered deals showing: <strong>{filteredOpps.length}</strong> of {opportunities.length}
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
                setSalespersonFilter('');
              }}
            >
              Reset Filters
            </Button>
          </Box>
        )}
      </Card>

      {/* Main View: Kanban Board OR Table View */}
      {loading ? (
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'kanban' ? (
        /* KANBAN PIPELINE VIEW */
        <Box sx={{ overflowX: 'auto', pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, minWidth: 1200 }}>
            {PIPELINE_STAGES.map((stage) => {
              const stageOpps = filteredOpps.filter((o) => o.status === stage.key);
              const stageTotal = stageOpps.reduce((s, o) => s + (parseFloat(o.estimatedValue) || 0), 0);

              return (
                <Paper
                  key={stage.key}
                  sx={{
                    flex: '1 1 0',
                    minWidth: 260,
                    bgcolor: '#F8FAFC',
                    p: 1.5,
                    borderRadius: 2,
                    borderTop: `4px solid ${stage.color}`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {stage.label} ({stageOpps.length})
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      ₹{Math.round(stageTotal).toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {stageOpps.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', border: '1px dashed #CBD5E1', borderRadius: 2 }}>
                        <Typography variant="caption">No deals in this stage</Typography>
                      </Box>
                    ) : (
                      stageOpps.map((opp) => (
                        <Card
                          key={opp.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            '&:hover': { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)', transform: 'translateY(-2px)' },
                            transition: 'all 0.2s',
                          }}
                          onClick={() => handleOpenViewOpp(opp)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {opp.opportunityNo}
                            </Typography>
                            {opp.isNewClient && (
                              <Chip label="New Client" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>

                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
                            {opp.name}
                          </Typography>

                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {opp.customer?.name}
                          </Typography>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Chip label={opp.principal || 'General'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              ₹{Math.round(parseFloat(opp.estimatedValue || 0)).toLocaleString('en-IN')}
                            </Typography>
                          </Box>

                          {opp.competitorName ? (
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                              <Tooltip title="Click to update Competitor Intel on the Go">
                                <Chip
                                  label={`⚡ vs ${opp.competitorName}${opp.threatLevel ? ` (${opp.threatLevel})` : ''}`}
                                  size="small"
                                  color={opp.threatLevel === 'HIGH' || opp.threatLevel === 'DOMINANT' ? 'error' : opp.threatLevel === 'MEDIUM' ? 'warning' : 'default'}
                                  variant="outlined"
                                  onClick={(e) => { e.stopPropagation(); handleOpenCompetitorDialog(opp); }}
                                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                                />
                              </Tooltip>
                            </Box>
                          ) : (
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                              <Tooltip title="Log Competitor on the Go">
                                <Chip
                                  label="+ Competitor"
                                  size="small"
                                  variant="outlined"
                                  onClick={(e) => { e.stopPropagation(); handleOpenCompetitorDialog(opp); }}
                                  sx={{ height: 18, fontSize: '0.62rem', borderStyle: 'dashed', cursor: 'pointer', color: 'text.secondary' }}
                                />
                              </Tooltip>
                            </Box>
                          )}

                          <Divider sx={{ my: 1 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Rep: {opp.salesperson?.name?.split(' ')[0] || 'Unassigned'}
                            </Typography>
                            <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Create Quotation on the Go">
                                <IconButton size="small" color="secondary" onClick={() => handleOpenQuickQuote(opp)}>
                                  <RequestQuoteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Deal">
                                <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(opp)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Card>
                      ))
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      ) : (
        /* TABLE VIEW */
        <Card>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell>Opportunity #</TableCell>
                <TableCell>Opportunity Title</TableCell>
                <TableCell>Customer Client</TableCell>
                <TableCell>Client Type</TableCell>
                <TableCell>Principal</TableCell>
                <TableCell>Competitor</TableCell>
                <TableCell>Estimated Value (₹)</TableCell>
                <TableCell>Lead Date</TableCell>
                <TableCell>Status / Stage</TableCell>
                <TableCell>Assigned Rep</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOpps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No opportunities found. Click "New Opportunity" to start a deal.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOpps.map((opp) => (
                  <TableRow key={opp.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {opp.opportunityNo}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{opp.name}</TableCell>
                    <TableCell>{opp.customer?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={opp.isNewClient ? 'New Client' : 'Existing'}
                        size="small"
                        color={opp.isNewClient ? 'secondary' : 'default'}
                        variant={opp.isNewClient ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell>{opp.principal || '-'}</TableCell>
                    <TableCell>
                      {opp.competitorName ? (
                        <Tooltip title={`Click to edit on the go: Rival Model: ${opp.competitorModel || 'N/A'} | Price: ₹${opp.competitorPrice ? Number(opp.competitorPrice).toLocaleString('en-IN') : 'N/A'} | Threat: ${opp.threatLevel || 'MED'}`}>
                          <Chip
                            label={opp.competitorName}
                            size="small"
                            color={opp.threatLevel === 'HIGH' || opp.threatLevel === 'DOMINANT' ? 'error' : opp.threatLevel === 'MEDIUM' ? 'warning' : 'default'}
                            variant="outlined"
                            onClick={(e) => { e.stopPropagation(); handleOpenCompetitorDialog(opp); }}
                            sx={{ fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Log Competitor on the Go">
                          <Chip
                            label="+ Add"
                            size="small"
                            variant="outlined"
                            onClick={(e) => { e.stopPropagation(); handleOpenCompetitorDialog(opp); }}
                            sx={{ fontSize: '0.65rem', borderStyle: 'dashed', cursor: 'pointer', color: 'text.secondary' }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ₹{Math.round(parseFloat(opp.estimatedValue || 0)).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{opp.leadDate ? new Date(opp.leadDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={opp.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: getStageColor(opp.status),
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>{opp.salesperson?.name || '-'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <Tooltip title="Create Quotation on the Go">
                          <IconButton size="small" color="secondary" onClick={() => handleOpenQuickQuote(opp)}>
                            <RequestQuoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Deal Details">
                          <IconButton size="small" color="info" onClick={() => handleOpenViewOpp(opp)}>
                            <EyeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Deal">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(opp)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
      </>
      )}

      {/* IN-PAGE VIEW OPPORTUNITY DETAIL */}
      {!openModal && viewOpp && (
        <Box sx={{ mb: 4 }}>
          {/* Top In-Page Action Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setViewOpp(null)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Back to Opportunities
              </Button>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {viewOpp.opportunityNo} — {viewOpp.name}
                  </Typography>
                  <Chip
                    label={viewOpp.status.replace('_', ' ')}
                    size="small"
                    sx={{ bgcolor: getStageColor(viewOpp.status), color: '#FFF', fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Customer: {viewOpp.customer?.name} | Principal: {viewOpp.principal} | Rep: {viewOpp.salesperson?.name || 'Unassigned'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<RequestQuoteIcon />}
                onClick={() => handleOpenQuickQuote(viewOpp)}
                sx={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', color: '#FFFFFF', fontWeight: 700 }}
              >
                + Quick Quotation
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => { handleOpenEditModal(viewOpp); }}
              >
                Edit Deal
              </Button>
              <Button variant="outlined" onClick={() => setViewOpp(null)}>
                Close
              </Button>
            </Box>
          </Box>

          {/* Details Card with Tabs */}
          <Card sx={{ mb: 3, border: '1px solid #E2E8F0' }}>
            <Tabs value={viewOppTab} onChange={(_, v) => setViewOppTab(v)} sx={{ bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', px: 2 }}>
              <Tab label="1. Overview & Customer Details" sx={{ fontWeight: 700 }} />
              <Tab label={`2. Machine Models (${viewOpp?.products?.length || 0})`} sx={{ fontWeight: 700 }} />
              <Tab label={`3. Commercial Quotations & Revisions (${oppQuotations.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`4. Follow-up Timeline (${oppFollowUps.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={viewOpp.competitorName ? `5. Competitor (${viewOpp.competitorName})` : "5. Competitor Intelligence"} sx={{ fontWeight: 700 }} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {viewOppTab === 0 && (
                <Box>
                  <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2.5 }}>
                      1. Opportunity & Client Information
                    </Typography>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Customer Client:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {viewOpp.customer?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Account Type: {viewOpp.isNewClient ? 'New Client Acquisition' : 'Existing Account'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Primary Contact:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {viewOpp.contact?.contactName || 'Primary Point of Contact'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Phone: {viewOpp.contact?.mobileNo || '-'} | Email: {viewOpp.contact?.email || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Principal / Manufacturer Brand:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewOpp.principal || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Lead Source:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewOpp.leadSource || '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Lead Date:</Typography>
                        <Typography variant="body1">{viewOpp.leadDate ? new Date(viewOpp.leadDate).toLocaleDateString() : '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Expected Closure Date:</Typography>
                        <Typography variant="body1">{viewOpp.expectedClosureDate ? new Date(viewOpp.expectedClosureDate).toLocaleDateString() : '-'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Assigned Sales Engineer:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {viewOpp.salesperson?.name || 'Unassigned'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">Estimated Deal Value:</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          ₹{Math.round(parseFloat(viewOpp.estimatedValue || 0)).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Competitor Overview Snapshot if active */}
                    {viewOpp.competitorName && (
                      <Paper sx={{ p: 2, mt: 2.5, bgcolor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              ⚡ Competitor Rivalry: {viewOpp.competitorName} {viewOpp.competitorModel ? `(${viewOpp.competitorModel})` : ''}
                            </Typography>
                            {viewOpp.threatLevel && (
                              <Chip
                                label={`Threat: ${viewOpp.threatLevel}`}
                                size="small"
                                color={viewOpp.threatLevel === 'HIGH' || viewOpp.threatLevel === 'DOMINANT' ? 'error' : viewOpp.threatLevel === 'MEDIUM' ? 'warning' : 'success'}
                                sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenCompetitorDialog(viewOpp)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                              ⚡ Edit on the Go
                            </Button>
                            <Button size="small" onClick={() => setViewOppTab(4)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                              View Full Analysis →
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    )}
                  </Card>

                  {viewOpp.requirement && (
                    <Card sx={{ p: 3, border: '1px solid #E2E8F0', borderLeft: '4px solid #3B82F6', bgcolor: '#FFFFFF' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                        Customer Need / Technical Requirement Specifications:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {viewOpp.requirement}
                      </Typography>
                    </Card>
                  )}
                </Box>
              )}

              {viewOppTab === 1 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    Opportunity Machine / Product Models ({viewOpp.products?.length || 0})
                  </Typography>
                  <Table size="small" border={1} style={{ borderColor: '#E2E8F0', marginBottom: 16 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell>Product / Model</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Principal</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit Price (₹)</TableCell>
                        <TableCell align="right">Total (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewOpp.products?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No products attached</TableCell>
                        </TableRow>
                      ) : (
                        viewOpp.products?.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{p.productName}</TableCell>
                            <TableCell>{p.productCode}</TableCell>
                            <TableCell>{p.principal}</TableCell>
                            <TableCell align="right">{p.quantity}</TableCell>
                            <TableCell align="right">₹{parseFloat(p.unitPrice || 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              ₹{parseFloat(p.totalPrice || 0).toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {viewOppTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QuoteIcon fontSize="small" />
                        Commercial Quotations & Revisions ({oppQuotations.length})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Manage versioned quotes (Rev 0, Rev 1, Rev 2), revise proposals, or generate new ones on the spot.
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<RequestQuoteIcon />}
                      onClick={() => handleOpenQuickQuote(viewOpp)}
                      sx={{
                        background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      + Create Quotation on the Go
                    </Button>
                  </Box>

                  {oppQuotations.length === 0 ? (
                    <Alert severity="info" sx={{ py: 2 }}>
                      No quotations generated for this deal yet. Click <strong>"+ Create Quotation on the Go"</strong> above to generate and attach an official quotation with pre-populated products!
                    </Alert>
                  ) : (
                    <Table size="small" border={1} style={{ borderColor: '#E2E8F0', marginBottom: 16 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                          <TableCell>Quote #</TableCell>
                          <TableCell>Revision</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Subtotal (₹)</TableCell>
                          <TableCell align="right">Tax (₹)</TableCell>
                          <TableCell align="right">Total Value (₹)</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Revision Notes</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {oppQuotations.map((q: any) => (
                          <TableRow key={q.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{q.quoteNo}</TableCell>
                            <TableCell>
                              <Chip
                                label={q.versionLabel || `Rev ${q.revisionNo}`}
                                size="small"
                                color={q.revisionNo > 0 ? 'secondary' : 'primary'}
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell>{q.quoteDate ? new Date(q.quoteDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell align="right">₹{parseFloat(q.subtotal || 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell align="right">₹{(parseFloat(q.totalValue || 0) - parseFloat(q.subtotal || 0)).toLocaleString('en-IN')}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              ₹{parseFloat(q.totalValue || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={q.status}
                                size="small"
                                color={
                                  q.status === 'ACCEPTED'
                                    ? 'success'
                                    : q.status === 'REJECTED'
                                    ? 'error'
                                    : q.status === 'SENT'
                                    ? 'info'
                                    : q.status === 'REVISED'
                                    ? 'default'
                                    : 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180, fontSize: '0.75rem', color: 'text.secondary' }}>
                              {q.notes || '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                                <Tooltip title="Preview & Print Quotation Document">
                                  <IconButton size="small" color="primary" onClick={() => { setPreviewQuote(q); setPreviewQuoteOpen(true); }}>
                                    <EyeIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {q.status !== 'REVISED' && (
                                  <Tooltip title="Create Revision (Rev N+1)">
                                    <IconButton size="small" color="secondary" onClick={() => handleOpenOppRevise(q)}>
                                      <ReviseIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {q.status === 'SENT' && (
                                  <>
                                    <Tooltip title="Accept Quote -> Mark Won">
                                      <IconButton size="small" color="success" onClick={() => handleUpdateOppQuoteStatus(q.id, 'ACCEPTED')}>
                                        <AcceptIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject Quote -> Mark Lost">
                                      <IconButton size="small" color="error" onClick={() => handleUpdateOppQuoteStatus(q.id, 'REJECTED')}>
                                        <RejectIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              )}

              {viewOppTab === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Follow-up Activities & Interactions ({oppFollowUps.length})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Logged customer calls, meetings, technical demos, and action items.
                      </Typography>
                    </Box>
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAddFollowUp(viewOpp.id)}>
                      + Log Follow-up
                    </Button>
                  </Box>

                  {loadingFollowUps ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Loading follow-up history...</Typography>
                    </Box>
                  ) : oppFollowUps.length === 0 ? (
                    <Alert severity="info" sx={{ py: 2 }}>
                      No follow-ups logged yet for this deal. Click <strong>"+ Log Follow-up"</strong> to record customer discussions and next actions.
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {oppFollowUps.map((f: any) => (
                        <Paper
                          key={f.id}
                          sx={{
                            p: 2,
                            bgcolor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderLeft: `5px solid ${f.status === 'COMPLETED' ? '#10B981' : f.status === 'CANCELLED' ? '#94A3B8' : '#3B82F6'}`,
                            borderRadius: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {f.nextAction || 'Customer Interaction'}
                              </Typography>
                              <Chip
                                label={f.status}
                                size="small"
                                color={f.status === 'COMPLETED' ? 'success' : f.status === 'CANCELLED' ? 'default' : 'primary'}
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {f.status !== 'COMPLETED' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleToggleFollowUpStatus(f, 'COMPLETED', viewOpp.id)}
                                  sx={{ fontSize: '0.72rem', py: 0.2, px: 1, textTransform: 'none', fontWeight: 700 }}
                                >
                                  ✓ Mark Done
                                </Button>
                              )}
                              {f.status === 'COMPLETED' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => handleToggleFollowUpStatus(f, 'SCHEDULED', viewOpp.id)}
                                  sx={{ fontSize: '0.72rem', py: 0.2, px: 1, textTransform: 'none', fontWeight: 600 }}
                                >
                                  Re-open
                                </Button>
                              )}
                              <Tooltip title="Edit Follow-up">
                                <IconButton size="small" color="primary" onClick={() => handleEditFollowUp(f, viewOpp.id)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Follow-up">
                                <IconButton size="small" color="error" onClick={() => handleDeleteFollowUp(f.id, viewOpp.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, whiteSpace: 'pre-line' }}>
                            {f.notes}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              <strong>Date:</strong> {f.followUpDate ? new Date(f.followUpDate).toLocaleDateString() : '-'}
                            </Typography>
                            {f.nextFollowUpDate && (
                              <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 700, bgcolor: '#EFF6FF', px: 1, py: 0.3, borderRadius: 1 }}>
                                Next Action Date: {new Date(f.nextFollowUpDate).toLocaleDateString()}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Rep: {f.salesperson?.name || 'Assigned Salesperson'}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {viewOppTab === 4 && (
                <Box>
                  <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ⚡ Competitor Intelligence & Win/Loss Analysis
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Competitive positioning against rival machinery brands, quoted benchmark pricing, and deal outcome rationale.
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {viewOpp.threatLevel && (
                          <Chip
                            label={`Threat Level: ${viewOpp.threatLevel}`}
                            size="small"
                            color={viewOpp.threatLevel === 'HIGH' || viewOpp.threatLevel === 'DOMINANT' ? 'error' : viewOpp.threatLevel === 'MEDIUM' ? 'warning' : 'success'}
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenCompetitorDialog(viewOpp)}
                          sx={{ fontWeight: 700, textTransform: 'none' }}
                        >
                          ⚡ Update Competitor on the Go
                        </Button>
                        {viewOpp.competitorName && (
                          <Tooltip title="Remove Competitor Intel">
                            <IconButton size="small" color="error" onClick={() => handleClearCompetitorIntel(viewOpp.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {viewOpp.competitorName ? (
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" color="text.secondary">Competitor Brand / Maker:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {viewOpp.competitorName}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" color="text.secondary">Competitor Machine Model / Offering:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                            {viewOpp.competitorModel || 'Standard Offering'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Competitor Quoted / Benchmark Price:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#DC2626' }}>
                            {viewOpp.competitorPrice ? `₹${parseFloat(viewOpp.competitorPrice).toLocaleString('en-IN')}` : 'Not Specified'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Our Estimated Deal Value:</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ₹{Math.round(parseFloat(viewOpp.estimatedValue || 0)).toLocaleString('en-IN')}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Commercial Price Variance:</Typography>
                          {viewOpp.competitorPrice ? (
                            (() => {
                              const comp = parseFloat(viewOpp.competitorPrice);
                              const our = parseFloat(viewOpp.estimatedValue || 0);
                              const diff = our - comp;
                              const pct = Math.round((Math.abs(diff) / comp) * 100);
                              const isLower = diff < 0;
                              return (
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={isLower ? `₹${Math.abs(diff).toLocaleString('en-IN')} (${pct}%) LOWER` : `₹${diff.toLocaleString('en-IN')} (${pct}%) HIGHER`}
                                    size="small"
                                    color={isLower ? 'success' : 'warning'}
                                    sx={{ fontWeight: 700 }}
                                  />
                                </Box>
                              );
                            })()
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#DC2626', mb: 1 }}>
                              Competitor Pitch & Key Strengths:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line' }}>
                              {viewOpp.competitorStrengths || 'No specific competitor strengths logged.'}
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669', mb: 1 }}>
                              Competitor Weaknesses & Our Differentiating Edge:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line' }}>
                              {viewOpp.competitorWeaknesses || 'No specific competitor weaknesses logged.'}
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12}>
                          <Paper sx={{ p: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF', mb: 0.5 }}>
                              Win / Loss Analysis & Client Decision Rationale:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1E3A8A', whiteSpace: 'pre-line' }}>
                              {viewOpp.winLossReason || 'Outcome rationale will be recorded upon deal qualification, closure, or loss.'}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    ) : (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No competitor information logged for this opportunity yet.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenCompetitorDialog(viewOpp)}
                          sx={{ fontWeight: 700 }}
                        >
                          + Add Competitor Intelligence on the Go
                        </Button>
                      </Box>
                    )}
                  </Card>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                p: 2,
                px: 3,
                borderTop: '1px solid #E2E8F0',
                bgcolor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Button variant="outlined" onClick={() => setViewOpp(null)}>
                Close
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<RequestQuoteIcon />}
                  onClick={() => handleOpenQuickQuote(viewOpp)}
                  sx={{
                    background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                    color: '#FFFFFF',
                  }}
                >
                  Quick Quote on the Go
                </Button>
                <Button variant="contained" onClick={() => { handleOpenEditModal(viewOpp); }}>
                  Edit Deal
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>
      )}

      {/* IN-PAGE CREATE / EDIT OPPORTUNITY FORM */}
      {openModal && (
        <Box sx={{ mb: 4 }}>
          {/* Top In-Page Action Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => setOpenModal(false)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Back to Opportunities
              </Button>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {editingId ? `Edit Sales Opportunity: ${formData.opportunityNo || ''}` : 'Create New Sales Opportunity'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingId ? 'Modify deal parameters, products, and linked commercial quotations' : 'Configure lead details, machine models, and initial quotation on the go'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveOpportunity} sx={{ px: 3, fontWeight: 700 }}>
                {editingId ? 'UPDATE OPPORTUNITY' : 'SAVE TO PIPELINE'}
              </Button>
            </Box>
          </Box>

          <Card sx={{ mb: 3, border: '1px solid #E2E8F0' }}>
            <Tabs value={modalTab} onChange={(_, v) => setModalTab(v)} sx={{ bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', px: 2 }}>
              <Tab label="1. Deal & Customer Info" sx={{ fontWeight: 700 }} />
              <Tab label={`2. Machine / Products (${formData.products.length})`} sx={{ fontWeight: 700 }} />
              <Tab label={`3. Commercial Quotations & Revisions (${oppQuotations.length})`} sx={{ fontWeight: 700 }} />
              {editingId && <Tab label={`4. Follow-up Timeline (${oppFollowUps.length})`} sx={{ fontWeight: 700 }} />}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {modalTab === 0 && (
                <Box>
                  {/* Card 1: Deal & Organization Profile (Clean 2-Column Grid) */}
                  <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2.5 }}>
                      1. Opportunity & Client Information
                    </Typography>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Opportunity Name / Requirement Title *"
                          placeholder="e.g. 5-Axis CNC Center for Aerospace Parts"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Principal / Manufacturer Brand *"
                          value={formData.principal}
                          onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                        >
                          {principalOptions.map((p) => (
                            <MenuItem key={p} value={p}>{p}</MenuItem>
                          ))}
                        </TextField>
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
                          {contacts.length === 0 ? (
                            <MenuItem value={1}>Primary Contact</MenuItem>
                          ) : (
                            contacts.map((cnt) => (
                              <MenuItem key={cnt.id} value={cnt.id}>{cnt.contactName}</MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Lead Source"
                          value={formData.leadSource}
                          onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                        >
                          <MenuItem value="Direct Visit">Direct Daily Visit</MenuItem>
                          <MenuItem value="Exhibition / Trade Show">Exhibition / Trade Show</MenuItem>
                          <MenuItem value="OEM Referral">OEM Principal Referral</MenuItem>
                          <MenuItem value="Website / Inbound">Website / Inbound</MenuItem>
                          <MenuItem value="Cold Outreach">Cold Outreach</MenuItem>
                          <MenuItem value="Repeat Order">Repeat Customer Order</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Assigned Salesperson"
                          value={formData.salespersonId}
                          onChange={(e) => setFormData({ ...formData, salespersonId: Number(e.target.value) })}
                        >
                          {employees.map((emp) => (
                            <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Sales Pipeline Stage *"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Total Estimated Deal Value (₹)"
                          value={formData.estimatedValue}
                          onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="Lead Date *"
                          value={formData.leadDate}
                          onChange={(e) => setFormData({ ...formData, leadDate: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="Expected Closure Date"
                          value={formData.expectedClosureDate}
                          onChange={(e) => setFormData({ ...formData, expectedClosureDate: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.isNewClient}
                              onChange={(e) => setFormData({ ...formData, isNewClient: e.target.checked })}
                            />
                          }
                          label="New Client Acquisition (First-time Customer)"
                        />
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Card 2: Technical Scope & Requirements (Full Width) */}
                  <Card sx={{ p: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                      2. Technical Scope & Customer Requirements
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={4}
                          label="Customer Need / Technical Requirement Specifications"
                          placeholder="Workpiece dimensions, material specs, cycle times, machine axis requirements, automation options..."
                          value={formData.requirement}
                          onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </Card>

                  {/* Card 3: Competitor Intelligence & Win/Loss Analysis */}
                  <Card sx={{ p: 3, mt: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                          3. Competitor Intelligence & Win/Loss Analysis
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Record competing machine brands, rival quoted pricing, competitive advantages, and deal outcome rationale.
                        </Typography>
                      </Box>
                      {formData.competitorName && (
                        <Chip
                          label={`Threat: ${formData.threatLevel || 'MEDIUM'}`}
                          size="small"
                          color={formData.threatLevel === 'HIGH' || formData.threatLevel === 'DOMINANT' ? 'error' : formData.threatLevel === 'MEDIUM' ? 'warning' : 'success'}
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Box>

                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Competitor Brand / Company Name"
                          placeholder="e.g. Haas, Mazak, DMG Mori, Siemens, ACE Micromatic"
                          value={formData.competitorName}
                          onChange={(e) => setFormData({ ...formData, competitorName: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Competitor Machine Model / Offering"
                          placeholder="e.g. VF-2SS Super Speed, VTC-530, EcoTurn 450"
                          value={formData.competitorModel}
                          onChange={(e) => setFormData({ ...formData, competitorModel: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Competitor Quoted / Estimated Price (₹)"
                          placeholder="e.g. 3200000"
                          value={formData.competitorPrice}
                          onChange={(e) => setFormData({ ...formData, competitorPrice: e.target.value })}
                        />
                        {formData.competitorPrice && Number(formData.competitorPrice) > 0 && formData.estimatedValue > 0 && (
                          (() => {
                            const comp = Number(formData.competitorPrice);
                            const our = Number(formData.estimatedValue);
                            const diff = our - comp;
                            const pct = Math.round((Math.abs(diff) / comp) * 100);
                            const isLower = diff < 0;
                            return (
                              <Paper sx={{ mt: 1, p: 1, bgcolor: isLower ? '#ECFDF5' : '#FEF3C7', border: `1px solid ${isLower ? '#A7F3D0' : '#FDE68A'}` }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: isLower ? '#065F46' : '#92400E' }}>
                                  {isLower ? `✓ Our Estimated Value is ₹${Math.abs(diff).toLocaleString('en-IN')} (${pct}%) LOWER than competitor` : `⚠️ Our Estimated Value is ₹${diff.toLocaleString('en-IN')} (${pct}%) HIGHER than competitor - Highlight superior performance & warranty`}
                                </Typography>
                              </Paper>
                            );
                          })()
                        )}
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Competitor Threat Level"
                          value={formData.threatLevel || 'MEDIUM'}
                          onChange={(e) => setFormData({ ...formData, threatLevel: e.target.value })}
                        >
                          <MenuItem value="LOW">🟢 Low Threat - We Have Strong Preference</MenuItem>
                          <MenuItem value="MEDIUM">🟡 Medium Threat - Active Evaluation by Client</MenuItem>
                          <MenuItem value="HIGH">🟠 High Threat - Strong Price / Feature Rivalry</MenuItem>
                          <MenuItem value="DOMINANT">🔴 Dominant Threat - Incumbent Supplier</MenuItem>
                        </TextField>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          label="Competitor Key Strengths & Pitch"
                          placeholder="e.g. Lower upfront price, aggressive financing, ready stock..."
                          value={formData.competitorStrengths}
                          onChange={(e) => setFormData({ ...formData, competitorStrengths: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          label="Competitor Weaknesses / Our Winning Edge"
                          placeholder="e.g. Higher power consumption, shorter warranty, no local service center..."
                          value={formData.competitorWeaknesses}
                          onChange={(e) => setFormData({ ...formData, competitorWeaknesses: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          label="Win / Loss Analysis & Client Decision Rationale"
                          placeholder="Detailed reasons why the deal was won or lost vs this competitor..."
                          value={formData.winLossReason}
                          onChange={(e) => setFormData({ ...formData, winLossReason: e.target.value })}
                          helperText="Record decisive factors (Pricing, Lead Time, Technical Specs, Local Service, Brand Trust)"
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}

          {modalTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Opportunity Machine & Product Sub-Grid (Filtered by {formData.principal})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add machines, tooling, and accessories. Line values will automatically compute the deal value.
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleAddProductRow}>
                  Add Machine Line
                </Button>
              </Box>

              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell style={{ width: '35%' }}>Product / Machine Model *</TableCell>
                    <TableCell style={{ width: '15%' }}>Code</TableCell>
                    <TableCell style={{ width: '15%' }}>Principal</TableCell>
                    <TableCell style={{ width: '10%' }}>Quantity</TableCell>
                    <TableCell style={{ width: '12%' }}>Unit Rate (₹)</TableCell>
                    <TableCell style={{ width: '13%' }}>Line Total (₹)</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No machine models added. Click "Add Machine Line" above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.products.map((row: any, index: number) => {
                      const filteredByPrincipal = products.filter(
                        (p) => !p.principal || p.principal.toLowerCase() === formData.principal.toLowerCase()
                      );
                      const availableProds = filteredByPrincipal.length > 0 ? filteredByPrincipal : products;

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={row.productId || ''}
                              onChange={(e) => handleProductRowChange(index, 'productId', Number(e.target.value))}
                            >
                              {availableProds.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={row.productCode || ''}
                              onChange={(e) => handleProductRowChange(index, 'productCode', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={row.principal || formData.principal}
                              onChange={(e) => handleProductRowChange(index, 'principal', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              value={row.quantity}
                              onChange={(e) => handleProductRowChange(index, 'quantity', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              fullWidth
                              size="small"
                              value={row.unitPrice}
                              onChange={(e) => handleProductRowChange(index, 'unitPrice', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            ₹{Math.round(row.totalPrice || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemoveProductRow(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5, bgcolor: '#EEF2FF', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  CALCULATED DEAL ESTIMATED VALUE: ₹
                  {Math.round(
                    formData.products.reduce((s: number, p: any) => s + (parseFloat(p.totalPrice) || 0), 0)
                  ).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          )}

          {modalTab === 2 && (
            <Box>
              {editingId ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QuoteIcon fontSize="small" />
                        Commercial Quotations & Revision History ({oppQuotations.length})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        List, open, and generate revisions (Rev 0, Rev 1, Rev 2) directly inside this opportunity.
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<RequestQuoteIcon />}
                      onClick={() => handleOpenQuickQuote({ ...formData, id: editingId })}
                      sx={{
                        background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                        color: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      + Create Quotation on the Go
                    </Button>
                  </Box>

                  {oppQuotations.length === 0 ? (
                    <Alert severity="info" sx={{ py: 2 }}>
                      No quotations generated for this deal yet. Click <strong>"+ Create Quotation on the Go"</strong> above to generate and link an official quotation with pre-populated products!
                    </Alert>
                  ) : (
                    <Table size="small" border={1} style={{ borderColor: '#E2E8F0', marginBottom: 16 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                          <TableCell>Quote #</TableCell>
                          <TableCell>Revision</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Subtotal (₹)</TableCell>
                          <TableCell align="right">Tax (₹)</TableCell>
                          <TableCell align="right">Total Value (₹)</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Revision Notes</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {oppQuotations.map((q: any) => (
                          <TableRow key={q.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{q.quoteNo}</TableCell>
                            <TableCell>
                              <Chip
                                label={q.versionLabel || `Rev ${q.revisionNo}`}
                                size="small"
                                color={q.revisionNo > 0 ? 'secondary' : 'primary'}
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell>{q.quoteDate ? new Date(q.quoteDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell align="right">₹{parseFloat(q.subtotal || 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell align="right">₹{(parseFloat(q.totalValue || 0) - parseFloat(q.subtotal || 0)).toLocaleString('en-IN')}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                              ₹{parseFloat(q.totalValue || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={q.status}
                                size="small"
                                color={
                                  q.status === 'ACCEPTED'
                                    ? 'success'
                                    : q.status === 'REJECTED'
                                    ? 'error'
                                    : q.status === 'SENT'
                                    ? 'info'
                                    : q.status === 'REVISED'
                                    ? 'default'
                                    : 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180, fontSize: '0.75rem', color: 'text.secondary' }}>
                              {q.notes || '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                                <Tooltip title="Preview & Print Quotation Document">
                                  <IconButton size="small" color="primary" onClick={() => { setPreviewQuote(q); setPreviewQuoteOpen(true); }}>
                                    <EyeIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {q.status !== 'REVISED' && (
                                  <Tooltip title="Create Revision (Rev N+1)">
                                    <IconButton size="small" color="secondary" onClick={() => handleOpenOppRevise(q)}>
                                      <ReviseIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {q.status === 'SENT' && (
                                  <>
                                    <Tooltip title="Accept Quote -> Mark Won">
                                      <IconButton size="small" color="success" onClick={() => handleUpdateOppQuoteStatus(q.id, 'ACCEPTED')}>
                                        <AcceptIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject Quote -> Mark Lost">
                                      <IconButton size="small" color="error" onClick={() => handleUpdateOppQuoteStatus(q.id, 'REJECTED')}>
                                        <RejectIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              ) : (
                <Paper sx={{ p: 3, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    Simultaneous Commercial Quotation Creation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Generate an initial official quotation (Rev 0) concurrently while registering this opportunity.
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0', mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={generateQuoteOnSave}
                          onChange={(e) => setGenerateQuoteOnSave(e.target.checked)}
                          color="secondary"
                        />
                      }
                      label={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Auto-Generate Quotation (Rev 0) upon Saving Opportunity
                        </Typography>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      When checked, the system will instantly create Quote Rev 0 populated with all machine products selected in Tab 2, calculate 18% GST tax, and link it directly to this deal.
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          )}

          {modalTab === 3 && editingId && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Follow-up Activities & Interactions ({oppFollowUps.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Logged customer calls, meetings, technical demos, and action items.
                  </Typography>
                </Box>
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAddFollowUp(editingId)}>
                  + Log Follow-up
                </Button>
              </Box>

              {loadingFollowUps ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Loading follow-up history...</Typography>
                </Box>
              ) : oppFollowUps.length === 0 ? (
                <Alert severity="info" sx={{ py: 2 }}>
                  No follow-ups logged yet for this deal. Click <strong>"+ Log Follow-up"</strong> to record customer discussions and next actions.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {oppFollowUps.map((f: any) => (
                    <Paper
                      key={f.id}
                      sx={{
                        p: 2,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderLeft: `5px solid ${f.status === 'COMPLETED' ? '#10B981' : f.status === 'CANCELLED' ? '#94A3B8' : '#3B82F6'}`,
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {f.nextAction || 'Customer Interaction'}
                          </Typography>
                          <Chip
                            label={f.status}
                            size="small"
                            color={f.status === 'COMPLETED' ? 'success' : f.status === 'CANCELLED' ? 'default' : 'primary'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {f.status !== 'COMPLETED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleToggleFollowUpStatus(f, 'COMPLETED', editingId)}
                              sx={{ fontSize: '0.72rem', py: 0.2, px: 1, textTransform: 'none', fontWeight: 700 }}
                            >
                              ✓ Mark Done
                            </Button>
                          )}
                          {f.status === 'COMPLETED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleToggleFollowUpStatus(f, 'SCHEDULED', editingId)}
                              sx={{ fontSize: '0.72rem', py: 0.2, px: 1, textTransform: 'none', fontWeight: 600 }}
                            >
                              Re-open
                            </Button>
                          )}
                          <Tooltip title="Edit Follow-up">
                            <IconButton size="small" color="primary" onClick={() => handleEditFollowUp(f, editingId)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Follow-up">
                            <IconButton size="small" color="error" onClick={() => handleDeleteFollowUp(f.id, editingId)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, whiteSpace: 'pre-line' }}>
                        {f.notes}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Date:</strong> {f.followUpDate ? new Date(f.followUpDate).toLocaleDateString() : '-'}
                        </Typography>
                        {f.nextFollowUpDate && (
                          <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 700, bgcolor: '#EFF6FF', px: 1, py: 0.3, borderRadius: 1 }}>
                            Next Action Date: {new Date(f.nextFollowUpDate).toLocaleDateString()}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Rep: {f.salesperson?.name || 'Assigned Salesperson'}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            p: 2,
            px: 3,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setModalTab(modalTab > 0 ? modalTab - 1 : 1)}
              disabled={modalTab === 0}
            >
              Back
            </Button>
            {modalTab < (editingId ? 3 : 2) && (
              <Button variant="outlined" onClick={() => setModalTab(modalTab + 1)}>
                Next
              </Button>
            )}
            <Button variant="contained" color="primary" onClick={handleSaveOpportunity}>
              {editingId ? 'UPDATE OPPORTUNITY' : 'SAVE TO PIPELINE'}
            </Button>
          </Box>
        </Box>
          </Card>
        </Box>
      )}

      {/* LOG FOLLOW-UP MODAL */}
      <Dialog
        open={followUpDialogOpen}
        onClose={() => setFollowUpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box
          sx={{
            p: 2.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {editingFollowUpId ? 'Edit Follow-up Activity' : 'Log Follow-up Activity'}
          </Typography>
          <IconButton onClick={() => setFollowUpDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Follow-up Date *"
                value={followUpForm.followUpDate}
                onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Next Action Planned"
                value={followUpForm.nextAction}
                onChange={(e) => setFollowUpForm({ ...followUpForm, nextAction: e.target.value })}
              >
                <MenuItem value="Follow-up Call">Follow-up Phone Call</MenuItem>
                <MenuItem value="Send Quotation">Send Official / Revised Quotation</MenuItem>
                <MenuItem value="Email Follow-up">Follow-up Email</MenuItem>
                <MenuItem value="WhatsApp Follow-up">WhatsApp / Message Follow-up</MenuItem>
                <MenuItem value="Online Meeting">Virtual / Online Meeting</MenuItem>
                <MenuItem value="Price Negotiation">Price & Commercial Negotiation</MenuItem>
                <MenuItem value="Contract Review">Contract / PO Review</MenuItem>
                <MenuItem value="Payment Follow-up">Payment / Advance Follow-up</MenuItem>
                <MenuItem value="Final Order Close">Final Order Sign-off</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Next Follow-up Date"
                value={followUpForm.nextFollowUpDate}
                onChange={(e) => setFollowUpForm({ ...followUpForm, nextFollowUpDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Activity Status"
                value={followUpForm.status || 'SCHEDULED'}
                onChange={(e) => setFollowUpForm({ ...followUpForm, status: e.target.value })}
              >
                <MenuItem value="SCHEDULED">Scheduled / In-Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Discussion Notes & Customer Feedback *"
                placeholder="Details of conversation, customer objections, competitor status..."
                value={followUpForm.notes}
                onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            p: 2,
            px: 3,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button onClick={() => setFollowUpDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFollowUp}>
            {editingFollowUpId ? 'UPDATE FOLLOW-UP' : 'SAVE FOLLOW-UP'}
          </Button>
        </Box>
      </Dialog>

      {/* COMPETITOR INTELLIGENCE ON THE GO MODAL */}
      <Dialog
        open={competitorDialogOpen}
        onClose={() => setCompetitorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box
          sx={{
            p: 2.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚡ Competitor Intelligence on the Go
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Target Deal: {competitorTargetOpp?.opportunityNo} — {competitorTargetOpp?.name}
            </Typography>
          </Box>
          <IconButton onClick={() => setCompetitorDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Competitor Brand / Maker Name *"
                placeholder="e.g. Haas, Mazak, DMG Mori, Siemens"
                value={competitorForm.competitorName}
                onChange={(e) => setCompetitorForm({ ...competitorForm, competitorName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Competitor Machine Model / Offering"
                placeholder="e.g. VF-2SS, Integrex, etc."
                value={competitorForm.competitorModel}
                onChange={(e) => setCompetitorForm({ ...competitorForm, competitorModel: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Competitor Quoted / Benchmark Price (₹)"
                placeholder="e.g. 3200000"
                value={competitorForm.competitorPrice}
                onChange={(e) => setCompetitorForm({ ...competitorForm, competitorPrice: e.target.value })}
              />
              {competitorForm.competitorPrice && Number(competitorForm.competitorPrice) > 0 && competitorTargetOpp?.estimatedValue > 0 && (
                (() => {
                  const comp = Number(competitorForm.competitorPrice);
                  const our = Number(competitorTargetOpp.estimatedValue);
                  const diff = our - comp;
                  const pct = Math.round((Math.abs(diff) / comp) * 100);
                  const isLower = diff < 0;
                  return (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={isLower ? `₹${Math.abs(diff).toLocaleString('en-IN')} (${pct}%) LOWER` : `₹${diff.toLocaleString('en-IN')} (${pct}%) HIGHER`}
                        size="small"
                        color={isLower ? 'success' : 'warning'}
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        vs Our Est Value (₹{Math.round(our).toLocaleString('en-IN')})
                      </Typography>
                    </Box>
                  );
                })()
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Threat Level"
                value={competitorForm.threatLevel || 'MEDIUM'}
                onChange={(e) => setCompetitorForm({ ...competitorForm, threatLevel: e.target.value })}
              >
                <MenuItem value="LOW">Low (Weak competitor offering)</MenuItem>
                <MenuItem value="MEDIUM">Medium (Competitive alternative)</MenuItem>
                <MenuItem value="HIGH">High (Primary aggressive threat)</MenuItem>
                <MenuItem value="DOMINANT">Dominant (Incumbent client favorite)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Competitor Pitch & Key Strengths"
                placeholder="What pitch is the competitor making to the client?"
                value={competitorForm.competitorStrengths}
                onChange={(e) => setCompetitorForm({ ...competitorForm, competitorStrengths: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Competitor Weaknesses & Our Edge"
                placeholder="Where does our machine/service outperform them?"
                value={competitorForm.competitorWeaknesses}
                onChange={(e) => setCompetitorForm({ ...competitorForm, competitorWeaknesses: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Win / Loss Analysis & Outcome Rationale"
                placeholder="Decision notes or why client made this choice..."
                value={competitorForm.winLossReason}
                onChange={(e) => setCompetitorForm({ ...competitorForm, winLossReason: e.target.value })}
              />
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            p: 2,
            px: 3,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            {competitorTargetOpp?.competitorName && (
              <Button color="error" onClick={() => handleClearCompetitorIntel(competitorTargetOpp.id)}>
                Clear Competitor
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setCompetitorDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveCompetitorIntel} sx={{ fontWeight: 700 }}>
              SAVE COMPETITOR INTEL
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* IN-OPPORTUNITY REVISION MODAL */}
      <Dialog
        open={oppReviseDialogOpen}
        onClose={() => setOppReviseDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <Box
          sx={{
            p: 2.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Create Revision for {oppBaseQuoteForRev?.quoteNo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current version: {oppBaseQuoteForRev?.versionLabel}
            </Typography>
          </Box>
          <IconButton onClick={() => setOppReviseDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
            Generates <strong>Rev {(oppBaseQuoteForRev?.revisionNo || 0) + 1}</strong> with cloned machines & pricing.
          </Alert>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={4}
            label="Revision Reason / Commercial Modification Notes *"
            placeholder="e.g. Revised quote after technical review: added 5% festive discount and updated tooling accessories."
            value={oppReviseNotes}
            onChange={(e) => setOppReviseNotes(e.target.value)}
          />
        </Box>
        <Box
          sx={{
            p: 2,
            px: 3,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button onClick={() => setOppReviseDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleExecuteOppRevision}>
            CONFIRM & CREATE REVISION
          </Button>
        </Box>
      </Dialog>

      {/* QUICK QUOTATION GENERATOR ON THE GO MODAL */}
      <Dialog
        open={quickQuoteOpen}
        onClose={() => setQuickQuoteOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '92vh',
            overflowX: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            p: 2.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RequestQuoteIcon color="secondary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Generate Commercial Quotation on the Go
            </Typography>
            {quickQuoteOpp && (
              <Chip
                label={`${quickQuoteOpp.opportunityNo} (Rev 0)`}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
          <IconButton onClick={() => setQuickQuoteOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', p: { xs: 2, sm: 3 } }}>
          {quickQuoteOpp && (
            <Box>
              {/* Reference Header */}
              <Grid container spacing={2} sx={{ mb: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Customer Client:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.95rem' }}>
                    {quickQuoteOpp.customer?.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Contact Person:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                    {quickQuoteOpp.contact?.contactName || 'Primary Point of Contact'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Deal Subject:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {quickQuoteOpp.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Quotation Date *"
                    value={quickQuoteForm.quoteDate}
                    onChange={(e) => setQuickQuoteForm({ ...quickQuoteForm, quoteDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Offer Validity (Days)"
                    value={quickQuoteForm.validityDays}
                    onChange={(e) => setQuickQuoteForm({ ...quickQuoteForm, validityDays: Number(e.target.value) })}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Overall Commercial Discount (%)"
                    value={quickQuoteForm.discountPercent}
                    onChange={(e) => setQuickQuoteForm({ ...quickQuoteForm, discountPercent: Number(e.target.value) })}
                    sx={{ bgcolor: '#FFFFFF' }}
                  />
                </Grid>
              </Grid>

              {/* Line Items Sub-Grid */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Quotation Line Items ({quickQuoteForm.items.length})
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const firstProd = products.find((p: any) => p.principal === quickQuoteOpp?.principal) || products[0];
                    const newItem = {
                      productId: firstProd?.id || null,
                      productName: firstProd?.name || 'Standard Product',
                      productCode: firstProd?.code || 'PRD-STD',
                      principal: firstProd?.principal || quickQuoteOpp?.principal || 'General',
                      quantity: 1,
                      unitPrice: firstProd?.unitPrice != null ? Number(firstProd.unitPrice) : 0,
                      discountPercent: 0,
                      totalPrice: firstProd?.unitPrice != null ? Number(firstProd.unitPrice) : 0,
                    };
                    setQuickQuoteForm({ ...quickQuoteForm, items: [...quickQuoteForm.items, newItem] });
                  }}
                >
                  Add Item Line
                </Button>
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5, mb: 2.5, overflowX: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#334155', py: 1.2 }}>Product / Machinery Model</TableCell>
                      <TableCell align="center" sx={{ width: 120, fontWeight: 700, color: '#334155' }}>Principal</TableCell>
                      <TableCell align="center" sx={{ width: 90, fontWeight: 700, color: '#334155' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ width: 150, fontWeight: 700, color: '#334155' }}>Unit Rate (₹)</TableCell>
                      <TableCell align="center" sx={{ width: 95, fontWeight: 700, color: '#334155' }}>Disc %</TableCell>
                      <TableCell align="right" sx={{ width: 150, fontWeight: 700, color: '#334155' }}>Net Amount (₹)</TableCell>
                      <TableCell align="center" sx={{ width: 50, fontWeight: 700, color: '#334155' }}>Del</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quickQuoteForm.items.map((it: any, idx: number) => (
                      <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ minWidth: 260 }}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={it.productId || ''}
                            onChange={(e) => handleQuickQuoteItemChange(idx, 'productId', e.target.value)}
                            sx={{ bgcolor: '#FFFFFF' }}
                          >
                            <MenuItem value="">-- Select Master Product --</MenuItem>
                            {products.map((p: any) => (
                              <MenuItem key={p.id} value={p.id}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                                  <Chip
                                    label={p.code || 'PRD'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                  />
                                </Box>
                              </MenuItem>
                            ))}
                          </TextField>
                          {it.productCode && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.4, fontSize: '0.72rem' }}>
                              OEM Code: <strong>{it.productCode}</strong>
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>
                          <Chip
                            label={it.principal || 'General'}
                            size="small"
                            sx={{ fontWeight: 600, bgcolor: '#F1F5F9', color: '#1E293B', fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ width: 90 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={it.quantity}
                            onChange={(e) => handleQuickQuoteItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                            inputProps={{ min: 1, style: { textAlign: 'center', padding: '6px 4px' } }}
                            sx={{ width: 75, bgcolor: '#FFFFFF' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 150 }}>
                          <Box sx={{ textAlign: 'right', pr: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                              ₹{Number(it.unitPrice || 0).toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem', display: 'block' }}>
                              Locked from Masters
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ width: 95 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={it.discountPercent}
                            onChange={(e) => handleQuickQuoteItemChange(idx, 'discountPercent', Math.max(0, Math.min(100, Number(e.target.value))))}
                            inputProps={{ min: 0, max: 100, style: { textAlign: 'center', padding: '6px 4px' } }}
                            sx={{ width: 75, bgcolor: '#FFFFFF' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 150 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textAlign: 'right', whiteSpace: 'nowrap', pr: 0.5 }}>
                            ₹{Math.round(it.totalPrice || 0).toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ width: 50 }}>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={quickQuoteForm.items.length <= 1}
                            onClick={() => {
                              const filtered = quickQuoteForm.items.filter((_: any, i: number) => i !== idx);
                              setQuickQuoteForm({ ...quickQuoteForm, items: filtered });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Live Financial Totals */}
              {(() => {
                const totals = calculateQuickQuoteTotals();
                return (
                  <Paper sx={{ p: 2, bgcolor: '#EEF2FF', borderRadius: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Item Subtotal:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          ₹{Math.round(totals.subtotal).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Discount Applied:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                          - ₹{Math.round(totals.subtotal - totals.discountedSubtotal).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">GST Tax (18%):</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          ₹{Math.round(totals.taxAmount).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Grand Quote Total:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
                          ₹{Math.round(totals.grandTotal).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })()}

              {/* Terms and Notes */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    label="Offer Notes"
                    value={quickQuoteForm.notes}
                    onChange={(e) => setQuickQuoteForm({ ...quickQuoteForm, notes: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    label="Commercial Terms & Conditions"
                    value={quickQuoteForm.termsAndConditions}
                    onChange={(e) => setQuickQuoteForm({ ...quickQuoteForm, termsAndConditions: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            p: 2,
            px: 3,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Button onClick={() => setQuickQuoteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<RequestQuoteIcon />}
            onClick={handleSaveQuickQuote}
            sx={{
              background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              px: 3,
            }}
          >
            GENERATE & SAVE QUOTATION (REV 0)
          </Button>
        </Box>
      </Dialog>

      {/* PRINTABLE QUOTATION DOCUMENT PREVIEW DIALOG */}
      <Dialog
        open={previewQuoteOpen}
        onClose={() => setPreviewQuoteOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box
          className="no-print"
          sx={{
            p: 2.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Commercial Quotation Document Preview
            </Typography>
            {previewQuote && (
              <Chip
                label={previewQuote.versionLabel || `Rev ${previewQuote.revisionNo}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print Document
            </Button>
            <IconButton onClick={() => setPreviewQuoteOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {previewQuote && (
            <Paper className="printable-quotation-sheet" sx={{ p: 4, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2 }}>
              {/* Letterhead */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #3B82F6', pb: 2, mb: 3 }}>
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
                    Quote No: {previewQuote.quoteNo}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Revision: {previewQuote.versionLabel || `Rev ${previewQuote.revisionNo}`} | Date: {previewQuote.quoteDate ? new Date(previewQuote.quoteDate).toLocaleDateString() : '-'}
                  </Typography>
                  <Typography variant="caption" display="block" color="error.main" sx={{ fontWeight: 600 }}>
                    Valid Until: {previewQuote.validityDate ? new Date(previewQuote.validityDate).toLocaleDateString() : '30 Days'}
                  </Typography>
                </Box>
              </Box>

              {/* Customer & Buyer Section */}
              <Grid container spacing={2} sx={{ mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    QUOTATION PREPARED FOR:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {previewQuote.customer?.name || viewOpp?.customer?.name}
                  </Typography>
                  <Typography variant="body2">
                    Attn: {previewQuote.contact?.contactName || viewOpp?.contact?.contactName || 'Purchasing Department'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Phone: {previewQuote.contact?.mobileNo || viewOpp?.contact?.mobileNo || '-'} | Email: {previewQuote.contact?.email || viewOpp?.contact?.email || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    SALES ENGINEER & BRANCH:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {previewQuote.salesperson?.name || user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Branch: {user?.branch || 'Mumbai HQ'} | Email: {previewQuote.salesperson?.email || user?.email}
                  </Typography>
                </Grid>
              </Grid>

              {/* Competitor Benchmark Comparison (Prints with Quotation) */}
              {(previewQuote?.opportunity?.competitorName || viewOpp?.competitorName) && (
                (() => {
                  const compName = previewQuote.opportunity?.competitorName || viewOpp?.competitorName;
                  const compModel = previewQuote.opportunity?.competitorModel || viewOpp?.competitorModel;
                  const compPrice = previewQuote.opportunity?.competitorPrice || viewOpp?.competitorPrice;
                  const threat = previewQuote.opportunity?.threatLevel || viewOpp?.threatLevel;
                  const strengths = previewQuote.opportunity?.competitorStrengths || viewOpp?.competitorStrengths;
                  const totalVal = parseFloat(previewQuote.totalValue || 0);

                  return (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ⚡ Competitor Intelligence Benchmark: {compName} {compModel ? `(${compModel})` : ''}
                        </Typography>
                        {threat && (
                          <Chip
                            label={`Threat: ${threat}`}
                            size="small"
                            color={threat === 'HIGH' || threat === 'DOMINANT' ? 'error' : threat === 'MEDIUM' ? 'warning' : 'success'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">Competitor Quoted / Benchmark:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#DC2626' }}>
                            {compPrice ? `₹${parseFloat(compPrice).toLocaleString('en-IN')}` : 'Not Specified'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">Our Net Quotation Total:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ₹{Math.round(totalVal).toLocaleString('en-IN')}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">Price Variance / Value Edge:</Typography>
                          {compPrice ? (
                            (() => {
                              const comp = parseFloat(compPrice);
                              const diff = totalVal - comp;
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
                      {strengths && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          <strong>Competitor Pitch / Strengths:</strong> {strengths}
                        </Typography>
                      )}
                    </Paper>
                  );
                })()
              )}

              {/* Items Table */}
              <Table size="small" border={1} style={{ borderColor: '#CBD5E1', marginBottom: 16 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                    <TableCell sx={{ fontWeight: 700, width: 40 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description / Machine Model</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Principal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Rate (₹)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total Amount (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewQuote.items && previewQuote.items.length > 0 ? (
                    previewQuote.items.map((it: any, i: number) => (
                      <TableRow key={it.id || i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{it.productName}</TableCell>
                        <TableCell>{it.principal || '-'}</TableCell>
                        <TableCell align="right">{it.quantity}</TableCell>
                        <TableCell align="right">₹{parseFloat(it.unitPrice || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>₹{parseFloat(it.totalPrice || 0).toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No items listed</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Breakup Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Box sx={{ width: 300 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Item Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{parseFloat(previewQuote.subtotal || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Applicable GST (18%):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{(parseFloat(previewQuote.totalValue || 0) - parseFloat(previewQuote.subtotal || 0)).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>GRAND TOTAL:</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      ₹{parseFloat(previewQuote.totalValue || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Terms & Conditions */}
              {previewQuote.termsAndConditions && (
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 1.5, borderLeft: '4px solid #3B82F6' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }} display="block">
                    COMMERCIAL TERMS & CONDITIONS:
                  </Typography>
                  <Typography variant="caption" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                    {previewQuote.termsAndConditions}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>

        <Box
          className="no-print"
          sx={{
            p: 2,
            px: 3,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          <Button variant="outlined" onClick={() => setPreviewQuoteOpen(false)}>
            Close Preview
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};
