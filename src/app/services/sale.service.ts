import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Sale, SaleItem, CartItem } from '../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  constructor(private db: DatabaseService) {}

  async createSale(sale: Sale, items: SaleItem[]): Promise<boolean> {
    try {
      // Insert sale
      const saleResult = await this.db.query(
        `INSERT INTO sales (invoice_number, customer_id, total_amount, discount, payment_method, profit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sale.invoice_number,
          sale.customer_id || null,
          sale.total_amount,
          sale.discount || 0,
          sale.payment_method,
          sale.profit || 0
        ]
      );

      if (!saleResult.success) return false;

      const saleId = saleResult.data.lastInsertRowid;

      // Insert sale items and update stock
      for (const item of items) {
        await this.db.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, price, total, profit)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saleId, item.product_id, item.quantity, item.price, item.total, item.profit || 0]
        );

        // Update product stock
        await this.db.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      return true;
    } catch (error) {
      console.error('Create sale error:', error);
      return false;
    }
  }

  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
  }

  async getSalesByDate(date: string): Promise<Sale[]> {
    const result = await this.db.query(
      `SELECT * FROM sales WHERE DATE(created_at) = ? ORDER BY created_at DESC`,
      [date]
    );
    return result.success ? result.data : [];
  }

  async getSalesByMonth(year: number, month: number): Promise<Sale[]> {
    const result = await this.db.query(
      `SELECT * FROM sales WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
       ORDER BY created_at DESC`,
      [year.toString(), month.toString().padStart(2, '0')]
    );
    return result.success ? result.data : [];
  }

  async getSaleById(id: number): Promise<Sale | null> {
    const result = await this.db.query('SELECT * FROM sales WHERE id = ?', [id]);
    return result.success && result.data.length > 0 ? result.data[0] : null;
  }

  async getSaleItems(saleId: number): Promise<SaleItem[]> {
    const result = await this.db.query(
      `SELECT si.*, p.name as product_name, p.barcode
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [saleId]
    );
    return result.success ? result.data : [];
  }

  async getLastSale(): Promise<Sale | null> {
    const result = await this.db.query(
      'SELECT * FROM sales ORDER BY id DESC LIMIT 1'
    );
    return result.success && result.data.length > 0 ? result.data[0] : null;
  }

  calculateProfit(cartItems: CartItem[]): number {
    return cartItems.reduce((total, item) => total + item.profit, 0);
  }
}

