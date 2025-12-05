import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  todayReport: any = null;
  lowStockProducts: any[] = [];
  outOfStockProducts: any[] = [];
  loading = true;

  constructor(
    private reportService: ReportService,
    private productService: ProductService
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading = true;
    try {
      const today = new Date().toISOString().split('T')[0];
      this.todayReport = await this.reportService.getDailyReport(today);
      this.lowStockProducts = await this.productService.getLowStockProducts(10);
      this.outOfStockProducts = await this.productService.getOutOfStockProducts();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      this.loading = false;
    }
  }

  formatCurrency(amount: number): string {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
