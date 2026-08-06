import api from './api';

export const userService = {
  getUsers: async (search = '', page = 1, limit = 10) => {
    return await api.get(`/users?search=${search}&page=${page}&limit=${limit}`);
  },
  createUser: async (userData) => {
    return await api.post('/users', userData);
  },
  updateUser: async (id, userData) => {
    return await api.put(`/users/${id}`, userData);
  },
  resetPassword: async (userId, newPassword) => {
    return await api.post('/users/reset-password', { userId, newPassword });
  },
  deleteUser: async (id) => {
    return await api.delete(`/users/${id}`);
  },
};

