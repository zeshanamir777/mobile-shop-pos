import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  shopName = '';
  currency = 'PKR';
  taxEnabled = false;
  taxRate = 0;
  loading = false;
  saving = false;

  constructor(
    private settingsService: SettingsService,
    private databaseService: DatabaseService
  ) {}

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    this.loading = true;
    try {
      this.shopName = await this.settingsService.getShopName();
      this.currency = await this.settingsService.getCurrency();
      this.taxEnabled = await this.settingsService.isTaxEnabled();
      this.taxRate = await this.settingsService.getTaxRate();
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      this.loading = false;
    }
  }

  async saveSettings() {
    this.saving = true;
    try {
      await this.settingsService.setSetting('shop_name', this.shopName);
      await this.settingsService.setSetting('currency', this.currency);
      await this.settingsService.setSetting('tax_enabled', this.taxEnabled ? '1' : '0');
      await this.settingsService.setSetting('tax_rate', this.taxRate.toString());
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      this.saving = false;
    }
  }

  async backupDatabase() {
    try {
      const result = await this.databaseService.backupDatabase();
      if (result.success) {
        alert(`Database backed up successfully!\nLocation: ${result.path}`);
      } else {
        alert('Failed to backup database');
      }
    } catch (error) {
      console.error('Error backing up database:', error);
      alert('Failed to backup database');
    }
  }

  async resetData() {
    if (!confirm('Are you sure you want to reset all data? This action cannot be undone!')) {
      return;
    }
    if (!confirm('This will delete ALL data. Type "RESET" to confirm.')) {
      return;
    }

    try {
      // This would need to be implemented in the database service
      alert('Data reset functionality needs to be implemented');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data');
    }
  }
}
