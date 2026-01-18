export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ADMINHOUSE = 'admin_house'  
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  houseId: string;
}

export interface Employee {
  id: string;
  fullName: string;
  documentId: string;
  phone?: string;
  address?: string;
  position?: string;
  baseSalary: number;
  isActive: boolean;
  createdAt: Date;
  houseId: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  COMPLETED = 'completed'
}

export interface Payment {
  id: string;
  employee: Employee;
  employer: User;
  paymentDate: Date;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  totalAmount: number;
  notes?: string;
  status: PaymentStatus;
  digitalSignature?: string;
  signedDocumentUrl?: string;
  signedAt?: Date;
  createdAt: Date;
  houseId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  houseId: string;
}

export interface MarketExpense {
  id: string;
  date: Date;
  place: string;
  amount: number;
  notes?: string;
  category?: string;
  responsible: User;
  responsibleId: string;
  createdBy: User;
  createdById: string;
  createdAt: Date;
  houseId: string;
}

export interface MarketExpenseStats {
  month: number;
  year: number;
  total: number;
  count: number;
  byResponsible: Array<{ name: string; total: number; count: number }>;
  byPlace: Array<{ place: string; total: number; count: number }>;
}

export interface HouseStats {
  usersCount: number;
  employeesCount: number;
  paymentsCount: number;
}

export interface House {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  stats?: HouseStats;
  users?: User;
  employees?: Employee;
  payments?: Payment;
  categories?: Category;
  marketExpenses?: MarketExpense;
  createdAt: string;
  updatedAt: string;
}