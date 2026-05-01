import axios from 'axios';
import { storage } from '../utils/storage';
import { authEvents } from '../utils/authEvents';

const HOST = 'http://192.168.1.101:8080';
export const MEDIA_BASE_URL = HOST;
const BASE_URL = `${HOST}/api`;
console.log('🌐 API Base URL:', BASE_URL);

// ─── JWT expiry check (no external lib needed) ────────────────────────────────
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    // base64url → base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    if (!decoded.exp) return false; // no expiry claim = never expires
    // exp is in seconds; add 30s buffer to account for clock skew
    return decoded.exp * 1000 < Date.now() - 30_000;
  } catch {
    return false; // if decode fails, let the server decide
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // increased from 5000 – local WiFi + DB queries can be slow
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const fullUrl = (config.baseURL ?? '') + (config.url ?? '');
  console.log('[API] →', config.method?.toUpperCase(), fullUrl);

  const token = await storage.getToken();

  if (token) {
    if (isTokenExpired(token)) {
      // Token scaduto: pulisci sessione e segnala al AuthContext
      console.warn('[API] token scaduto – logout automatico');
      await storage.clearAuth();
      authEvents.emitAuthError();
      // Reject the request immediately so the UI can react
      return Promise.reject(
        new axios.Cancel('Token scaduto. Effettua di nuovo il login.')
      );
    }
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] token presente');
  } else {
    console.warn('[API] nessun token');
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error)) {
      // Already handled above (expired token cancel)
      return Promise.reject(error);
    }

    console.error('[API] Errore risposta:', {
      url: error.config?.url,
      status: error.response?.status ?? 'nessuna risposta (network error o timeout)',
      message: error.message,
      code: error.code,
    });

    const status = error.response?.status;

    // 401 = not authenticated at all
    if (status === 401) {
      await storage.clearAuth();
      authEvents.emitAuthError();
    }

    return Promise.reject(error);
  }
);
