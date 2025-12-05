import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI?: {
      dbQuery: (query: string, params?: any[]) => Promise<any>;
      dbExec: (query: string) => Promise<any>;
      backupDatabase: () => Promise<any>;
      restoreDatabase: (path: string) => Promise<any>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

  async query(query: string, params: any[] = [], retries: number = 15): Promise<any> {
    if (!this.isElectron) {
      console.error('Database service only works in Electron environment');
      return { success: false, error: 'Not in Electron environment', data: [] };
    }
    try {
      let result = await window.electronAPI!.dbQuery(query, params);
      
      // If database not initialized, retry with longer wait
      if (!result.success && result.error && result.error.includes('not initialized') && retries > 0) {
        console.log(`Database not ready, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
        return this.query(query, params, retries - 1);
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] };
    }
  }

  async exec(query: string): Promise<any> {
    if (!this.isElectron) {
      throw new Error('Database service only works in Electron environment');
    }
    return await window.electronAPI!.dbExec(query);
  }

  async backupDatabase(): Promise<any> {
    if (!this.isElectron) {
      throw new Error('Database service only works in Electron environment');
    }
    return await window.electronAPI!.backupDatabase();
  }

  async restoreDatabase(path: string): Promise<any> {
    if (!this.isElectron) {
      throw new Error('Database service only works in Electron environment');
    }
    return await window.electronAPI!.restoreDatabase(path);
  }
}
