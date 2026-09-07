import api from './api';

export const branchService = {
  getBranches: async (search = '', page = 1, limit = 50, department = '') => {
    const params = new URLSearchParams({ search, page, limit });
    if (department) params.set('department', department);
    return await api.get(`/branches?${params.toString()}`);
  },
  createBranch: async (branchData) => {
    return await api.post('/branches', branchData);
  },
  updateBranch: async (id, branchData) => {
    return await api.put(`/branches/${id}`, branchData);
  },
};
