import axios from 'axios';
import { storage } from '../utils/storage';
import { authEvents } from '../utils/authEvents';

const HOST = 'http://192.168.1.100:8080';
export const MEDIA_BASE_URL = HOST;
const BASE_URL = `${HOST}/api`;

console.log('🌐 API Base URL:', BASE_URL);

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
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  // FIX: parentesi esplicite per evitare precedenza errata tra ?? e +
  const fullUrl = (config.baseURL ?? '') + (config.url ?? '');
  console.log('[API →]', config.method?.toUpperCase(), fullUrl);

  const token = await storage.getToken();

  if (token) {
    if (isTokenExpired(token)) {
      console.warn('[API] token scaduto – logout automatico');
      await storage.clearAuth();
      authEvents.emitAuthError();
      return Promise.reject(
        new axios.Cancel('Token scaduto. Effettua di nuovo il login.')
      );
    }
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] token OK, lunghezza:', token.length);
  } else {
    console.warn('[API] nessun token – richiesta senza Authorization');
  }

  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    console.log('[API ←]', response.status, response.config.url);
    return response;
  },
  async (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // ── Debug completo: parentesi corrette attorno alla concatenazione ────────
    const cfg = error.config;
    const fullUrl = (cfg?.baseURL ?? '') + (cfg?.url ?? '');
    console.error('[API ERRORE] ─────────────────────────────────────');
    console.error('  URL      :', fullUrl);
    console.error('  Metodo   :', cfg?.method?.toUpperCase() ?? 'N/D');
    console.error('  Headers  :', JSON.stringify(cfg?.headers ?? {}));
    console.error('  Data     :', JSON.stringify(cfg?.data ?? null));
    console.error('  Timeout  :', cfg?.timeout);
    console.error('  Status   :', error.response?.status ?? 'nessuna risposta (ERR_NETWORK / timeout)');
    console.error('  Msg      :', error.message);
    console.error('  Code     :', error.code);
    try { console.error('  JSON     :', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch {}
    console.error('─────────────────────────────────────────────────');

    const status = error.response?.status;

    if (status === 401) {
      await storage.clearAuth();
      authEvents.emitAuthError();
    }

    return Promise.reject(error);
  }
);
