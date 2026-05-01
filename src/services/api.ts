import axios from 'axios';
import { storage } from '../utils/storage';

// IP locale del PC — deve essere sulla stessa rete WiFi del telefono
const HOST = 'http://192.168.1.101:8080';
export const MEDIA_BASE_URL = HOST;
const BASE_URL = `${HOST}/api`;
console.log('🌐 API Base URL:', BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const fullUrl = (config.baseURL ?? '') + (config.url ?? '');
  console.log('[API] →', config.method?.toUpperCase(), fullUrl);
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] token presente');
  } else {
    console.warn('[API] nessun token');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('[API] Errore risposta:', {
      url: error.config?.url,
      status: error.response?.status ?? 'nessuna risposta (network error o timeout)',
      message: error.message,
      code: error.code,
    });
    if (error.response?.status === 401) {
      await storage.clearAuth();
    }
    return Promise.reject(error);
  }
);
