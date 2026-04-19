export interface BusinessProfile {
  businessName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  logoUrl?: string;
  createdAt?: any;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  gstRate: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerAddress?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  status: 'paid' | 'unpaid' | 'partial';
  paymentMethod: 'cash' | 'upi' | 'bank';
  creatorId: string;
  createdAt: any;
  notes?: string;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  creatorId: string;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  gstRate: number;
  creatorId: string;
}
