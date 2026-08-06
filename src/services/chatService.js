import api from './api';

export const chatService = {
  getChatMessages: async (requestId) => {
    return await api.get(`/requests/${requestId}/chat`);
  },

  sendChatMessage: async (requestId, message) => {
    return await api.post(`/requests/${requestId}/chat`, { message });
  },
};
