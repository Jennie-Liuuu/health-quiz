import axios from 'axios';

const API_BASE_URL = 'https://health-quiz-production.up.railway.app';

// 使用内存存储（不依赖 localStorage）
let memorySessionId: string | null = null;

// 尝试从 Cookie 读取（备用）
const getCookie = (name: string) => {
  try {
    const value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return value ? value.pop() : null;
  } catch {
    return null;
  }
};

const setCookie = (name: string, value: string) => {
  try {
    document.cookie = name + '=' + value + ';path=/;max-age=86400';
  } catch {
    // 忽略
  }
};

const getSessionId = () => {
  // 优先内存
  if (memorySessionId) return memorySessionId;
  // 其次 Cookie
  return getCookie('sessionId');
};

const setSessionId = (value: string) => {
  memorySessionId = value;
  setCookie('sessionId', value);
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  if (response.data?.sessionId) {
    setSessionId(response.data.sessionId);
  }
  return response;
});