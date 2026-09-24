import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stationery_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const gatewayDeviceId =
      sessionStorage.getItem('gateway_device_id') || sessionStorage.getItem('device_id');
    const gatewayToken =
      sessionStorage.getItem('gateway_token') || sessionStorage.getItem('device_token');
    if (gatewayDeviceId) {
      config.headers['X-Gateway-Device-Id'] = gatewayDeviceId;
    }
    if (gatewayToken) {
      config.headers['X-Gateway-Token'] = gatewayToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('stationery_token');
      localStorage.removeItem('stationery_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
