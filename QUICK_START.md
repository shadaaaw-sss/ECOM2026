# Makhmal E-Commerce - Quick Start Guide

## 🎯 What's New (Fixed)

### ✅ Unified Database
- **Old:** Separate Supabase schema and custom backend schema
- **New:** Single clean PostgreSQL schema for both frontend and backend
- **Result:** No compatibility issues, consistent data model

### ✅ Authentication System
- **Old:** Mixed Supabase auth and custom JWT
- **New:** Unified JWT-based authentication
- **Result:** Works everywhere with same token

### ✅ API Consistency
- **Old:** Inconsistent routes and response formats
- **New:** All routes follow REST patterns with consistent responses
- **Result:** Frontend and desktop dashboard both work seamlessly

### ✅ Desktop Dashboard
- **Old:** Dummy login and sidebar issues
- **New:** Real authentication against backend, proper layout
- **Result:** Fully functional admin interface

### ✅ Facture System
- **Old:** Column mismatches and incomplete implementation
- **New:** Complete facture (manual sale) system for in-store purchases
- **Result:** Admin can create factures from both web and desktop apps

---

## 🚀 Quick Start (5 minutes)

### 1. Initialize Database
```bash
cd backend
npm run seed
# Creates fresh database with admin user
# Email: admin@makhmal.com
# Password: admin123
```

### 2. Start Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:4000
```

### 3. Start Frontend (Terminal 2)
```bash
# From root directory
npm run dev
# Runs on http://localhost:3000
```

### 4. Start Desktop Dashboard (Terminal 3)
```bash
cd desktop-dashboard
npm run dev
# Opens Electron app
```

### 5. Test Everything
- **Website:** http://localhost:3000
  - Click "Sign In" → Use admin@makhmal.com / admin123
  - Go to /admin to see admin dashboard

- **Desktop App:** Electron window
  - Sign in with admin@makhmal.com / admin123
  - See orders, factures, products etc.

---

## 📱 What Can Each App Do?

### Website (Next.js)
- Browse products
- View categories and brands
- Add to cart and checkout
- View order history
- Admin dashboard
  - Manage products, categories, brands
  - View orders and update status
  - Create factures (manual sales)
  - Manage shipping methods

### Desktop Dashboard (Electron)
- Admin login
- Full order management
- Facture creation (in-store sales)
- Product inventory management
- Real-time data sync with backend

### Backend (REST API)
- Serves both frontend and desktop app
- Handles authentication
- Manages all data
- Provides consistent endpoints

---

## 🔑 Admin Features

### From Website (/admin)
1. **Dashboard:** Sales overview and stats
2. **Products:** CRUD operations
3. **Categories:** Create/edit categories
4. **Brands:** Manage brands
5. **Orders:** View and update status
6. **Factures:** Create manual sale invoices
7. **Shipping:** Configure shipping methods

### From Desktop Dashboard
- Same features as website
- Optimized for desktop workflow
- Better for high-volume operations

---

## 🔗 API Endpoints Quick Reference

### Always Include Header
```
Authorization: Bearer <your_jwt_token>
```

### Common Requests

**Get Products**
```bash
curl http://localhost:4000/api/products?page=1&limit=12
```

**Create Order**
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [...], "firstName": "John", ...}'
```

**Create Facture (Admin Only)**
```bash
curl -X POST http://localhost:4000/api/factures \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customerName": "...", "items": [...]}'
```

**Update Order Status (Admin Only)**
```bash
curl -X PATCH http://localhost:4000/api/orders/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

---

## 🗄️ Database

### Reset Database (Start Fresh)
```bash
cd backend
npm run seed
```

This will:
1. Drop all existing tables
2. Create fresh schema
3. Add admin user (admin@makhmal.com / admin123)
4. Add sample brand, category, and product

### Connect Directly to Database
```bash
psql postgresql://user:password@localhost:5432/makhmal_db
# View tables: \dt
# Query orders: SELECT * FROM "order";
```

---

## 🚨 Common Issues & Fixes

### Issue: "Cannot POST /api/orders"
**Fix:** Backend not running. Run `npm run dev` in backend folder.

### Issue: "Unauthorized" when creating factures
**Fix:** You must be SUPERADMIN role. Check your token role.

### Issue: Desktop app shows "Invalid credentials"
**Fix:** Backend password hashing may differ. Run `npm run seed` to create fresh admin.

### Issue: Products not showing on frontend
**Fix:** Run `npm run seed` to add sample products.

### Issue: CORS error "Access to XMLHttpRequest blocked"
**Fix:** Check CORS_ORIGIN in backend .env includes your frontend URL.

---

## 📊 Sample Data

After running `npm run seed`, you get:

**Admin User**
- Email: admin@makhmal.com
- Password: admin123
- Role: SUPERADMIN

**Sample Brand**
- Name: Luxury Skincare
- Logo: (empty)

**Sample Category**
- Name: Skincare

**Sample Product**
- Name: Luxury Face Cream
- Price: $125
- Stock: 50 units

---

## 🔐 Security Notes

⚠️ **For Development Only:**
- Default admin password is simple
- JWT_SECRET is exposed in .env.example
- CORS is wide open for localhost

✅ **For Production:**
1. Change admin password immediately
2. Use strong JWT_SECRET (32+ chars)
3. Set specific CORS_ORIGIN URLs
4. Use HTTPS only
5. Enable rate limiting
6. Add input validation
7. Regular security audits

---

## 📈 Next Steps

1. **Customize Branding**
   - Edit colors in tailwind.config.ts
   - Update logos in public/
   - Modify text in lib/translations.ts

2. **Add More Products**
   - Use admin dashboard
   - Or insert directly via API

3. **Configure Shipping**
   - Add shipping methods in admin
   - Set prices per method

4. **Set Up Email**
   - Configure SMTP in backend
   - Update email templates in src/utils/email.ts

5. **Deploy**
   - Backend to Railway/Heroku
   - Frontend to Vercel/Netlify
   - Desktop as Windows installer

---

## 📚 File Locations

- **Backend Code:** `backend/src/`
- **Frontend Code:** `app/`, `components/`, `lib/`, `context/`
- **Desktop Code:** `desktop-dashboard/src/App.js`
- **Database Migrations:** `supabase/migrations/`
- **API Documentation:** This file + SYSTEM_ARCHITECTURE.md
- **Config Files:** `next.config.js`, `tailwind.config.ts`, `tsconfig.json`

---

## ✅ Verification Checklist

- [ ] Backend builds without errors
- [ ] Frontend builds without errors  
- [ ] Desktop dashboard builds without errors
- [ ] Database initializes successfully
- [ ] Can login with admin@makhmal.com
- [ ] Can view products
- [ ] Can create orders
- [ ] Can create factures
- [ ] Admin dashboard loads
- [ ] Desktop app shows data

---

**Get Started:** Run `npm run seed` then `npm run dev` in backend! 🚀
