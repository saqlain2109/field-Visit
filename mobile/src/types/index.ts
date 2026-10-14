export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_EXEC' | 'SERVICE_ENG';

export interface User {
  id: number;
  employeeNo: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: string; // GRADE_A, GRADE_B, etc.
  mobileNo?: string;
  status?: string;
  departmentId?: number;
  departmentName?: string;
  branchId?: number;
  branchName?: string;
  allowedRegions?: string;
  allowedRadiusKm?: number;
  allowedLatitude?: number;
  allowedLongitude?: number;
  branch?: {
    id: number;
    code: string;
    name: string;
    city?: string;
  };
  department?: {
    id: number;
    code: string;
    name: string;
  };
  designation?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface RolePreset {
  id: string;
  role: UserRole;
  title: string;
  name: string;
  email: string;
  password: string;
  badgeColor: string;
}

export interface ActivityType {
  id: number;
  code: string;
  name: string;
  category?: string;
  isActive?: boolean;
}

export interface ProductMaster {
  id: number;
  code: string;
  name: string;
  modelNumber?: string;
  description?: string;
  unitPrice?: number;
  basePrice?: number;
  category?: string;
  isActive?: boolean;
}

export interface ExpenseHead {
  id: number;
  code: string;
  name: string;
  category?: string;
  requiresKmCalculation?: boolean;
  requiresApproval?: boolean;
  requiresAttachment?: boolean;
  isActive?: boolean;
}

export interface GradeFuelRate {
  id: number;
  gradeCode: string;
  gradeName?: string;
  fuelRate: number;
  twoWheelerRate?: number;
  fourWheelerRate?: number;
  effectiveDate?: string;
}

export interface Customer {
  id: number;
  code?: string;
  name: string;
  customerType: string; // Direct / OEM / Tier-1 / Dealer
  industry?: string;
  city?: string;
  state?: string;
  address?: string;
  contactPersonPrimary?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  status: string;
  source?: string;
}

export interface Contact {
  id: number;
  customerId: number;
  name: string;
  designation?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  department?: string;
  isPrimary?: boolean;
}

export interface ExpenseClaimItem {
  id?: number;
  expenseHeadId: number;
  expenseHeadName?: string;
  dayStartKm?: number;
  dayEndKm?: number;
  totalKm?: number;
  fuelRate?: number;
  amount: number;
  tollTax?: number;
  hotelExpenses?: number;
  foodExpenses?: number;
  remarks?: string;
}

export interface DailyVisit {
  id: number;
  visitDate: string;
  employeeId: number;
  employeeName?: string;
  employeeGrade?: string;
  customerId: number;
  customer?: Customer;
  contactId?: number;
  contact?: Contact;
  activityTypeId: number;
  activityType?: ActivityType;
  productId?: number;
  product?: ProductMaster;
  placeFrom: string;
  placeTo: string;
  startTime: string;
  endTime: string;
  personCount: number;
  remarks?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  approvalRemarks?: string;
  expenses: ExpenseClaimItem[];
  totalClaimAmount?: number;
}

export interface Opportunity {
  id: number;
  opportunityNo?: string;
  title: string;
  customerId: number;
  customerName?: string;
  customer?: Customer;
  expectedValue: number;
  currency?: string;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  expectedCloseDate: string;
  nextActionPlanned?: string;
  nextActionDate?: string;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
  remarks?: string;
  status?: string;
}

export interface QuotationItem {
  id?: number;
  productId: number;
  productName?: string;
  modelNumber?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  totalPrice: number;
}

export interface Quotation {
  id: number;
  quotationNo: string;
  quotationDate: string;
  validUntil?: string;
  customerId: number;
  customerName?: string;
  customer?: Customer;
  opportunityId?: number;
  subTotal: number;
  discountAmount?: number;
  taxAmount?: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Expired';
  items: QuotationItem[];
}

export interface DashboardStats {
  totalVisits: number;
  approvedVisits: number;
  pendingApprovals: number;
  rejectedVisits: number;
  totalClaimAmount: number;
  totalKmTravelled: number;
  totalOpportunities: number;
  pipelineValue: number;
}
