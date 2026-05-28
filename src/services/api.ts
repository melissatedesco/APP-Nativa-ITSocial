import axios from 'axios';
import { storage } from '../utils/storage';
import { authEvents } from '../utils/authEvents';
import { networkEvents } from '../utils/networkEvents';
import { HOST, API_BASE_URL } from '../config';

export const MEDIA_BASE_URL = HOST;
const BASE_URL = API_BASE_URL;

// ─── JWT expiry check ────────────────────────────────────────────────────────
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now() - 30_000;
  } catch {
    return false;
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();

  if (token) {
    if (isTokenExpired(token)) {
      await storage.clearAuth();
      authEvents.emitAuthError();
      return Promise.reject(
        new axios.Cancel('Token scaduto. Effettua di nuovo il login.')
      );
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    networkEvents.emitOnline();
    return response;
  },
  async (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (!error.response && !axios.isCancel(error)) {
      networkEvents.emitOffline();
    }

    if (status === 401) {
      await storage.clearAuth();
      authEvents.emitAuthError();
    }

    return Promise.reject(error);
  }
);
