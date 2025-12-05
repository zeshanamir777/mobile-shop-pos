import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  constructor(private db: DatabaseService) {}

  async getSetting(key: string): Promise<string | null> {
    const result = await this.db.query('SELECT value FROM settings WHERE key = ?', [key]);
    return result.success && result.data.length > 0 ? result.data[0].value : null;
  }

  async setSetting(key: string, value: string): Promise<boolean> {
    const result = await this.db.query(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
    return result.success;
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const result = await this.db.query('SELECT key, value FROM settings');
    if (!result.success) return {};
    
    const settings: Record<string, string> = {};
    result.data.forEach((row: any) => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  async getShopName(): Promise<string> {
    return (await this.getSetting('shop_name')) || 'Mobile Shop';
  }

  async getCurrency(): Promise<string> {
    return (await this.getSetting('currency')) || 'PKR';
  }

  async isTaxEnabled(): Promise<boolean> {
    const value = await this.getSetting('tax_enabled');
    return value === '1';
  }

  async getTaxRate(): Promise<number> {
    const value = await this.getSetting('tax_rate');
    return value ? parseFloat(value) : 0;
  }
}

