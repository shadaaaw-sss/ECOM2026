# Local Development Setup Guide

This guide will help you set up the Makhmal e-commerce project for local development.

## Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/windows/)
3. **Git** - [Download here](https://git-scm.com/download/win)

## Quick Start

### 1. Install PostgreSQL

Download and install PostgreSQL from https://www.postgresql.org/download/windows/

During installation:
- Set a password for the `postgres` user (remember this!)
- Keep the default port `5432`
- Keep the default database `postgres`

### 2. Set Up Local Database

Run the setup script:

```powershell
# From the project root directory
.\scripts\setup-local-db.ps1
```

This will:
- Create a new database called `makhmal_db`
- Run the seed script to create all tables
- Insert sample data (brands, categories, products, admin user)

### 3. Configure Backend

Update `backend/.env` with your local PostgreSQL credentials:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/makhmal_db
JWT_SECRET=EoUpFxe6wAyJXTw7dRf4LpXfO6RGgvXserD1wMIJ
JWT_REFRESH_SECRET=STOhrXDceZOKf29vC3n37nBvwrL1nC0EM02SoLQT
CORS_ORIGIN=http://localhost:3000

# Keep the rest of the variables as they are (R2, SMTP, etc.)
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

### 4. Start the Backend

```powershell
cd backend
npm run dev
```

You should see:
```
✓ Database connection established
Backend listening on port 4000
```

### 5. Start the Frontend

Open a new terminal:

```powershell
npm run dev
```

You should see:
```
- Local: http://localhost:3000
✓ Ready in 4.2s
```

### 6. Access the Application

Open your browser and go to: http://localhost:3000

## Default Admin Account

After running the seed script, you can log in with:

- **Email:** `admin@makhmal.com`
- **Password:** `Admin123!`

## Troubleshooting

### Database Connection Issues

**Error: "Database connection attempt failed"**

1. Make sure PostgreSQL is running:
   ```powershell
   # Check if PostgreSQL service is running
   Get-Service -Name "postgresql*"
   ```

2. Start PostgreSQL if it's not running:
   ```powershell
   # Start PostgreSQL service
   Start-Service -Name "postgresql-x64-14"  # Adjust version number as needed
   ```

3. Verify your credentials in `backend/.env`:
   - Username: `postgres`
   - Password: The password you set during installation
   - Database: `makhmal_db`
   - Host: `localhost`
   - Port: `5432`

### Port Already in Use

**Error: "Port 4000 is already in use"**

```powershell
# Find and kill the process using port 4000
$pid = netstat -ano | findstr :4000 | Select-Object -First 1
Stop-Process -Id $pid -Force
```

### Frontend Not Loading

**Error: "Cannot connect to backend"**

1. Make sure the backend is running on port 4000
2. Check that `NEXT_PUBLIC_API_URL` in `.env` is set to `http://localhost:4000/api`
3. Clear Next.js cache:
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

## Project Structure

```
ECOM2026/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, etc.
│   │   └── index.ts        # Server entry point
│   ├── drizzle/            # Database schema and seed
│   └── .env                # Backend configuration
├── app/                    # Next.js frontend
│   ├── products/           # Product pages
│   ├── auth/               # Authentication pages
│   ├── admin/              # Admin dashboard
│   └── ...
├── components/             # Reusable React components
├── context/                # React context providers
├── lib/                    # Utilities and API client
└── scripts/                # Setup and utility scripts
```

## Available Scripts

### Backend
```powershell
cd backend
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Start production server
```

### Frontend
```powershell
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
```

## Database Schema

The database includes the following tables:
- `user` - User accounts
- `product` - Products
- `category` - Product categories
- `brand` - Product brands
- `order` - Customer orders
- `order_item` - Order line items
- `wishlist_item` - User wishlists
- `coupon` - Discount coupons
- `shipping_method` - Shipping options
- `newsletter_subscriber` - Newsletter subscribers
- `setting` - Application settings

## Next Steps

1. **Customize the store**: Update products, categories, and brands in the admin panel
2. **Configure email**: Update SMTP settings in `backend/.env` for email verification
3. **Configure storage**: Update R2/Supabase settings for image uploads
4. **Deploy**: Follow the deployment guide in `docs/railway-deployment.md`

## Need Help?

- Check the console logs for error messages
- Verify all environment variables are set correctly
- Make sure PostgreSQL is running and accessible
- Check that ports 3000 and 4000 are not in use by other applications