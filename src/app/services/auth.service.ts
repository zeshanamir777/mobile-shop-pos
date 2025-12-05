import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: any = null;
  private isAuthenticated = false;

  constructor(
    private db: DatabaseService,
    private router: Router
  ) {
    this.checkAutoLogin();
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      console.log('Attempting login for username:', username);
      const result = await this.db.query(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
      
      console.log('Login query result:', result);
      
      if (result && result.success && result.data && result.data.length > 0) {
        this.currentUser = result.data[0];
        this.isAuthenticated = true;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        console.log('Login successful');
        return true;
      } else {
        console.log('Login failed - no matching user found');
        // Try to check if admin user exists at all
        const allUsers = await this.db.query('SELECT * FROM users', []);
        console.log('All users in database:', allUsers);
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async loginWithPin(pin: string): Promise<boolean> {
    try {
      console.log('Attempting PIN login for PIN:', pin);
      const result = await this.db.query(
        'SELECT * FROM users WHERE pin = ?',
        [pin]
      );
      
      console.log('PIN login query result:', result);
      
      if (result && result.success && result.data && result.data.length > 0) {
        this.currentUser = result.data[0];
        this.isAuthenticated = true;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        console.log('PIN login successful');
        return true;
      } else {
        console.log('PIN login failed - no matching user found');
      }
      return false;
    } catch (error) {
      console.error('PIN login error:', error);
      return false;
    }
  }

  async checkAutoLogin(): Promise<void> {
    try {
      // Don't check auto-login immediately - wait for database to be ready
      // The login component will handle authentication
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          // Verify user still exists in database
          const result = await this.db.query('SELECT * FROM users WHERE id = ?', [this.currentUser.id]);
          if (result && result.success && result.data && result.data.length > 0) {
            this.isAuthenticated = true;
          } else {
            localStorage.removeItem('currentUser');
          }
        } catch (error) {
          console.error('Auto-login verification error:', error);
          localStorage.removeItem('currentUser');
        }
      }
    } catch (error) {
      console.error('Auto-login check error:', error);
      this.isAuthenticated = false;
    }
  }

  logout(): void {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getCurrentUser(): any {
    return this.currentUser;
  }
}

