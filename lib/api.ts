const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

const AUTH_TOKEN_KEY = 'makhmal_token';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (this.baseUrl.endsWith('/api')) {
      return `${this.baseUrl}${normalizedPath}`;
    }
    return `${this.baseUrl}${normalizedPath.startsWith('/api') ? normalizedPath : `/api${normalizedPath}`}`;
  }

  private getHeaders(skipContentType?: boolean): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    if (res.status === 204) return undefined as any;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Request failed: ${res.status}`);
      }
      return data;
    }
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return undefined as any;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(this.buildUrl(path), { headers: this.getHeaders() });
    return this.parseResponse<T>(res);
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: this.getHeaders(isFormData),
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(res);
  }

  async patch<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseResponse<T>(res);
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.parseResponse<T>(res);
  }

  static setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }

  static clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  }
}

export const api = new ApiClient(API_BASE);