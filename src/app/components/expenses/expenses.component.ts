import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss'
})
export class ExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  searchTerm = '';
  showAddModal = false;
  showEditModal = false;
  selectedExpense: Expense | null = null;
  loading = false;

  newExpense: Expense = {
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  };

  categories = ['Rent', 'Electricity', 'Salaries', 'Internet', 'Misc'];

  constructor(private expenseService: ExpenseService) {}

  async ngOnInit() {
    await this.loadExpenses();
  }

  async loadExpenses() {
    this.loading = true;
    try {
      this.expenses = await this.expenseService.getAllExpenses();
      this.filteredExpenses = this.expenses;
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      this.loading = false;
    }
  }

  filterExpenses() {
    if (!this.searchTerm.trim()) {
      this.filteredExpenses = this.expenses;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredExpenses = this.expenses.filter(e =>
      e.category.toLowerCase().includes(term) ||
      e.description?.toLowerCase().includes(term)
    );
  }

  openAddModal() {
    this.newExpense = {
      category: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    };
    this.showAddModal = true;
  }

  openEditModal(expense: Expense) {
    this.selectedExpense = { ...expense };
    this.showEditModal = true;
  }

  async addExpense() {
    if (!this.newExpense.category.trim()) {
      alert('Category is required');
      return;
    }
    if (this.newExpense.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    const success = await this.expenseService.addExpense(this.newExpense);
    if (success) {
      await this.loadExpenses();
      this.showAddModal = false;
    } else {
      alert('Failed to add expense');
    }
  }

  async updateExpense() {
    if (!this.selectedExpense) return;
    if (!this.selectedExpense.category.trim()) {
      alert('Category is required');
      return;
    }

    const success = await this.expenseService.updateExpense(
      this.selectedExpense.id!,
      this.selectedExpense
    );
    if (success) {
      await this.loadExpenses();
      this.showEditModal = false;
      this.selectedExpense = null;
    } else {
      alert('Failed to update expense');
    }
  }

  async deleteExpense(id: number) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    const success = await this.expenseService.deleteExpense(id);
    if (success) {
      await this.loadExpenses();
    } else {
      alert('Failed to delete expense');
    }
  }

  formatCurrency(amount: number): string {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
