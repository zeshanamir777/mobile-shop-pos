import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm = '';
  showAddModal = false;
  showEditModal = false;
  selectedProduct: Product | null = null;
  loading = false;

  newProduct: Product = {
    name: '',
    brand: '',
    category: '',
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    barcode: ''
  };

  categories = ['Phone', 'Charger', 'Handsfree', 'Case', 'Screen Protector', 'Cable', 'Other'];
  brands = ['Samsung', 'iPhone', 'Redmi', 'Oppo', 'Vivo', 'Realme', 'OnePlus', 'Other'];

  constructor(private productService: ProductService) {}

  async ngOnInit() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    try {
      this.products = await this.productService.getAllProducts();
      this.filteredProducts = this.products;
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loading = false;
    }
  }

  filterProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = this.products;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term)
    );
  }

  openAddModal() {
    this.newProduct = {
      name: '',
      brand: '',
      category: '',
      purchase_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      barcode: ''
    };
    this.showAddModal = true;
  }

  openEditModal(product: Product) {
    this.selectedProduct = { ...product };
    this.showEditModal = true;
  }

  async addProduct() {
    if (!this.newProduct.name.trim()) {
      alert('Product name is required');
      return;
    }
    if (this.newProduct.purchase_price <= 0 || this.newProduct.selling_price <= 0) {
      alert('Prices must be greater than 0');
      return;
    }

    const success = await this.productService.addProduct(this.newProduct);
    if (success) {
      await this.loadProducts();
      this.showAddModal = false;
    } else {
      alert('Failed to add product');
    }
  }

  async updateProduct() {
    if (!this.selectedProduct) return;
    if (!this.selectedProduct.name.trim()) {
      alert('Product name is required');
      return;
    }

    const success = await this.productService.updateProduct(this.selectedProduct.id!, this.selectedProduct);
    if (success) {
      await this.loadProducts();
      this.showEditModal = false;
      this.selectedProduct = null;
    } else {
      alert('Failed to update product');
    }
  }

  async deleteProduct(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const success = await this.productService.deleteProduct(id);
    if (success) {
      await this.loadProducts();
    } else {
      alert('Failed to delete product');
    }
  }

  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 10) return 'low-stock';
    return 'in-stock';
  }

  formatCurrency(amount: number): string {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
