import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { SaleService } from './sale.service';
import { ExpenseService } from './expense.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(
    private db: DatabaseService,
    private saleService: SaleService,
    private expenseService: ExpenseService
  ) {}

  async getDailyReport(date: string): Promise<any> {
    const sales = await this.saleService.getSalesByDate(date);
    const expenses = await this.expenseService.getExpensesByDate(date);
    
    const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netEarnings = totalProfit - totalExpenses;

    return {
      date,
      totalSales,
      totalProfit,
      totalExpenses,
      netEarnings,
      salesCount: sales.length,
      expensesCount: expenses.length
    };
  }

  async getMonthlyReport(year: number, month: number): Promise<any> {
    const sales = await this.saleService.getSalesByMonth(year, month);
    const expenses = await this.expenseService.getExpensesByMonth(year, month);
    
    const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netEarnings = totalProfit - totalExpenses;

    // Calculate loss days
    const dailyReports = await this.getDailyReportsForMonth(year, month);
    const lossDays = dailyReports.filter(d => d.netEarnings < 0).length;

    return {
      year,
      month,
      totalSales,
      totalProfit,
      totalExpenses,
      netEarnings,
      salesCount: sales.length,
      lossDays
    };
  }

  async getDailyReportsForMonth(year: number, month: number): Promise<any[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const reports = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      reports.push(await this.getDailyReport(date));
    }
    
    return reports;
  }

  async getBestSellingProducts(limit: number = 10): Promise<any[]> {
    const result = await this.db.query(
      `SELECT p.*, SUM(si.quantity) as total_sold, SUM(si.total) as total_revenue
       FROM products p
       JOIN sale_items si ON p.id = si.product_id
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT ?`,
      [limit]
    );
    return result.success ? result.data : [];
  }

  async getDeadStock(): Promise<any[]> {
    const result = await this.db.query(
      `SELECT p.*
       FROM products p
       LEFT JOIN sale_items si ON p.id = si.product_id
       WHERE si.id IS NULL AND p.stock_quantity > 0
       ORDER BY p.stock_quantity DESC`
    );
    return result.success ? result.data : [];
  }

  async getLowStockReport(threshold: number = 10): Promise<any[]> {
    const result = await this.db.query(
      'SELECT * FROM products WHERE stock_quantity <= ? AND stock_quantity > 0 ORDER BY stock_quantity',
      [threshold]
    );
    return result.success ? result.data : [];
  }
}

