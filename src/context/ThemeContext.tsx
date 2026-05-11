import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  bg: string;
  card: string;
  border: string;
  text: string;
  textSoft: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  brand: string;
  warm: string;
  warmBg: string;
  danger: string;
  dangerBg: string;
  inputBg: string;
  saveBg: string;
}

export const lightColors: ThemeColors = {
  bg: '#F1F5F9',
  card: '#ffffff',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  primary: '#4A8FD4',
  primaryDark: '#2D6BB5',
  brand: '#2B5BA8',
  warm: '#f59e0b',
  warmBg: 'rgba(245,158,11,0.10)',
  danger: '#ef4444',
  dangerBg: '#FEF2F2',
  inputBg: '#ffffff',
  saveBg: 'rgba(74,143,212,0.10)',
};

export const darkColors: ThemeColors = {
  bg: '#0b141e',
  card: '#16222e',
  border: '#1e3448',
  text: '#ffffff',
  textSoft: '#94a3b8',
  textMuted: '#4a6580',
  primary: '#00bcd4',
  primaryDark: '#0097a7',
  brand: '#4A8FD4',
  warm: '#f59e0b',
  warmBg: 'rgba(245,158,11,0.15)',
  danger: '#ef4444',
  dangerBg: 'rgba(239,68,68,0.15)',
  inputBg: '#0d1b27',
  saveBg: 'rgba(0,188,212,0.12)',
};

// Badge colors – RGBA, leggibili su entrambi i temi
export function getRuoloBadge(ruolo?: string) {
  const r = (ruolo ?? '').toUpperCase();
  if (r.includes('ADMIN'))      return { label: 'Admin',      bg: 'rgba(239,68,68,0.15)',   text: '#ef4444',  border: 'rgba(239,68,68,0.35)' };
  if (r.includes('PROFESSORE')) return { label: 'Professore', bg: 'rgba(0,188,212,0.15)',   text: '#00bcd4',  border: 'rgba(0,188,212,0.35)' };
  if (r.includes('STUDENTE'))   return { label: 'Studente',   bg: 'rgba(74,222,128,0.15)',  text: '#16a34a',  border: 'rgba(74,222,128,0.35)' };
  return { label: ruolo || 'Utente', bg: 'rgba(148,163,184,0.15)', text: '#64748b', border: 'rgba(148,163,184,0.30)' };
}

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

const STORAGE_KEY = '@itsocial_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(val => { if (val !== null) setIsDark(val === 'dark'); })
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
