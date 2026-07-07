const API_BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }

    throw new Error(
      'Missing NEXT_PUBLIC_API_URL. Set NEXT_PUBLIC_API_URL to your backend URL in production.'
    );
  }

  return 'http://localhost:4000/api';
})();

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('makhmal_token');
};

const isFormData = (body: unknown): body is FormData => typeof FormData !== 'undefined' && body instanceof FormData;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers as HeadersInit);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set JSON content-type when body exists and is not FormData
  const body = init?.body as any;
  if (body !== undefined && !isFormData(body)) {
    headers.set('Content-Type', 'application/json');
  }

  // If body is a plain object (not string/Blob/FormData), stringify it for fetch
  let finalBody: BodyInit | undefined = body;
  if (body !== undefined && !isFormData(body) && typeof body !== 'string' && !(body instanceof Blob)) {
    try {
      finalBody = JSON.stringify(body);
    } catch (e) {
      console.warn('Failed to stringify request body', e);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
      ...init,
      body: finalBody,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch failed')) {
      throw new Error('Server connection failed. Please ensure the backend server is running.');
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body as BodyInit }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body as BodyInit }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
