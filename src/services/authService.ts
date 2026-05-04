import axios from 'axios';
import { api, MEDIA_BASE_URL } from './api';
import { LoginResponse, LoginCredentials, RegisterData } from '../types';

// fetch()-based fallback: used when Axios gets ERR_NETWORK on login.
// fetch() uses a different underlying path in React Native's network stack
// and may succeed where XMLHttpRequest (Axios) fails.
async function loginWithFetch(credentials: LoginCredentials): Promise<LoginResponse> {
  const url = `${MEDIA_BASE_URL}/api/auth/login`;
  console.log('[authService] fetch() fallback →', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const text = await res.text();
  console.log('[authService] fetch() status:', res.status, 'body:', text.slice(0, 200));
  if (!res.ok) {
    const err = new Error(`Login failed: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return JSON.parse(text) as LoginResponse;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', credentials);
      return data;
    } catch (err) {
      // On pure network failure (no response from server) try the fetch() path.
      if (axios.isAxiosError(err) && !err.response) {
        console.warn('[authService] Axios ERR_NETWORK – retrying with fetch()');
        return loginWithFetch(credentials);
      }
      throw err;
    }
  },

  async register(registerData: RegisterData): Promise<void> {
    await api.post('/auth/registrazione', registerData);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async richiestaReset(email: string): Promise<void> {
    await api.post('/auth/password-dimenticata', { email });
  },

  async verificaCodice(codice: string): Promise<void> {
    await api.post('/auth/verifica-codice', { codice });
  },

  async nuovaPassword(codice: string, nuovaPassword: string): Promise<void> {
    await api.post('/auth/nuova-password', { codice, nuovaPassword });
  },
};
