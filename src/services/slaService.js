import api from './api';

export const slaService = {
  getSlaSettings: async () => {
    const response = await api.get('/sla-settings');
    return response.data;
  },

  updateSlaSettings: async (settings) => {
    const response = await api.put('/sla-settings', settings);
    return response.data;
  },

  getDelayedOrders: async (department = '') => {
    const response = await api.get('/monitor/delayed-orders', {
      params: { department },
    });
    return response.data;
  },
};
