export interface Sale {
  id?: number;
  invoice_number: string;
  customer_id?: number;
  total_amount: number;
  discount?: number;
  payment_method: string;
  profit?: number;
  created_at?: string;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  profit?: number;
  product?: any;
}

export interface CartItem {
  product: any;
  quantity: number;
  price: number;
  total: number;
  profit: number;
}

