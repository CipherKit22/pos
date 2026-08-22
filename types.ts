
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_deleted?: boolean;
}

export type PaymentType = 'CASH' | 'KBZPAY' | 'WAVEPAY' | 'AYAPAY';

export interface Sale {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  total: number;
  payment_type: PaymentType;
  cash_amount: number; 
  mobile_money_amount: number; 
  created_at: string;
  
  cash_received?: number;
  change_amount?: number;
  
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id?: string;
  sale_id: string;
  product_id: string;
  qty: number;
  price: number;
  product?: Product;
}

export interface CartItem extends Product {
  qty: number;
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export enum AdminTab {
  OVERVIEW = 'overview',
  SALES = 'sales',
  PRODUCTS = 'products',
  PAYMENTS = 'payments'
}
