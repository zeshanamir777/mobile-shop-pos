import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  constructor(private db: DatabaseService) {}

  async getAllExpenses(): Promise<Expense[]> {
    const result = await this.db.query('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    return result.success ? result.data : [];
  }

  async getExpensesByDate(date: string): Promise<Expense[]> {
    const result = await this.db.query(
      'SELECT * FROM expenses WHERE date = ? ORDER BY created_at DESC',
      [date]
    );
    return result.success ? result.data : [];
  }

  async getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
    const result = await this.db.query(
      `SELECT * FROM expenses WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
       ORDER BY date DESC`,
      [year.toString(), month.toString().padStart(2, '0')]
    );
    return result.success ? result.data : [];
  }

  async addExpense(expense: Expense): Promise<boolean> {
    const result = await this.db.query(
      'INSERT INTO expenses (category, amount, description, date) VALUES (?, ?, ?, ?)',
      [expense.category, expense.amount, expense.description || null, expense.date]
    );
    return result.success;
  }

  async updateExpense(id: number, expense: Expense): Promise<boolean> {
    const result = await this.db.query(
      'UPDATE expenses SET category = ?, amount = ?, description = ?, date = ? WHERE id = ?',
      [expense.category, expense.amount, expense.description || null, expense.date, id]
    );
    return result.success;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await this.db.query('DELETE FROM expenses WHERE id = ?', [id]);
    return result.success;
  }

  async getTotalExpensesByDate(date: string): Promise<number> {
    const result = await this.db.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?',
      [date]
    );
    return result.success && result.data.length > 0 ? result.data[0].total : 0;
  }

  async getTotalExpensesByMonth(year: number, month: number): Promise<number> {
    const result = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
       WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?`,
      [year.toString(), month.toString().padStart(2, '0')]
    );
    return result.success && result.data.length > 0 ? result.data[0].total : 0;
  }
}

