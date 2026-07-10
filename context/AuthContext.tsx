'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'makhmal_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!token) {
      setLoading(false);
      return;
    }

    api.get<{ user: AuthUser }>('/auth/me')
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      }
      setUser(response.user);
      return { error: null };
    } catch (error: any) {
      return { error: error.message ?? 'Unable to sign in' };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      await api.post<{ message: string }>('/auth/register', { email, password, firstName, lastName });
      return { error: null };
    } catch (error: any) {
      return { error: error.message ?? 'Unable to create account' };
    }
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '/';
    } else {
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}