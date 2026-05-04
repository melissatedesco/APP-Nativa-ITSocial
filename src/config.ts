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
export const HOST: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.100:8080';

export const API_BASE_URL = `${HOST}/api`;
