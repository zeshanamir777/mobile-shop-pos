# Mobile Shop POS System

A fast, offline-first desktop POS (Point of Sale) system built with Angular 17, Electron, and SQLite.

## Features

✅ **Authentication**
- Single Admin Login
- PIN-based quick login
- Auto-login on system startup

✅ **Product & Inventory Management**
- Add/Edit/Delete Products
- Barcode support
- Low stock alerts
- Out-of-stock warnings
- Brand and category management

✅ **Barcode Scanner Integration**
- USB Barcode Scanner support (keyboard input mode)
- Auto-focus on scan field
- Auto-add product to cart
- Quantity increment on duplicate scan
- Manual barcode entry fallback

✅ **Sales & Billing (POS)**
- Scan items to cart
- Manual add option
- Auto calculation (Subtotal, Discount, Total, Profit)
- Multiple payment methods (Cash, Bank, JazzCash, EasyPaisa)
- Save invoices
- Cancel sale option

✅ **Customer Management**
- Add/Edit/Delete Customers
- Customer purchase history
- Credit balance tracking

✅ **Expense Management**
- Daily expense entry
- Multiple expense categories
- Monthly expense summary

✅ **Reports & Analytics**
- Daily reports (Sales, Profit, Expenses, Net Earnings)
- Monthly reports
- Best selling products
- Dead stock report
- Low stock items

✅ **Settings**
- Shop name & logo configuration
- Currency setup
- Tax toggle
- Database backup & restore

## Tech Stack

- **Frontend**: Angular 17+ with Tailwind CSS
- **Desktop**: Electron.js
- **Database**: SQLite (better-sqlite3)
- **State Management**: RxJS

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the Angular app:
```bash
npm run build
```

3. Run Electron app:
```bash
npm run electron
```

## Development

For development with hot reload:

1. Start Angular dev server:
```bash
npm start
```

2. In another terminal, run Electron:
```bash
npm run electron:dev
```

## Default Login Credentials

- **Username**: admin
- **Password**: admin123
- **PIN**: 1234

## Building for Production

```bash
npm run electron:build
```

This will create distributable packages for your platform.

## Database

The SQLite database is automatically created in the app's user data directory:
- **Windows**: `%APPDATA%/mobile-shop-pos/pos_database.db`
- **macOS**: `~/Library/Application Support/mobile-shop-pos/pos_database.db`
- **Linux**: `~/.config/mobile-shop-pos/pos_database.db`

## Barcode Scanner Setup

1. Connect your USB barcode scanner
2. The scanner should be in "Keyboard Wedge" or "HID Keyboard" mode
3. Open the POS screen
4. The barcode input field will auto-focus
5. Scan products - they will automatically be added to the cart

## Project Structure

```
mobile-shop-pos/
├── main.js                 # Electron main process
├── preload.js              # Electron preload script
├── src/
│   ├── app/
│   │   ├── components/     # Angular components
│   │   ├── services/       # Business logic services
│   │   ├── models/         # TypeScript interfaces
│   │   └── app.routes.ts   # Routing configuration
│   └── styles.scss         # Global styles
└── package.json
```

## License

MIT
