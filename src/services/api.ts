import axios from 'axios';
import { storage } from '../utils/storage';

// IP locale del PC — deve essere sulla stessa rete WiFi del telefono
const HOST = 'http://192.168.1.8:8080';
export const MEDIA_BASE_URL = HOST;
const BASE_URL = `${HOST}/api`;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAuth();
    }
    return Promise.reject(error);
  }
);
