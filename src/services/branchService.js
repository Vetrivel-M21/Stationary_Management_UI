import api from './api';

export const branchService = {
  getBranches: async (search = '', page = 1, limit = 50) => {
    return await api.get(`/branches?search=${search}&page=${page}&limit=${limit}`);
  },
  createBranch: async (branchData) => {
    return await api.post('/branches', branchData);
  },
  updateBranch: async (id, branchData) => {
    return await api.put(`/branches/${id}`, branchData);
  },
};
