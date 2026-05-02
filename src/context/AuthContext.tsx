import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LoginResponse, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import { authEvents } from '../utils/authEvents';

// Converts raw Axios/network errors into readable Italian messages for the UI.
function parseAuthError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return new Error('Impossibile raggiungere il server. Controlla la connessione.');
    }

    const status = err.response.status;
    const serverMessage: string | undefined = err.response.data?.message;

    if (status === 401) return new Error('Credenziali non valide. Controlla username e password.');
    if (status === 403) return new Error('Accesso negato.');
    if (status === 404) return new Error('Utente non trovato.');
    if (status === 409 || serverMessage?.includes('già registrato')) {
      return new Error(serverMessage ?? 'Username o email già in uso.');
    }
    if (serverMessage) return new Error(serverMessage);
    if (status >= 500) return new Error('Errore del server. Riprova più tardi.');
  }
  return new Error('Si è verificato un errore imprevisto.');
}

interface AuthContextValue {
  user: LoginResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wire auto-logout: api.ts emits this event on 401 / expired JWT.
  useEffect(() => {
    authEvents.setOnAuthError(async () => {
      await storage.clearAuth();
      setToken(null);
      setUser(null);
    });
    return () => authEvents.clearOnAuthError();
  }, []);

  // On mount: restore persisted session so the user stays logged in after app restart.
  useEffect(() => {
    console.log('[AuthContext] avvio ripristino sessione');
    // Safety net: if storage hangs for any reason, unblock the UI after 3 s.
    const timeout = setTimeout(() => {
      console.warn('[AuthContext] timeout storage – sblocco UI');
      setIsLoading(false);
    }, 3000);

    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          storage.getToken(),
          storage.getUser<LoginResponse>(),
        ]);
        console.log('[AuthContext] storage letto – token:', !!savedToken, 'user:', !!savedUser);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch (e) {
        console.error('[AuthContext] errore lettura storage:', e);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(credentials: LoginCredentials): Promise<void> {
    try {
      const response = await authService.login(credentials);
      await Promise.all([
        storage.saveToken(response.token),
        storage.saveUser(response),
      ]);
      setToken(response.token);
      setUser(response);
    } catch (err) {
      throw parseAuthError(err);
    }
  }

  async function register(data: RegisterData): Promise<void> {
    try {
      await authService.register(data);
    } catch (err) {
      throw parseAuthError(err);
    }
    // Auto-login after successful registration.
    await login({ username: data.username, password: data.password });
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout();
    } catch {
      // Always log out locally even if the server call fails.
    }
    await storage.clearAuth();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
