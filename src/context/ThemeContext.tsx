import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

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

// Light — token map: c-ink-50 → bg, bg-elev → card, c-ink-200 → border,
// c-ink-900 → text, c-ink-500 → textSoft, c-ink-400 → textMuted,
// c-brand-500 → primary, c-brand-600 → primaryDark, c-brand-700 → brand
export const lightColors: ThemeColors = {
  bg:         '#f5f7fa',   // c-ink-50   oklch(98% .005 240)
  card:       '#ffffff',   // bg-elev
  border:     '#d8e1eb',   // c-ink-200  oklch(88% .010 250)
  text:       '#1a2535',   // c-ink-900  oklch(22% .060 250)
  textSoft:   '#617585',   // c-ink-500  oklch(52% .030 250)
  textMuted:  '#8c9eb0',   // c-ink-400  oklch(65% .020 250)
  primary:    '#4A8FD4',   // c-brand-500 oklch(60% .12 220)
  primaryDark:'#3d7fc0',   // c-brand-600 oklch(52% .12 220)
  brand:      '#2B5BA8',   // c-brand-700 oklch(44% .11 225)
  warm:        '#f59e0b',
  warmBg:      'rgba(245,158,11,0.10)',
  danger:      '#ef4444',
  dangerBg:    '#FEF2F2',
  inputBg:    '#ffffff',
  saveBg:      'rgba(74,143,212,0.10)',
};

export const darkColors: ThemeColors = {
  bg:         '#2e4460',
  card:       '#3a5478',
  border:     '#4d6d8d',
  text:       '#e4ecf7',
  textSoft:   '#a0bdd4',
  textMuted:  '#6e8fa8',
  primary:    '#5b9fd4',
  primaryDark:'#4A8FD4',
  brand:      '#2B5BA8',
  warm:        '#f59e0b',
  warmBg:      'rgba(245,158,11,0.15)',
  danger:      '#ef4444',
  dangerBg:    'rgba(239,68,68,0.15)',
  inputBg:    '#2a3f58',
  saveBg:      'rgba(91,159,212,0.14)',
};

export function getRuoloBadge(ruolo?: string) {
  const r = (ruolo ?? '').toUpperCase();
  if (r.includes('ADMIN'))      return { label: 'Admin',      bg: 'rgba(239,68,68,0.15)',   text: '#ef4444',  border: 'rgba(239,68,68,0.35)' };
  if (r.includes('PROFESSORE')) return { label: 'Professore', bg: 'rgba(74,143,212,0.15)',  text: '#4A8FD4',  border: 'rgba(74,143,212,0.35)' };
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

// ── Storage keys ───────────────────────────────────────────────────────────────
const WEB_KEY    = 'theme';           // localStorage key (web)
const NATIVE_KEY = '@itsocial_theme'; // AsyncStorage key (native)

// ── Platform-aware helpers ─────────────────────────────────────────────────────

// Web: lettura sincrona → nessun flash al primo render
function webReadSync(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true;
    const val = localStorage.getItem(WEB_KEY);
    return val !== null ? val === 'dark' : true;
  } catch {
    return true;
  }
}

function webSave(isDark: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_KEY, isDark ? 'dark' : 'light');
    }
  } catch {}
}

// Native: AsyncStorage caricato dinamicamente per evitare errori di import su web
async function nativeRead(): Promise<boolean | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage').default;
    const val: string | null = await AS.getItem(NATIVE_KEY);
    return val !== null ? val === 'dark' : null;
  } catch {
    return null;
  }
}

function nativeSave(isDark: boolean): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage').default;
    AS.setItem(NATIVE_KEY, isDark ? 'dark' : 'light').catch(() => {});
  } catch {}
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isWeb = Platform.OS === 'web';

  // Web: stato iniziale letto in modo sincrono → nessun flash
  // Native: default dark, poi aggiornato dall'AsyncStorage in useEffect
  const [isDark, setIsDark] = useState<boolean>(() => (isWeb ? webReadSync() : true));

  // Solo per native: traccia il completamento del caricamento asincrono
  const [nativeLoaded, setNativeLoaded] = useState(false);

  // Native only: legge AsyncStorage una volta al mount
  useEffect(() => {
    if (isWeb) return;
    nativeRead().then(val => {
      if (val !== null) setIsDark(val);
      setNativeLoaded(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Salva il tema ogni volta che cambia
  useEffect(() => {
    if (isWeb) {
      webSave(isDark);
    } else {
      // Su native aspetta il caricamento iniziale per non sovrascrivere il valore salvato
      if (!nativeLoaded) return;
      nativeSave(isDark);
    }
  }, [isDark, nativeLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
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
