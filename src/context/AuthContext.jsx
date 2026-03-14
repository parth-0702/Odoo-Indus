import { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ci_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ci_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      const { token: t, user: u } = res.data;
      localStorage.setItem('ci_token', t);
      localStorage.setItem('ci_user', JSON.stringify(u));
      setToken(t);
      setUser(u);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const res = await registerApi({ name, email, password, role });
      const { token: t, user: u } = res.data;
      localStorage.setItem('ci_token', t);
      localStorage.setItem('ci_user', JSON.stringify(u));
      setToken(t);
      setUser(u);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('ci_token');
    localStorage.removeItem('ci_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
