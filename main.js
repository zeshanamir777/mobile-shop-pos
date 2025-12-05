const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const initSqlJs = require('sql.js');
const fs = require('fs');

let mainWindow;
let db = null;
let dbInitialized = false;

// Initialize database
async function initDatabase() {
  try {
    if (db && dbInitialized) {
      console.log('Database already initialized, skipping...');
      return;
    }
    
    console.log('Starting database initialization...');
    const userDataPath = app.getPath('userData');
    console.log('User data path:', userDataPath);
    const dbPath = path.join(userDataPath, 'pos_database.db');
    console.log('Database path:', dbPath);
    
    console.log('Loading SQL.js...');
    const SQL = await initSqlJs();
    console.log('SQL.js loaded successfully');
    
    // Load existing database or create new one
    let filebuffer;
    if (fs.existsSync(dbPath)) {
      console.log('Loading existing database...');
      filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
    } else {
      console.log('Creating new database...');
      db = new SQL.Database();
    }
    console.log('Database connection created successfully');
  
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        pin TEXT,
        auto_login INTEGER DEFAULT 0
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        purchase_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        barcode TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        credit_balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        discount REAL DEFAULT 0,
        payment_method TEXT NOT NULL,
        profit REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        total REAL NOT NULL,
        profit REAL DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    // Insert default admin user if not exists
    const adminStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
    adminStmt.bind(['admin']);
    let adminExists = false;
    if (adminStmt.step()) {
      const row = adminStmt.getAsObject();
      adminExists = row.count > 0;
    }
    adminStmt.free();
    
    console.log('Admin user exists check:', adminExists);
    if (!adminExists) {
      const insertStmt = db.prepare('INSERT INTO users (username, password, pin) VALUES (?, ?, ?)');
      insertStmt.bind(['admin', 'admin123', '1234']);
      insertStmt.step();
      insertStmt.free();
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
    
    // Verify admin user was created
    const verifyStmt = db.prepare('SELECT * FROM users WHERE username = ?');
    verifyStmt.bind(['admin']);
    const verifyResult = [];
    while (verifyStmt.step()) {
      verifyResult.push(verifyStmt.getAsObject());
    }
    verifyStmt.free();
    console.log('Verified admin user:', verifyResult);
    
    // Insert default settings
    const settings = [
      ['shop_name', 'Mobile Shop'],
      ['currency', 'PKR'],
      ['tax_enabled', '0'],
      ['tax_rate', '0']
    ];
    
    for (const [key, value] of settings) {
      try {
        const settingStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
        settingStmt.bind([key, value]);
        settingStmt.step();
        settingStmt.free();
      } catch (e) {
        // Ignore if already exists
      }
    }
    
    // Save database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log('Database saved to file');
    
    dbInitialized = true;
    console.log('Database initialization complete');
    console.log('dbInitialized flag set to:', dbInitialized);
    console.log('db object exists:', !!db);
    console.log('Database is ready for queries');
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    dbInitialized = false;
    db = null;
    throw error;
  }
}

function saveDatabase() {
  if (!db || !dbInitialized) return;
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'pos_database.db');
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    console.log('Loading from development server: http://localhost:4200');
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    // Angular 17+ outputs to browser subdirectory
    const indexPath = path.join(__dirname, 'dist/mobile-shop-pos/browser/index.html');
    console.log('Loading from file:', indexPath);
    
    // Check if file exists
    if (!fs.existsSync(indexPath)) {
      console.error('ERROR: Index file not found at:', indexPath);
      mainWindow.loadURL('data:text/html,<h1>Build Error</h1><p>Please run: npm run build</p>');
      return;
    }
    
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Error loading file:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  console.log('========================================');
  console.log('Electron app ready, initializing database...');
  console.log('========================================');
  
  // Initialize database first, before creating window
  try {
    console.log('Calling initDatabase()...');
    await initDatabase();
    console.log('initDatabase() call completed');
    
    if (dbInitialized && db) {
      console.log('✓ Database initialized successfully');
      // Test query to verify database works
      try {
        const testStmt = db.prepare('SELECT COUNT(*) as count FROM users');
        const testResult = [];
        while (testStmt.step()) {
          testResult.push(testStmt.getAsObject());
        }
        testStmt.free();
        console.log('✓ Database test query result:', testResult);
        
        const adminStmt = db.prepare('SELECT * FROM users WHERE username = ?');
        adminStmt.bind(['admin']);
        const adminCheck = [];
        while (adminStmt.step()) {
          adminCheck.push(adminStmt.getAsObject());
        }
        adminStmt.free();
        console.log('✓ Admin user check:', adminCheck);
      } catch (testError) {
        console.error('✗ Database test query failed:', testError);
      }
    } else {
      console.error('✗ Database initialization failed!');
      console.error('  dbInitialized:', dbInitialized, 'db exists:', !!db);
    }
    console.log('========================================');
  } catch (error) {
    console.error('========================================');
    console.error('✗ Error during database initialization:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================');
  }
  
  console.log('Creating window...');
  createWindow();
  console.log('Window created');
  
  // Auto-save database every 30 seconds
  setInterval(() => {
    saveDatabase();
  }, 30000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Save database before closing
  saveDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (db) {
    db.close();
  }
});

// IPC Handlers
ipcMain.handle('db-query', async (event, query, params = []) => {
  try {
    if (!db || !dbInitialized) {
      console.error('Database not initialized yet');
      console.error('db exists:', !!db, 'dbInitialized:', dbInitialized);
      // Try to initialize if not done
      if (!dbInitialized) {
        console.log('Attempting to initialize database from IPC handler...');
        try {
          await initDatabase();
        } catch (initError) {
          console.error('Failed to initialize database from IPC:', initError);
        }
      }
      if (!db || !dbInitialized) {
        return { success: false, error: 'Database not initialized. Please wait and try again.' };
      }
    }
    
    console.log('DB Query:', query, 'Params:', params);
    
    // sql.js uses exec for SELECT and run for INSERT/UPDATE/DELETE
    const queryUpper = query.trim().toUpperCase();
    if (queryUpper.startsWith('SELECT')) {
      // For SELECT queries, use prepared statement with parameters
      const stmt = db.prepare(query);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      const result = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        result.push(row);
      }
      stmt.free();
      console.log('Query result:', result);
      return { success: true, data: result };
    } else {
      // For INSERT/UPDATE/DELETE, use run with parameters
      const stmt = db.prepare(query);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      const result = {
        lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || null,
        changes: db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] || 0
      };
      stmt.free();
      console.log('Query result:', result);
      saveDatabase(); // Auto-save after modification
      return { success: true, data: result };
    }
  } catch (error) {
    console.error('DB Query Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-exec', async (event, query) => {
  try {
    if (!db || !dbInitialized) {
      console.error('Database not initialized yet');
      return { success: false, error: 'Database not initialized. Please wait and try again.' };
    }
    db.exec(query);
    saveDatabase();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup-database', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'pos_database.db');
    const backupPath = path.join(userDataPath, `backup_${Date.now()}.db`);
    fs.copyFileSync(dbPath, backupPath);
    return { success: true, path: backupPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-database', async (event, backupPath) => {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'pos_database.db');
    if (db) {
      db.close();
    }
    fs.copyFileSync(backupPath, dbPath);
    await initDatabase();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
