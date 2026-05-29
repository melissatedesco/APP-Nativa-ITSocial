// ─── Network Configuration ───────────────────────────────────────────────────
//
// L'URL del backend viene letto dalla variabile d'ambiente EXPO_PUBLIC_API_URL
// definita nel file .env (non committato, vedi .env.example).
//
// Aggiorna .env in base al tuo ambiente:
//   • Dispositivo fisico  → http://192.168.1.XXX:8080  (IP LAN del PC backend)
//   • Emulatore Android   → http://10.0.2.2:8080
//   • Simulatore iOS      → http://localhost:8080
//
import { Platform } from 'react-native';

const envUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.65:8080';

export const HOST = Platform.OS === 'web' ? 'http://localhost:8080' : envUrl;

export const API_BASE_URL = `${HOST}/api`;

const envHost = envUrl.replace(':8080', '');
export const CHAT_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:5000/chat/'
  : `${envHost}:5000/chat/`;
