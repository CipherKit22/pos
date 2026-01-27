
export interface Product {
  id: string;
  name: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  image_url: string | null;
}

export type PaymentType = 'CASH' | 'KPAY' | 'MIXED' | 'CASH_WITH_KPAY_CHANGE';

export interface Sale {
  id: string;
  total: number;
  profit: number;
  payment_type: PaymentType;
  cash_amount: number; // Net cash (Received - Change)
  kpay_amount: number; // Net kpay (Received - Change)
  created_at: string;
  
  // New Fields
  cash_received?: number;
  kpay_received?: number;
  change_amount?: number;
  change_method?: 'CASH' | 'KPAY' | null;
  
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
