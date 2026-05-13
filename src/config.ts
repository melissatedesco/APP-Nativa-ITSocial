// ─── Network Configuration ───────────────────────────────────────────────────
//
// Aggiorna .env:
//   EXPO_PUBLIC_API_URL  → IP LAN del PC  (dispositivo fisico / Android emu)
//   EXPO_PUBLIC_WEB_URL  → http://localhost:8080  (browser web)
//
import { Platform } from 'react-native';

export const HOST: string = Platform.OS === 'web'
  ? (process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:8080')
  : (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080');

export const API_BASE_URL = `${HOST}/api`;
// Chatbot AI service (porta separata 8081)
export const CHAT_BASE_URL = `${HOST.replace(':8080', ':8081')}/chat`;
