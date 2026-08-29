import axios from 'axios';

const API_BASE_URL = 'https://health-quiz-production.up.railway.app';

// 安全的 localStorage 操作
const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // 忽略
    }
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const sessionId = safeLocalStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  if (response.data?.sessionId) {
    safeLocalStorage.setItem('sessionId', response.data.sessionId);
  }
  return response;
});