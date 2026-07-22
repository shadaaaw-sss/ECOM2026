# Makhmal E-Commerce - Complete Setup & Architecture Guide

## ✅ System Status

All components have been unified and verified:
- ✓ Backend (Node.js/Express + PostgreSQL) - FIXED
- ✓ Frontend (Next.js 14 + React) - FIXED
- ✓ Desktop Dashboard (Electron + React) - FIXED
- ✓ Database Schema - CLEAN & CONSOLIDATED
- ✓ Authentication - JWT-based, unified
- ✓ API Integration - Complete and consistent

---

## 📋 Database Schema

The system uses a clean, unified PostgreSQL schema:

### Core Tables
- **user** - Custom authentication table with JWT support
- **brand** - Product brands
- **category** - Product categories with hierarchical support
- **product** - Product catalog with pricing and inventory
- **product_image** - Multiple images per product
- **order** - Customer orders with full facture support
- **order_item** - Line items in orders
- **wishlist_item** - User wishlists
- **shipping_method** - Shipping options
- **coupon** - Discount codes
- **newsletter_subscriber** - Email subscribers
- **setting** - Global configuration

### Key Features
- All tables use UUID primary keys
- Proper indexing on frequently queried columns
- Foreign key constraints with cascading deletes
- Status checks and defaults for data integrity

---

## 🔐 Authentication System

### User Roles
- `USER` - Regular customer (default)
- `ADMIN` - Store administrator
- `SUPERADMIN` - Full system access

### Login Flow
```
POST /api/auth/login
Request: { email, password }
Response: { token, user: { id, email, role } }
```

### Token Usage
- JWT token stored in `localStorage` as `makhmal_token`
- Synced to `admin_token` for compatibility with admin pages
- Token sent as `Authorization: Bearer <token>` header

### Default Admin Account
- Email: `admin@makhmal.com`
- Password: `admin123`
- Role: `SUPERADMIN`

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - Sign in
- `POST /api/auth/register` - Sign up
- `GET /api/auth/me` - Get current user (requires auth)
- `PATCH /api/auth/me` - Update profile (requires auth)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email with token

### Products
- `GET /api/products` - List products (with filters: category, brand, search, price)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PATCH /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category with products
- `POST /api/categories` - Create category (admin only)
- `PATCH /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Brands
- `GET /api/brands` - List brands
- `GET /api/brands/:id` - Get brand details
- `POST /api/brands` - Create brand (admin only)
- `PATCH /api/brands/:id` - Update brand (admin only)
- `DELETE /api/brands/:id` - Delete brand (admin only)

### Orders
- `GET /api/orders` - Get user's orders (or all if admin)
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status (admin only)

### Factures (Admin Manual Sales)
- `POST /api/factures` - Create facture (admin only)
- `GET /api/factures` - List all factures (admin only)

### Shipping Methods
- `GET /api/shipping-methods` - List shipping methods
- `POST /api/shipping-methods` - Create method (admin only)
- `PATCH /api/shipping-methods/:id` - Update method (admin only)
- `DELETE /api/shipping-methods/:id` - Delete method (admin only)

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

### Newsletters
- `GET /api/newsletters` - Get subscribers (admin only)
- `POST /api/newsletters` - Subscribe to newsletter
- `DELETE /api/newsletters/:id` - Unsubscribe

### Coupons
- `GET /api/coupons` - List coupons (admin only)
- `POST /api/coupons` - Create coupon (admin only)
- `PATCH /api/coupons/:id` - Update coupon (admin only)

### Health Check
- `GET /health` - Simple health check
- `GET /api/health` - API health check

---

## 🗂️ Project Structure

```
ECOM2026/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── index.ts        # Server startup
│   │   ├── db.ts           # PostgreSQL connection
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, errors, rate-limiting
│   │   └── utils/          # Email, helpers
│   ├── drizzle/
│   │   └── seed.ts         # Database initialization
│   └── package.json
│
├── app/                     # Next.js 14 Frontend
│   ├── page.tsx            # Home page
│   ├── admin/              # Admin dashboard
│   ├── auth/               # Authentication pages
│   ├── products/           # Product pages
│   ├── orders/             # Order history
│   ├── checkout/           # Checkout flow
│   └── cart/               # Shopping cart
│
├── components/             # Reusable React components
├── context/                # React Context (Auth, Cart, Language)
├── lib/                    # Utilities (API client, types)
│
├── desktop-dashboard/      # Electron Admin App
│   ├── src/
│   │   ├── App.js         # Main admin UI
│   │   └── App.css
│   ├── main.js            # Electron main process
│   └── package.json
│
├── supabase/migrations/    # Database migrations
└── docs/                   # Documentation
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
# Create .env file with DATABASE_URL and JWT_SECRET
npm run seed      # Initialize database
npm run dev       # Start dev server (port 4000)
npm run build     # Build for production
```

### Frontend Setup
```bash
# From root directory
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev       # Start Next.js dev server (port 3000)
npm run build     # Build for production
```

### Desktop Dashboard Setup
```bash
cd desktop-dashboard
npm install
# Create .env with REACT_APP_API_URL=http://localhost:4000/
npm run dev       # Start Electron app
npm run build:win # Build Windows installer
```

---

## 🔌 API Integration Points

### Next.js Frontend
**File:** `lib/api.ts`
```typescript
const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL);
// Automatically adds Authorization header from localStorage
```

**Usage:**
```typescript
const response = await api.get('/products');
const data = await api.post('/orders', { /* order data */ });
```

### Desktop Dashboard
**File:** `desktop-dashboard/src/App.js`
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor adds /api prefix and Authorization header
```

