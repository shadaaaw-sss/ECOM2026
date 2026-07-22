import axios from 'axios';

class ApiService {
  constructor() {
    this.healthCheckInterval = null;
    this.isOnline = false;
    this.listeners = new Set();

    this.baseUrl = this.getInitialBaseUrl();
    this.api = this.createAxiosInstance(this.baseUrl);
    this.setupInterceptors();
  }

  getInitialBaseUrl() {
    // In Electron renderer, we can't access process.env directly after build
    // We'll get the URL from the main process via IPC, fallback to env
    const envUrl = window.__REACT_APP_API_URL__ ||
                   process.env.REACT_APP_API_URL ||
                   'http://localhost:4000';

    return envUrl.replace(/\/$/, '');
  }

  createAxiosInstance(baseUrl) {
    return axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  setupInterceptors() {
    // Request interceptor: add /api prefix and auth token
    this.api.interceptors.request.use((config) => {
      if (config.url && !config.url.startsWith('/api/')) {
        config.url = '/api' + config.url;
      }
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error);
      }
    );
  }

  // Update the base URL dynamically (e.g., when user switches between local/production)
  async setBaseUrl(newBaseUrl) {
    const normalizedUrl = newBaseUrl.replace(/\/$/, '');

    // Test the new URL with a health check
    const isHealthy = await this.testConnection(normalizedUrl);

    if (isHealthy) {
      this.baseUrl = normalizedUrl;
      this.api.defaults.baseURL = normalizedUrl;
      localStorage.setItem('admin_api_url', normalizedUrl);
      return true;
    }

    return false;
  }

  // Get current base URL
  getBaseUrl() {
    return this.baseUrl;
  }

  // Test connection to a specific URL
  async testConnection(url) {
    const testUrl = url || this.baseUrl;
    try {
      const response = await axios.get(`${testUrl}/api/health`, { timeout: 5000 });
      return response.status === 200 && response.data?.status === 'ok';
    } catch {
      return false;
    }
  }

  // Check current connection health
  async checkHealth() {
    try {
      const response = await this.api.get('/health');
      const wasOffline = !this.isOnline;
      this.isOnline = true;
      if (wasOffline) this.notifyListeners(true);
      return response.data;
    } catch {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      if (wasOnline) this.notifyListeners(false);
      return null;
    }
  }

  // Start periodic health checks
  startHealthChecks(intervalMs = 30000) {
    if (this.healthCheckInterval) return;

    // Initial check
    this.checkHealth();

    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  // Stop health checks
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Subscribe to online/offline status changes
  subscribe(listener) {
    this.listeners.add(listener);
    // Immediately notify of current state
    listener(this.isOnline);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(online) {
    this.listeners.forEach(listener => listener(online));
  }

  isConnected() {
    return this.isOnline;
  }

  // HTTP methods
  async get(url, config) {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post(url, data, config) {
    const isFormData = data instanceof FormData;
    const response = await this.api.post(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
      },
    });
    return response.data;
  }

  async patch(url, data, config) {
    const response = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete(url, config) {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  // Initialize from saved preference or main process
  async initialize() {
    // Try to get URL from Electron main process (if available)
    if (typeof window !== 'undefined' && window.electron) {
      try {
        const url = await window.electron.invoke('get-api-url');
        if (url) {
          await this.setBaseUrl(url);
        }
      } catch (e) {
        console.warn('Could not get API URL from main process:', e);
      }
    }

    // Fallback to saved URL in localStorage
    const savedUrl = localStorage.getItem('admin_api_url');
    if (savedUrl && savedUrl !== this.baseUrl) {
      await this.setBaseUrl(savedUrl);
    }

    // Start health checks
    this.startHealthChecks();
  }
}

// Singleton instance
export const apiService = new ApiService();

// Export helper to get the service (for testing or advanced usage)
export function getApiService() {
  return apiService;
}
