import axios from 'axios';

const API_BASE_URL = 'https://health-quiz-production.up.railway.app';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  if (response.data?.sessionId) {
    localStorage.setItem('sessionId', response.data.sessionId);
  }
  return response;
});