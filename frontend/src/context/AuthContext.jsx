import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [company, setCompany] = useState(() => {
    const stored = localStorage.getItem('auth_company');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_company', JSON.stringify(data.company));
    setCompany(data.company);
    return data;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await authApi.signup(payload);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_company', JSON.stringify(data.company));
    setCompany(data.company);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_company');
    setCompany(null);
  }, []);

  return (
    <AuthContext.Provider value={{ company, login, signup, logout, isAuthenticated: !!company }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
