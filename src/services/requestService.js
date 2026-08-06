import api from './api';

export const requestService = {
  createRequest: async (requestData) => {
    return await api.post('/requests', requestData);
  },
  getRequests: async (status = '', page = 1, limit = 20) => {
    return await api.get(`/requests?status=${status}&page=${page}&limit=${limit}`);
  },
  getRequestById: async (id) => {
    return await api.get(`/requests/${id}`);
  },
  processApproval: async (id, approvalData) => {
    return await api.post(`/requests/${id}/approve`, approvalData);
  },
  processDelivery: async (id, deliveryData) => {
    return await api.post(`/requests/${id}/deliver`, deliveryData);
  },
  processVerification: async (id, verificationData) => {
    return await api.post(`/requests/${id}/verify`, verificationData);
  },
  getDashboardMetrics: async () => {
    return await api.get('/dashboard/metrics');
  },
  getAuditLogs: async (page = 1, limit = 20) => {
    return await api.get(`/dashboard/audit-logs?page=${page}&limit=${limit}`);
  },
};
