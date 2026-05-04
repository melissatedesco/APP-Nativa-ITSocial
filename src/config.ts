// ─── Network Configuration ───────────────────────────────────────────────────
//
// Aggiorna HOST in base al tuo ambiente:
//
//   • Emulatore Android    → 'http://10.0.2.2:8080'
//   • Simulatore iOS       → 'http://localhost:8080'
//   • Dispositivo fisico   → 'http://<IP_LAN_DEL_SERVER>:8080'
//     (es. 'http://192.168.1.100:8080' se il backend gira su quella macchina)
//
// Per trovare l'IP della tua macchina su Windows: ipconfig → "Indirizzo IPv4"
// Per trovare l'IP della tua macchina su Mac/Linux: ifconfig | grep "inet "
//
export const HOST = 'http://192.168.1.100:8080';

export const API_BASE_URL = `${HOST}/api`;
