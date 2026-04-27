import React, { createContext, useContext, useEffect, useState } from 'react';
import { LoginResponse, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';

interface AuthContextValue {
  session: LoginResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [savedToken, savedSession] = await Promise.all([
        storage.getToken(),
        storage.getUser<LoginResponse>(),
      ]);
      if (savedToken && savedSession) {
        setToken(savedToken);
        setSession(savedSession);
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(credentials: LoginCredentials) {
    const response = await authService.login(credentials);
    await Promise.all([
      storage.saveToken(response.token),
      storage.saveUser(response),
    ]);
    setToken(response.token);
    setSession(response);
  }

  async function register(data: RegisterData) {
    await authService.register(data);
    // after registration, log in automatically
    await login({ username: data.username, password: data.password });
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      // logout locally even if the API call fails
    }
    await storage.clearAuth();
    setToken(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
