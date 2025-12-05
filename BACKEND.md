# Backend Architecture

## Overview

This application uses **Electron's Main Process** as the backend. There is no separate server - all backend logic runs in the Electron main process alongside the SQLite database.

## Architecture Components

### 1. Main Process (`main.js`)

The Electron main process handles:
- **Database initialization** and management
- **IPC (Inter-Process Communication)** handlers
- **Window management**
- **File system operations** (backup/restore)

### 2. Preload Script (`preload.js`)

Acts as a secure bridge between:
- **Renderer process** (Angular UI)
- **Main process** (Backend)

Exposes safe API methods to the frontend.

### 3. Database Service (`database.service.ts`)

Angular service that:
- Communicates with Electron API
- Provides typed methods for database operations
- Handles errors and responses

## IPC Handlers

### Database Operations

#### `db-query`
Executes SQL queries with parameters.

```javascript
ipcMain.handle('db-query', (event, query, params = []) => {
  const stmt = db.prepare(query);
  if (query.trim().toUpperCase().startsWith('SELECT')) {
    return { success: true, data: stmt.all(...params) };
  } else {
    return { success: true, data: stmt.run(...params) };
  }
});
```

**Usage:**
```typescript
// In Angular service
const result = await this.db.query('SELECT * FROM products WHERE id = ?', [1]);
```

#### `db-exec`
Executes multiple SQL statements.

```javascript
ipcMain.handle('db-exec', (event, query) => {
  db.exec(query);
  return { success: true };
});
```

**Usage:**
```typescript
await this.db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (...);
  INSERT INTO new_table VALUES (...);
`);
```

### Backup Operations

#### `backup-database`
Creates a timestamped backup of the database.

```javascript
ipcMain.handle('backup-database', async () => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos_database.db');
  const backupPath = path.join(userDataPath, `backup_${Date.now()}.db`);
  fs.copyFileSync(dbPath, backupPath);
  return { success: true, path: backupPath };
});
```

#### `restore-database`
Restores database from a backup file.

```javascript
ipcMain.handle('restore-database', async (event, backupPath) => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'pos_database.db');
  if (db) db.close();
  fs.copyFileSync(backupPath, dbPath);
  initDatabase();
  return { success: true };
});
```

## Data Flow

### Example: Adding a Product

```
1. User fills form in Angular component
   ↓
2. Component calls ProductService.addProduct()
   ↓
3. ProductService calls DatabaseService.query()
   ↓
4. DatabaseService calls window.electronAPI.dbQuery()
   ↓
5. Preload script forwards to IPC
   ↓
6. Main process receives IPC message
   ↓
7. SQLite executes INSERT query
   ↓
8. Result flows back through the chain
   ↓
9. Component updates UI
```

## Security Model

### Context Isolation
- Renderer process (Angular) cannot directly access Node.js APIs
- All Node.js access goes through IPC via preload script
- Prevents XSS attacks from accessing system resources

### Parameterized Queries
- All queries use parameterized statements
- Prevents SQL injection attacks
- Example: `db.prepare('SELECT * FROM products WHERE id = ?').get(id)`

## Error Handling

All IPC handlers return consistent response format:

```typescript
{
  success: boolean,
  data?: any,
  error?: string
}
```

**Example:**
```typescript
try {
  const result = await this.db.query('SELECT * FROM products');
  if (result.success) {
    // Handle success
    console.log(result.data);
  } else {
    // Handle error
    console.error(result.error);
  }
} catch (error) {
  // Handle exception
  console.error('Database error:', error);
}
```

## Adding New IPC Handlers

### Step 1: Add handler in `main.js`

```javascript
ipcMain.handle('new-handler', async (event, param1, param2) => {
  try {
    // Your logic here
    const result = db.prepare('SELECT ...').all();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Step 2: Expose in `preload.js`

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods
  newHandler: (param1, param2) => ipcRenderer.invoke('new-handler', param1, param2)
});
```

### Step 3: Add TypeScript interface

```typescript
// In database.service.ts or types file
interface Window {
  electronAPI?: {
    // ... existing methods
    newHandler: (param1: string, param2: number) => Promise<any>;
  };
}
```

### Step 4: Use in Angular service

```typescript
async newMethod(param1: string, param2: number) {
  if (!this.isElectron) {
    throw new Error('Only works in Electron');
  }
  return await window.electronAPI!.newHandler(param1, param2);
}
```

## Performance Considerations

### Database Connection
- Single persistent connection per app instance
- Connection is created on app start
- Closed on app exit

### Query Optimization
- Use prepared statements for repeated queries
- Index frequently queried columns
- Use transactions for multiple related operations

### Example Transaction:
```javascript
const transaction = db.transaction((products) => {
  const insert = db.prepare('INSERT INTO products ...');
  for (const product of products) {
    insert.run(product);
  }
});
```

## Testing

### Unit Testing Services
Mock the `window.electronAPI` in tests:

```typescript
beforeEach(() => {
  (window as any).electronAPI = {
    dbQuery: jasmine.createSpy('dbQuery').and.returnValue(
      Promise.resolve({ success: true, data: [] })
    )
  };
});
```

### Integration Testing
- Test IPC handlers directly
- Use in-memory SQLite database for tests
- Mock file system operations

## Deployment Considerations

### Database Migration
- Check database version on startup
- Run migrations if needed
- Backup before migration

### Data Persistence
- Database persists between app restarts
- Backup location is user-specific
- Consider cloud sync for future versions

## Future Enhancements

1. **API Server Mode**: Optional HTTP server for remote access
2. **Multi-user Support**: User roles and permissions
3. **Data Encryption**: Encrypt sensitive data at rest
4. **Audit Logging**: Track all database changes
5. **Replication**: Sync between multiple devices
6. **Cloud Backup**: Automatic cloud backup integration

