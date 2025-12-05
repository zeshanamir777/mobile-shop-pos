import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private db: DatabaseService) {}

  async getAllCustomers(): Promise<Customer[]> {
    const result = await this.db.query('SELECT * FROM customers ORDER BY name');
    return result.success ? result.data : [];
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    const result = await this.db.query('SELECT * FROM customers WHERE id = ?', [id]);
    return result.success && result.data.length > 0 ? result.data[0] : null;
  }

  async addCustomer(customer: Customer): Promise<boolean> {
    const result = await this.db.query(
      'INSERT INTO customers (name, phone, credit_balance) VALUES (?, ?, ?)',
      [customer.name, customer.phone || null, customer.credit_balance || 0]
    );
    return result.success;
  }

  async updateCustomer(id: number, customer: Customer): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE customers SET name = ?, phone = ?, credit_balance = ? WHERE id = ?',
      [customer.name, customer.phone || null, customer.credit_balance || 0, id]
    );
    return result.success;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await this.db.query('DELETE FROM customers WHERE id = ?', [id]);
    return result.success;
  }

  async getCustomerPurchases(customerId: number): Promise<any[]> {
    const result = await this.db.query(
      `SELECT s.*, COUNT(si.id) as item_count
       FROM sales s
       LEFT JOIN sale_items si ON s.id = si.sale_id
       WHERE s.customer_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [customerId]
    );
    return result.success ? result.data : [];
  }
}

