import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  reportType: 'daily' | 'monthly' | 'products' = 'daily';
  dailyReport: any = null;
  monthlyReport: any = null;
  bestSelling: any[] = [];
  deadStock: any[] = [];
  lowStock: any[] = [];
  selectedDate = new Date().toISOString().split('T')[0];
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  loading = false;

  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  constructor(private reportService: ReportService) {}

  async ngOnInit() {
    await this.loadDailyReport();
  }

  async loadDailyReport() {
    this.loading = true;
    try {
      this.dailyReport = await this.reportService.getDailyReport(this.selectedDate);
    } catch (error) {
      console.error('Error loading daily report:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadMonthlyReport() {
    this.loading = true;
    try {
      this.monthlyReport = await this.reportService.getMonthlyReport(this.selectedYear, this.selectedMonth);
    } catch (error) {
      console.error('Error loading monthly report:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadProductReports() {
    this.loading = true;
    try {
      this.bestSelling = await this.reportService.getBestSellingProducts(10);
      this.deadStock = await this.reportService.getDeadStock();
      this.lowStock = await this.reportService.getLowStockReport(10);
    } catch (error) {
      console.error('Error loading product reports:', error);
    } finally {
      this.loading = false;
    }
  }

  switchReportType(type: 'daily' | 'monthly' | 'products') {
    this.reportType = type;
    if (type === 'daily') {
      this.loadDailyReport();
    } else if (type === 'monthly') {
      this.loadMonthlyReport();
    } else {
      this.loadProductReports();
    }
  }

  formatCurrency(amount: number): string {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
