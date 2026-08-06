import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const normalizeUser = (u) => {
  if (!u) return null;
  let roleName = typeof u.role === 'object' && u.role !== null ? u.role.name : (u.role || '');
  return {
    ...u,
    role: roleName,
    roleObject: typeof u.role === 'object' ? u.role : null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stationery_user');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('stationery_token'));
  const [loading, setLoading] = useState(false);

  const login = async (mobile, password) => {
    setLoading(true);
    try {
      const res = await authService.login(mobile, password);
      if (res.success) {
        const normUser = normalizeUser(res.data.user);
        setToken(res.data.token);
        setUser(normUser);
        localStorage.setItem('stationery_token', res.data.token);
        localStorage.setItem('stationery_user', JSON.stringify(normUser));
        return res.data;
      }
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    const res = await authService.changePassword(oldPassword, newPassword);
    if (res.success && user) {
      const updatedUser = { ...user, firstLogin: false };
      setUser(updatedUser);
      localStorage.setItem('stationery_user', JSON.stringify(updatedUser));
    }
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
