import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginMode: 'username' | 'pin' = 'username';
  username = '';
  password = '';
  pin = '';
  error = '';
  loading = false;
  logoError = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  switchMode(mode: 'username' | 'pin') {
    this.loginMode = mode;
    this.error = '';
    this.username = '';
    this.password = '';
    this.pin = '';
  }

  async login() {
    this.error = '';
    this.loading = true;

    try {
      let success = false;
      if (this.loginMode === 'username') {
        success = await this.authService.login(this.username, this.password);
      } else {
        success = await this.authService.loginWithPin(this.pin);
      }

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error = this.loginMode === 'username' 
          ? 'Invalid username or password' 
          : 'Invalid PIN';
      }
    } catch (error) {
      this.error = 'Login failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onLogoError() {
    this.logoError = true;
  }
}
