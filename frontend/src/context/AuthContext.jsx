import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext(null);
const STORAGE_KEY = 'dayflow_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // hydrating from storage

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persist = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
  };

  const login = useCallback(async (email, password) => {
    const { token: t, user: u } = await authApi.login({ email, password });
    persist(u, t);
    return u;
  }, []);

  const signup = useCallback(async (payload) => {
    return authApi.signupEmployee(payload);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return authApi.forgotPassword({ email });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateLocalUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: next }));
      return next;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    isHR: user?.role === 'HR',
    login,
    signup,
    forgotPassword,
    logout,
    updateLocalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
