import api from './api';

export const monitorService = {
  sendReminder: async (reminderData) => {
    return await api.post('/monitor/remind', reminderData);
  },
};
