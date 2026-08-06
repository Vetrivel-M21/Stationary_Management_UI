import api from './api';

export const chatService = {
  getChatMessages: async (requestId) => {
    return await api.get(`/requests/${requestId}/chat`);
  },

  sendChatMessage: async (requestId, message) => {
    return await api.post(`/requests/${requestId}/chat`, { message });
  },

  getReadCount: (userId, requestId) => {
    if (!userId || !requestId) return 0;
    try {
      const data = JSON.parse(localStorage.getItem(`chat_read_counts_${userId}`) || '{}');
      return data[requestId] || 0;
    } catch (e) {
      return 0;
    }
  },

  markChatAsRead: (userId, requestId, totalCount) => {
    if (!userId || !requestId) return;
    try {
      const key = `chat_read_counts_${userId}`;
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      data[requestId] = Math.max(data[requestId] || 0, totalCount || 0);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save chat read state', e);
    }
  },

  getUnreadCount: (userId, requestId, totalChatCount) => {
    if (!totalChatCount || totalChatCount <= 0) return 0;
    const readCount = chatService.getReadCount(userId, requestId);
    const unread = totalChatCount - readCount;
    return unread > 0 ? unread : 0;
  },
};

