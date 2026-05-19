// src/types/models.ts

import { Role } from './roles';

export interface User {
  id:        string;
  username:  string;
  email:     string;
  fullName:  string;
  role:      Role;
  isActive:  boolean;
  createdAt: string;
}

export interface Product {
  id:        string;
  code:      string;
  name:      string;
  unit:      string;
  category?: string;
  minStock:  number;
  isActive:  boolean;
}

export interface InventoryPeriod {
  id:       string;
  year:     number;
  month:    number;
  isClosed: boolean;
}

export interface InventoryBalance {
  id:           string;
  periodId:     string;
  productId:    string;
  openingQty:   number;
  closingQty:   number;
  product:      Product;
  status?:      'OK' | 'MID' | 'LOW';
}

export type ReceiptStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReceiptItem {
  id:         string;
  productId:  string;
  quantity:   number;
  unitPrice:  number;
  totalValue: number;
  product:    Product;
}

export interface Receipt {
  id:          string;
  receiptNo:   string;
  receiptDate: string;
  supplier?:   string;
  note?:       string;
  status:      ReceiptStatus;
  createdBy:   { fullName: string; role: Role };
  approvedBy?: { fullName: string };
  approvedAt?: string;
  createdAt:   string;
  items:       ReceiptItem[];
}

export type IssueStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'REJECTED';

export interface IssueItem {
  id:           string;
  productId:    string;
  requestedQty: number;
  actualQty?:   number;
  unitPrice:    number;
  product:      Product;
}

export interface Issue {
  id:           string;
  issueNo:      string;
  issueDate:    string;
  recipient?:   string;
  department?:  string;
  note?:        string;
  status:       IssueStatus;
  createdBy:    { fullName: string; role: Role };
  approvedBy?:  { fullName: string };
  confirmedBy?: { fullName: string };
  confirmedAt?: string;
  createdAt:    string;
  items:        IssueItem[];
}

export interface ApiList<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface InventorySummary {
  totalProducts:   number;
  lowStockCount:   number;
  pendingReceipts: number;
  pendingIssues:   number;
}

export type IssueRequestStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface IssueRequestItem {
  id: string;
  productId: string;
  requestedQty: number;
  note?: string;
  product: Product;
}

export interface IssueRequest {
  id: string;
  requestNo: string;
  requestDate: string;
  reason: string;
  note?: string;
  status: IssueRequestStatus;
  requestedBy: { fullName: string; role: Role };
  reviewedBy?: { fullName: string };
  reviewedAt?: string;
  rejectReason?: string;
  issue?: { id: string; issueNo: string };
  items: IssueRequestItem[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'ISSUE_REQUEST_NEW' | 'ISSUE_REQUEST_APPROVED' | 'ISSUE_REQUEST_REJECTED';
  title: string;
  message: string;
  isRead: boolean;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}
