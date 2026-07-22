# Makhmal Admin Desktop Dashboard

A desktop application for managing the Makhmal e-commerce platform. Runs locally on your computer and connects to the Railway backend.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Windows 10/11 (for building Windows app)

## Installation & Setup

1. **Navigate to the desktop-dashboard folder:**
```bash
cd desktop-dashboard
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure the backend URL (optional):**
   
   Edit `.env` file to match your Railway backend URL:
   ```
   REACT_APP_API_URL=https://your-railway-url.up.railway.app
   ```

4. **Build the application:**
```bash
npm run build:win
```

5. **Install the application:**
   
   After building, you'll find the installer in the `dist/` folder:
   - `Makhmal Admin Dashboard Setup.exe` - Windows installer

6. **Run the application:**
```bash
npm start
```

## Development Mode

To run in development with hot reloading:
```bash
npm run dev
```

This will:
- Start React dev server on http://localhost:3001
- Launch Electron with DevTools open
- Auto-reload on code changes

## Building for Production

### Windows
```bash
npm run build:win
```
Output: `dist/Makhmal Admin Dashboard Setup.exe`

### Mac
```bash
npm run build:mac
```
Output: `dist/Makhmal Admin Dashboard.dmg`

### Linux
```bash
npm run build:linux
```
Output: `dist/Makhmal Admin Dashboard.AppImage`

## Features

- 📊 **Dashboard** - View sales, orders, revenue, and analytics
- 📦 **Products** - Manage product inventory with images
- 🏷️ **Categories** - Organize product categories
- 🎨 **Brands** - Manage brand partnerships
- 📋 **Orders** - Track and update order status (pending → confirmed → shipped → delivered)
- 🚚 **Shipping** - Configure delivery methods
- 📧 **Newsletter** - Manage email subscribers

## How It Works

1. **Local Frontend**: The React app builds locally and runs on the user's computer
2. **Backend Connection**: Connects to your Railway-deployed backend via internet
3. **Data Sync**: All data is fetched from and saved to the Railway database
4. **No Local Database**: Everything is stored in the cloud (Railway PostgreSQL)

## Troubleshooting

### White Screen Issue
If you see a white screen:
1. Make sure you've run `npm run build` first
2. Check that the backend URL in `.env` is correct
3. Ensure the backend is running and accessible

### Build Errors
If you get build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Try building again

### Connection Issues
If the app can't connect to backend:
1. Verify the Railway backend is deployed and running
2. Check the URL in `.env` matches your Railway URL
3. Ensure CORS is configured on the backend

## Configuration

### Backend URL
Edit `.env` file:
```
REACT_APP_API_URL=https://your-backend-url.up.railway.app
```

### Icon
The app icon is located at `assets/icon.ico`. Replace it with your own icon file.

## Distribution

To distribute to clients:
1. Build the app: `npm run build:win`
2. Share the installer from `dist/` folder
3. Client installs and runs the app
4. App automatically connects to your Railway backend

## Security

- The app uses demo login (any credentials work)
- For production, implement proper authentication
- All API calls use HTTPS
- Admin token is stored in localStorage

## Support

For issues or questions, contact the Makhmal development team.