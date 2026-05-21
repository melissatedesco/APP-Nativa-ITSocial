import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'auth_user';

// ── Platform-aware primitives ──────────────────────────────────────────────────
// Web  → localStorage (synchronous, always available in browsers)
// Mobile → AsyncStorage loaded dynamically (avoids crashing the web bundler)

async function get(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage').default;
    return AS.getItem(key);
  } catch {
    return null;
  }
}

async function set(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch {}
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage').default;
    await AS.setItem(key, value);
  } catch {}
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch {}
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AS = require('@react-native-async-storage/async-storage').default;
    await AS.removeItem(key);
  } catch {}
}

// ── Public API ─────────────────────────────────────────────────────────────────

export const storage = {
  async saveToken(token: string): Promise<void> {
    await set(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return get(TOKEN_KEY);
  },

  async saveUser(user: object): Promise<void> {
    await set(USER_KEY, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    const raw = await get(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async clearAuth(): Promise<void> {
    await remove(TOKEN_KEY);
    await remove(USER_KEY);
  },
};
