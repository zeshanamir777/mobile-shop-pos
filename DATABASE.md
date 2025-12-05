# Database & Backend Architecture

## Overview

This is an **Electron desktop application** with an **embedded SQLite database**. There is no separate backend server - everything runs locally in the Electron main process.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                          │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Renderer Process│         │  Main Process    │     │
│  │  (Angular UI)    │◄───────►│  (Backend)       │     │
│  │                  │  IPC    │                  │     │
│  │  - Components    │         │  - SQLite DB     │     │
│  │  - Services      │         │  - IPC Handlers  │     │
│  │  - UI Logic      │         │  - Business Logic│     │
│  └──────────────────┘         └──────────────────┘     │
│                                    │                    │
│                                    ▼                    │
│                            ┌──────────────┐            │
│                            │  SQLite DB   │            │
│                            │  (Local File)│            │
│                            └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables

#### 1. `users`
Stores user authentication information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | TEXT | Unique username |
| password | TEXT | Password (plain text - consider hashing in production) |
| pin | TEXT | PIN for quick login |
| auto_login | INTEGER | Auto-login flag (0/1) |

#### 2. `products`
Stores product inventory.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Product name |
| brand | TEXT | Brand name |
| category | TEXT | Product category |
| purchase_price | REAL | Cost price |
| selling_price | REAL | Selling price |
| stock_quantity | INTEGER | Current stock |
| barcode | TEXT | Unique barcode |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

#### 3. `customers`
Stores customer information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Customer name |
| phone | TEXT | Phone number |
| credit_balance | REAL | Outstanding credit |
| created_at | DATETIME | Creation timestamp |

#### 4. `sales`
Stores sales transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| invoice_number | TEXT | Unique invoice number |
| customer_id | INTEGER | Foreign key to customers |
| total_amount | REAL | Total sale amount |
| discount | REAL | Discount applied |
| payment_method | TEXT | Payment method |
| profit | REAL | Profit from sale |
| created_at | DATETIME | Sale timestamp |

#### 5. `sale_items`
Stores individual items in each sale.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| sale_id | INTEGER | Foreign key to sales |
| product_id | INTEGER | Foreign key to products |
| quantity | INTEGER | Quantity sold |
| price | REAL | Unit price |
| total | REAL | Line total |
| profit | REAL | Profit from this line |

#### 6. `expenses`
Stores business expenses.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| category | TEXT | Expense category |
| amount | REAL | Expense amount |
| description | TEXT | Expense description |
| date | DATE | Expense date |
| created_at | DATETIME | Creation timestamp |

#### 7. `settings`
Stores application settings.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Setting key (primary key) |
| value | TEXT | Setting value |

## Database Location

The SQLite database file is stored in the Electron app's user data directory:

- **Windows**: `%APPDATA%\mobile-shop-pos\pos_database.db`
- **macOS**: `~/Library/Application Support/mobile-shop-pos/pos_database.db`
- **Linux**: `~/.config/mobile-shop-pos/pos_database.db`

## Communication Flow

### 1. Frontend (Angular) → Backend (Electron Main Process)

```typescript
// In Angular Service
this.databaseService.query('SELECT * FROM products', [])
  .then(result => {
    // Handle result
  });
```

### 2. IPC Communication

```
Angular Service → window.electronAPI → preload.js → IPC → main.js → SQLite
```

### 3. Backend Processing

```javascript
// In main.js
ipcMain.handle('db-query', (event, query, params) => {
  const stmt = db.prepare(query);
  if (query.startsWith('SELECT')) {
    return { success: true, data: stmt.all(...params) };
  } else {
    return { success: true, data: stmt.run(...params) };
  }
});
```

## Database Operations

### Query Operations
- **SELECT**: Returns array of results
- **INSERT/UPDATE/DELETE**: Returns execution result

### Error Handling
All database operations return:
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

## Backup & Restore

### Backup
- Creates a timestamped copy of the database file
- Stored in the same directory as the main database
- Format: `backup_[timestamp].db`

### Restore
- Replaces the current database with a backup file
- Closes current connection and reinitializes

## Security Considerations

⚠️ **Current Implementation**:
- Passwords are stored in plain text
- No encryption on database file
- No user input sanitization (SQL injection risk)

✅ **Production Recommendations**:
1. Hash passwords using bcrypt
2. Encrypt database file
3. Use parameterized queries (already implemented)
4. Add input validation
5. Implement role-based access control

## Database Initialization

On first run:
1. Creates database file if it doesn't exist
2. Creates all tables
3. Inserts default admin user:
   - Username: `admin`
   - Password: `admin123`
   - PIN: `1234`
4. Inserts default settings

## API Reference

### DatabaseService Methods

```typescript
// Execute a query
query(query: string, params?: any[]): Promise<any>

// Execute multiple statements
exec(query: string): Promise<any>

// Backup database
backupDatabase(): Promise<any>

// Restore database
restoreDatabase(path: string): Promise<any>
```

## Example Queries

### Get all products
```typescript
await this.db.query('SELECT * FROM products ORDER BY name');
```

### Add a product
```typescript
await this.db.query(
  'INSERT INTO products (name, brand, purchase_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?)',
  ['iPhone 15', 'Apple', 150000, 180000, 10]
);
```

### Get daily sales
```typescript
await this.db.query(
  'SELECT * FROM sales WHERE DATE(created_at) = ?',
  ['2024-01-15']
);
```

## Migration & Updates

To add new tables or modify schema:

1. Update `initDatabase()` function in `main.js`
2. Use `ALTER TABLE` statements for existing databases
3. Consider versioning for future migrations

Example migration:
```javascript
// Check if column exists before adding
const tableInfo = db.prepare("PRAGMA table_info(products)").all();
const hasNewColumn = tableInfo.some(col => col.name === 'new_column');

if (!hasNewColumn) {
  db.exec('ALTER TABLE products ADD COLUMN new_column TEXT');
}
```

