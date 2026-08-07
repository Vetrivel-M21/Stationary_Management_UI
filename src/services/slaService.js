import api from './api';

export const slaService = {
  getSlaSettings: async () => {
    return await api.get('/sla-settings');
  },

  updateSlaSettings: async (settings) => {
    return await api.put('/sla-settings', settings);
  },

  getDelayedOrders: async (department = '') => {
    return await api.get('/monitor/delayed-orders', {
      params: { department },
    });
  },
};
