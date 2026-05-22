import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@itsocial_notif_prefs';

export interface NotifPrefs {
  vibraNotifiche: boolean;
  vibraMessaggi: boolean;
  tipi: {
    like: boolean;
    commento: boolean;
    seguito: boolean;
    iscrizione: boolean;
    annuncio: boolean;
  };
}

const DEFAULT_PREFS: NotifPrefs = {
  vibraNotifiche: true,
  vibraMessaggi: true,
  tipi: {
    like: true,
    commento: true,
    seguito: true,
    iscrizione: true,
    annuncio: true,
  },
};

interface NotifPrefsContextValue {
  prefs: NotifPrefs;
  setVibra: (key: 'vibraNotifiche' | 'vibraMessaggi', value: boolean) => void;
  setTipo: (key: keyof NotifPrefs['tipi'], value: boolean) => void;
}

const NotifPrefsContext = createContext<NotifPrefsContextValue>({
  prefs: DEFAULT_PREFS,
  setVibra: () => {},
  setTipo: () => {},
});

function loadAS(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage').default;
    return AS.getItem(STORAGE_KEY);
  } catch {
    return Promise.resolve(null);
  }
}

function saveAS(prefs: NotifPrefs): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage').default;
    AS.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  } catch {}
}

export function NotifPrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    loadAS().then(raw => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as Partial<NotifPrefs>;
        setPrefs(prev => ({
          vibraNotifiche: saved.vibraNotifiche ?? prev.vibraNotifiche,
          vibraMessaggi:  saved.vibraMessaggi  ?? prev.vibraMessaggi,
          tipi: { ...prev.tipi, ...(saved.tipi ?? {}) },
        }));
      } catch {}
    });
  }, []);

  const setVibra = useCallback((key: 'vibraNotifiche' | 'vibraMessaggi', value: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      saveAS(next);
      return next;
    });
  }, []);

  const setTipo = useCallback((key: keyof NotifPrefs['tipi'], value: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, tipi: { ...prev.tipi, [key]: value } };
      saveAS(next);
      return next;
    });
  }, []);

  return (
    <NotifPrefsContext.Provider value={{ prefs, setVibra, setTipo }}>
      {children}
    </NotifPrefsContext.Provider>
  );
}

export function useNotifPrefs() {
  return useContext(NotifPrefsContext);
}