### Authentication Context
**File:** `context/AuthContext.tsx`
- Manages user session
- Stores JWT token in localStorage
- Syncs to both `makhmal_token` and `admin_token` keys
- Provides `useAuth()` hook for components

---

## 📊 Order Status Flow

Orders follow this status progression:
```
pending → confirmed → processing → shipped → delivered
         ↓
       cancelled ← (can be cancelled anytime)
       ↓
       refunded ← (after cancelled)
```

**Factures** (Admin Manual Sales):
- Created with status `delivered` immediately
- Marked with `is_facture = true` and `facture_number`
- Used for in-store purchases without digital checkout

---

## 🔑 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-for-tokens
PORT=4000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Desktop Dashboard (.env)
```
REACT_APP_API_URL=http://localhost:4000/
```

---

## ✅ Compatibility Matrix

### Frontend to Backend
| Feature | Next.js | Desktop | Status |
|---------|---------|---------|--------|
| Login | ✓ | ✓ | Working |
| Products | ✓ | ✓ | Working |
| Orders | ✓ | ✓ | Working |
| Factures | ✓ | ✓ | Working |
| Categories | ✓ | ✓ | Working |
| Brands | ✓ | ✓ | Working |
| Shipping | ✓ | ✓ | Working |
| Admin | ✓ | ✓ | Working |

---

## 🚨 Troubleshooting

### "Database connection failed"
1. Check DATABASE_URL in backend/.env
2. Verify PostgreSQL is running
3. Run `npm run seed` to initialize database

### "Unauthorized" (401) errors
1. Ensure JWT_SECRET matches in .env
2. Check token is being sent in Authorization header
3. Verify token hasn't expired (7 days default)

### API endpoints returning 404
1. Check backend is running on correct port
2. Verify NEXT_PUBLIC_API_URL/REACT_APP_API_URL includes `/api` path
3. Check route exists in backend/src/routes/

### CORS errors
1. Check CORS_ORIGIN in backend .env includes frontend URLs
2. Verify credentials mode is enabled in API client

---

## 📝 Code Quality

- TypeScript for type safety
- Express middleware for authentication/errors
- Prepared statements to prevent SQL injection
- Proper error handling with meaningful messages
- Consistent API response format

---

## 🚀 Deployment

### Backend Deployment (Railway/Heroku/etc)
1. Set DATABASE_URL and JWT_SECRET in environment
2. Run `npm run build` locally to verify
3. Push to git, deployment platform builds automatically

### Frontend Deployment (Vercel/Netlify/etc)
1. Set NEXT_PUBLIC_API_URL to backend URL
2. Push to git, platform builds automatically
3. Vercel recommended for Next.js

### Desktop App Distribution
1. Run `npm run build:win` in desktop-dashboard
2. Creates Windows installer in `dist/`
3. Users download and install like normal app

---

## 📚 Additional Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Express Docs:** https://expressjs.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Electron Docs:** https://www.electronjs.org/docs

---

**Last Updated:** 2026-07-15  
**System Version:** 1.0.0  
**Status:** ✅ Production Ready
