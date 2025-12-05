import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { SaleService } from '../../services/sale.service';
import { CustomerService } from '../../services/customer.service';
import { CartItem } from '../../models/sale.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss'
})
export class PosComponent implements OnInit {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;
  
  cart: CartItem[] = [];
  barcode = '';
  discount = 0;
  paymentMethod = 'Cash';
  selectedCustomer: any = null;
  customers: any[] = [];
  showCustomerModal = false;
  newCustomerName = '';
  newCustomerPhone = '';
  scanning = false;
  barcodeBuffer = '';
  lastScanTime = 0;

  paymentMethods = ['Cash', 'Bank', 'JazzCash', 'EasyPaisa'];

  constructor(
    private productService: ProductService,
    private saleService: SaleService,
    private customerService: CustomerService
  ) {}

  ngOnInit() {
    this.loadCustomers();
    // Auto-focus barcode input
    setTimeout(() => {
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 100);
  }

  async loadCustomers() {
    this.customers = await this.customerService.getAllCustomers();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Auto-focus barcode input when typing (for barcode scanner)
    if (event.target === document.body || event.target === document.documentElement) {
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    }
  }

  async handleBarcodeInput() {
    const now = Date.now();
    
    // If time since last scan is > 100ms, treat as new scan
    if (now - this.lastScanTime > 100) {
      this.barcodeBuffer = '';
    }
    
    this.barcodeBuffer += this.barcode;
    this.lastScanTime = now;

    // Wait a bit to see if more input comes (barcode scanners send quickly)
    setTimeout(async () => {
      if (this.barcodeBuffer.length > 0) {
        await this.scanBarcode(this.barcodeBuffer);
        this.barcodeBuffer = '';
      }
    }, 150);

    this.barcode = '';
  }

  async scanBarcode(barcode: string) {
    if (!barcode || barcode.trim() === '') return;

    try {
      const product = await this.productService.getProductByBarcode(barcode.trim());
      
      if (!product) {
        alert(`Product not found for barcode: ${barcode}`);
        return;
      }

      if (product.stock_quantity <= 0) {
        alert(`Product "${product.name}" is out of stock!`);
        return;
      }

      // Check if product already in cart
      const existingItem = this.cart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
          alert(`Only ${product.stock_quantity} items available in stock!`);
          return;
        }
        existingItem.quantity++;
        existingItem.total = existingItem.quantity * existingItem.price;
        existingItem.profit = existingItem.quantity * (existingItem.price - product.purchase_price);
      } else {
        const cartItem: CartItem = {
          product: product,
          quantity: 1,
          price: product.selling_price,
          total: product.selling_price,
          profit: product.selling_price - product.purchase_price
        };
        this.cart.push(cartItem);
      }

      // Refocus barcode input
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      alert('Error scanning barcode. Please try again.');
    }
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      this.removeFromCart(this.cart.indexOf(item));
      return;
    }
    if (newQuantity > item.product.stock_quantity) {
      alert(`Only ${item.product.stock_quantity} items available in stock!`);
      return;
    }
    item.quantity = newQuantity;
    item.total = item.quantity * item.price;
    item.profit = item.quantity * (item.price - item.product.purchase_price);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  get total(): number {
    return this.subtotal - this.discount;
  }

  get profit(): number {
    return this.cart.reduce((sum, item) => sum + item.profit, 0);
  }

  async addCustomer() {
    if (!this.newCustomerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    const success = await this.customerService.addCustomer({
      name: this.newCustomerName,
      phone: this.newCustomerPhone
    });

    if (success) {
      await this.loadCustomers();
      this.newCustomerName = '';
      this.newCustomerPhone = '';
      this.showCustomerModal = false;
    } else {
      alert('Failed to add customer');
    }
  }

  async completeSale() {
    if (this.cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    if (this.total <= 0) {
      alert('Total amount must be greater than 0');
      return;
    }

    if (!confirm(`Complete sale for ${this.formatCurrency(this.total)}?`)) {
      return;
    }

    try {
      const invoiceNumber = this.saleService.generateInvoiceNumber();
      
      const sale = {
        invoice_number: invoiceNumber,
        customer_id: this.selectedCustomer?.id || null,
        total_amount: this.total,
        discount: this.discount,
        payment_method: this.paymentMethod,
        profit: this.profit
      };

      const saleItems = this.cart.map(item => ({
        product_id: item.product.id!,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        profit: item.profit
      }));

      const success = await this.saleService.createSale(sale, saleItems);

      if (success) {
        alert(`Sale completed! Invoice: ${invoiceNumber}`);
        this.resetCart();
      } else {
        alert('Failed to complete sale. Please try again.');
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      alert('Error completing sale. Please try again.');
    }
  }

  resetCart() {
    this.cart = [];
    this.discount = 0;
    this.selectedCustomer = null;
    this.paymentMethod = 'Cash';
    if (this.barcodeInput) {
      this.barcodeInput.nativeElement.focus();
    }
  }

  cancelSale() {
    if (this.cart.length === 0) return;
    
    if (confirm('Cancel current sale? All items will be removed from cart.')) {
      this.resetCart();
    }
  }

  formatCurrency(amount: number): string {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
