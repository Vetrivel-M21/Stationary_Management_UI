import api from './api';

export const authService = {
  login: async (identifier, password) => {
    return await api.post('/auth/login', { identifier, password });
  },
  changePassword: async (oldPassword, newPassword) => {
    return await api.post('/auth/change-password', { oldPassword, newPassword });
  },
  getMe: async () => {
    return await api.get('/auth/me');
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('stationery_token');
      localStorage.removeItem('stationery_user');
    }
  },
};
