import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchTerm = '';
  showAddModal = false;
  showEditModal = false;
  showHistoryModal = false;
  selectedCustomer: Customer | null = null;
  purchaseHistory: any[] = [];
  loading = false;

  newCustomer: Customer = {
    name: '',
    phone: '',
    credit_balance: 0
  };

  constructor(private customerService: CustomerService) {}

  async ngOnInit() {
    await this.loadCustomers();
  }

  async loadCustomers() {
    this.loading = true;
    try {
      this.customers = await this.customerService.getAllCustomers();
      this.filteredCustomers = this.customers;
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      this.loading = false;
    }
  }

  filterCustomers() {
    if (!this.searchTerm.trim()) {
      this.filteredCustomers = this.customers;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
    );
  }

  openAddModal() {
    this.newCustomer = { name: '', phone: '', credit_balance: 0 };
    this.showAddModal = true;
  }

  openEditModal(customer: Customer) {
    this.selectedCustomer = { ...customer };
    this.showEditModal = true;
  }

  async openHistoryModal(customer: Customer) {
    this.selectedCustomer = customer;
    this.purchaseHistory = await this.customerService.getCustomerPurchases(customer.id!);
    this.showHistoryModal = true;
  }

  async addCustomer() {
    if (!this.newCustomer.name.trim()) {
      alert('Customer name is required');
      return;
    }

    const success = await this.customerService.addCustomer(this.newCustomer);
    if (success) {
      await this.loadCustomers();
      this.showAddModal = false;
    } else {
      alert('Failed to add customer');
    }
  }

  async updateCustomer() {
    if (!this.selectedCustomer) return;
    if (!this.selectedCustomer.name.trim()) {
      alert('Customer name is required');
      return;
    }

    const success = await this.customerService.updateCustomer(
      this.selectedCustomer.id!,
      this.selectedCustomer
    );
    if (success) {
      await this.loadCustomers();
      this.showEditModal = false;
      this.selectedCustomer = null;
    } else {
      alert('Failed to update customer');
    }
  }

  async deleteCustomer(id: number) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    const success = await this.customerService.deleteCustomer(id);
    if (success) {
      await this.loadCustomers();
    } else {
      alert('Failed to delete customer');
    }
  }

  formatCurrency(amount: number): string {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
