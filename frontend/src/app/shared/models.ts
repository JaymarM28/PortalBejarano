export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
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
}

export interface MarketExpenseStats {
  month: number;
  year: number;
  total: number;
  count: number;
  byResponsible: Array<{ name: string; total: number; count: number }>;
  byPlace: Array<{ place: string; total: number; count: number }>;
}
