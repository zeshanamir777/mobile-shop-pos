export interface Product {
  id?: number;
  name: string;
  brand?: string;
  category?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
}

