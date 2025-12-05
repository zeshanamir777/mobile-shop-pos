import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  shopName = 'Mobile Shop';
  currentUser: any;
  activeRoute = '';
  logoError = false;

  menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/pos', icon: '🛒', label: 'POS Billing' },
    { path: '/products', icon: '📦', label: 'Products' },
    { path: '/customers', icon: '👥', label: 'Customers' },
    { path: '/expenses', icon: '💰', label: 'Expenses' },
    { path: '/reports', icon: '📈', label: 'Reports' },
    { path: '/settings', icon: '⚙️', label: 'Settings' }
  ];

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.loadShopName();
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url;
    });
  }

  async loadShopName() {
    this.shopName = await this.settingsService.getShopName();
  }

  logout() {
    this.authService.logout();
  }

  isActive(path: string): boolean {
    return this.activeRoute === path || this.activeRoute.startsWith(path + '/');
  }

  onLogoError() {
    this.logoError = true;
  }
}
