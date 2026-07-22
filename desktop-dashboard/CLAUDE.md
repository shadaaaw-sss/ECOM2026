# Makhmal Desktop Dashboard — CLAUDE.md

## Stack
- **Shell**: Electron (main process: `main.js`, preload: `preload.js`)
- **Renderer**: React (Create React App) in `src/`
- **API**: custom `ApiService` class in `src/services/api.js` with auto health checks
- **Build**: `react-scripts` for the React app, `electron-builder` for packaging

## Project Structure
```
desktop-dashboard/
  main.js                   # Electron main process: BrowserWindow, CSP, IPC handlers
  preload.js                # Secure bridge: exposes set-api-url, get-api-url-preference
  src/
    services/
      api.js                # ApiService: initialize(), checkHealth(), subscribe(), startHealthChecks()
    App.js                  # Root component with connection status badge, settings modal
    App.css                 # Styles
  public/
    index.html              # CRA entry point
  assets/                   # Icons, static assets
  build/                    # React build output (compiled)
  dist/                     # Electron-builder output (packaged app)
```

## Conventions
- **Communication**: React ↔ Electron via `window.electronAPI` (exposed by preload.js)
- **API URL**: stored in `localStorage('api_url_preference')`, persist across restarts
- **Health checks**: `apiService.startHealthChecks(30000)` polls every 30s, shows connection status (Wifi/WifiOff) with green/red dot
- **Settings modal**: in-app modal to switch between `http://localhost:4000` (local) and Railway production URL
- **CSP**: tight Content-Security-Policy set in `main.js` (frame-ancestors 'none', base-uri 'self', form-action 'self')

## IPC Channels
| Channel | Direction | Description |
|---------|-----------|-------------|
| `set-api-url` | Renderer → Main | Store API URL preference via electron-store |
| `get-api-url-preference` | Renderer → Main | Retrieve stored preference |
| `set-title` | Renderer → Main | Update window title (reserved) |

## Key Patterns
- **Startup flow**: `App.js` → `apiService.initialize()` → `apiService.checkHealth()` → render dashboard
- **Connection indicator**: `<Wifi />` (green dot) / `<WifiOff />` (red dot) in header, updates on each health check
- **URL switching**: Settings modal → change URL → test connection → save to localStorage + electron-store
- **Error state**: red connection indicator + disabled interactive elements when backend unreachable
- **Security**: no `nodeIntegration`, no `contextIsolation: false`, CSP blocks inline scripts

## Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Electron + React dev server concurrently |
| `npm run build` | Build React app for production |
| `npm run electron-dev` | Start React dev server only |
| `npm run electron-start` | Start Electron pointing at port 3000 |

## API Service Usage
```js
import apiService from './services/api';

// Initialize with a base URL
apiService.initialize('http://localhost:4000');

// Check connectivity
const healthy = await apiService.checkHealth();

// Subscribe to health status changes
const unsub = apiService.subscribe((healthy) => {
  // Update UI based on healthy (boolean)
});

// Start periodic health checks
apiService.startHealthChecks(30000);
apiService.stopHealthChecks();
```

## Environment
`REACT_APP_API_URL=http://localhost:4000` (fallback, overridden by localStorage preference)
