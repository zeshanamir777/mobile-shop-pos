import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private db: DatabaseService) {}

  async getAllProducts(): Promise<Product[]> {
    const result = await this.db.query('SELECT * FROM products ORDER BY name');
    return result.success ? result.data : [];
  }

  async getProductById(id: number): Promise<Product | null> {
    const result = await this.db.query('SELECT * FROM products WHERE id = ?', [id]);
    return result.success && result.data.length > 0 ? result.data[0] : null;
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const result = await this.db.query('SELECT * FROM products WHERE barcode = ?', [barcode]);
    return result.success && result.data.length > 0 ? result.data[0] : null;
  }

  async addProduct(product: Product): Promise<boolean> {
    const result = await this.db.query(
      `INSERT INTO products (name, brand, category, purchase_price, selling_price, stock_quantity, barcode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.brand || null,
        product.category || null,
        product.purchase_price,
        product.selling_price,
        product.stock_quantity || 0,
        product.barcode || null
      ]
    );
    return result.success;
  }

  async updateProduct(id: number, product: Product): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE products SET name = ?, brand = ?, category = ?, purchase_price = ?, 
       selling_price = ?, stock_quantity = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        product.name,
        product.brand || null,
        product.category || null,
        product.purchase_price,
        product.selling_price,
        product.stock_quantity,
        product.barcode || null,
        id
      ]
    );
    return result.success;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await this.db.query('DELETE FROM products WHERE id = ?', [id]);
    return result.success;
  }

  async updateStock(id: number, quantity: number): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
      [quantity, id]
    );
    return result.success;
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const result = await this.db.query(
      'SELECT * FROM products WHERE stock_quantity <= ? ORDER BY stock_quantity',
      [threshold]
    );
    return result.success ? result.data : [];
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    const result = await this.db.query(
      'SELECT * FROM products WHERE stock_quantity = 0 ORDER BY name'
    );
    return result.success ? result.data : [];
  }
}

