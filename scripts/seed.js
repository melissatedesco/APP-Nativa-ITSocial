/**
 * Seed script — popola ITSocial con utenti, post, like e follow.
 *
 * Uso:
 *   node scripts/seed.js
 *
 * Prerequisiti:
 *   - Backend Spring Boot avviato
 *   - Node 18+ (FormData nativo)
 *   - Modifica BASE_URL se l'IP è diverso
 */

const axios = require('axios');

// ─── Configurazione ────────────────────────────────────────────────────────────
const BASE_URL = 'http://192.168.1.35:8080/api';

const TEST_USERS = [
  { nome: 'Marco',   cognome: 'Rossi',    username: 'marco.rossi',    email: 'marco.rossi@test.it',    password: 'Password123!' },
  { nome: 'Giulia',  cognome: 'Bianchi',  username: 'giulia.bianchi', email: 'giulia.bianchi@test.it', password: 'Password123!' },
  { nome: 'Luca',    cognome: 'Verdi',    username: 'luca.verdi',     email: 'luca.verdi@test.it',     password: 'Password123!' },
  { nome: 'Sofia',   cognome: 'Ferrari',  username: 'sofia.ferrari',  email: 'sofia.ferrari@test.it',  password: 'Password123!' },
  { nome: 'Andrea',  cognome: 'Russo',    username: 'andrea.russo',   email: 'andrea.russo@test.it',   password: 'Password123!' },
  { nome: 'Chiara',  cognome: 'Esposito', username: 'chiara.espo',    email: 'chiara.espo@test.it',    password: 'Password123!' },
];

const POST_CONTENTS = [
  'Oggi ho imparato qualcosa di nuovo su Java Spring Boot! Il dependency injection è potentissimo.',
  'Qualcuno ha materiale per il modulo di React Native? Sto preparando l\'esame finale.',
  'Grande sessione di coding oggi — il progetto sta prendendo forma. Chi vuole dare un feedback?',
  'Cerco compagni di studio per la settimana prossima. Siamo in 3, aggiungetevi!',
  'Ho finalmente capito i generics in TypeScript. Era più semplice di quanto pensassi.',
  'ITSocial è una piattaforma fantastica per connettersi con altri studenti ITS 🚀',
  'Primo progetto React Native completato! Sto imparando tantissimo ogni giorno.',
  'Chi viene alla sessione di studio domani pomeriggio in aula 3?',
  'Condivido le mie note sul modulo di database — spero siano utili a qualcuno.',
  'Stage trovato! Grazie a tutti per i consigli e il supporto in questo percorso.',
  'Domanda: qualcuno ha già usato Expo Router? Vale la pena rispetto alla navigation classica?',
  'Recap della giornata: 4 ore di coding, 2 bug risolti, 1 caffè troppo. Produttivo!',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function api(token) {
  return axios.create({
    baseURL: BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    timeout: 10000,
  });
}

function log(icon, msg) { console.log(`${icon}  ${msg}`); }
function ok(msg)        { console.log(`  ✓ ${msg}`); }
function skip(msg)      { console.log(`  ~ ${msg}`); }
function fail(msg)      { console.log(`  ✗ ${msg}`); }

// ─── Passi ────────────────────────────────────────────────────────────────────

async function registerUsers() {
  log('📝', 'Registrazione utenti test...');
  for (const u of TEST_USERS) {
    try {
      await api().post('/auth/registrazione', {
        nome: u.nome, cognome: u.cognome,
        username: u.username, email: u.email, password: u.password,
      });
      ok(`Registrato: ${u.username}`);
    } catch (e) {
      const status = e.response?.status;
      if (status === 409 || status === 400) {
        skip(`Già esistente: ${u.username}`);
      } else {
        fail(`Registrazione fallita (${u.username}): ${e.response?.data?.message ?? e.message}`);
      }
    }
    await sleep(300);
  }
}

async function loginUsers() {
  log('🔑', 'Login utenti...');
  const sessions = [];
  for (const u of TEST_USERS) {
    try {
      const res = await api().post('/auth/login', { username: u.username, password: u.password });
      const token = res.data.token ?? res.data.accessToken ?? res.data;
      sessions.push({ ...u, token });
      ok(`Login OK: ${u.username}`);
    } catch (e) {
      fail(`Login fallito (${u.username}): ${e.response?.data?.message ?? e.message}`);
    }
    await sleep(200);
  }
  return sessions;
}

async function createPosts(sessions) {
  log('📄', 'Creazione post...');
  const created = [];

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    // Ogni utente crea 2 post presi dalla lista in modo ciclico
    const indices = [i * 2 % POST_CONTENTS.length, (i * 2 + 1) % POST_CONTENTS.length];
    for (const idx of indices) {
      const contenuto = POST_CONTENTS[idx];
      try {
        const form = new FormData();
        form.append('contenuto', contenuto);
        const res = await api(session.token).post('/post', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const postId = res.data.id ?? res.data.idPost;
        created.push({ postId, ownerUsername: session.username });
        ok(`Post [${postId}] da ${session.username}: "${contenuto.slice(0, 45)}…"`);
      } catch (e) {
        fail(`Post fallito (${session.username}): ${e.response?.data?.message ?? e.message}`);
      }
      await sleep(300);
    }
  }
  return created;
}

async function addLikes(sessions, posts) {
  log('❤️ ', 'Aggiunta like...');
  for (const session of sessions) {
    // Ogni utente mette like ai post degli altri (max 4)
    const targets = posts
      .filter((p) => p.ownerUsername !== session.username)
      .slice(0, 4);
    for (const { postId } of targets) {
      try {
        await api(session.token).post('/likes', { postId });
      } catch {}
      await sleep(150);
    }
    ok(`Like aggiunti da ${session.username}`);
  }
}

async function addFollows(sessions) {
  log('👥', 'Aggiunta follow...');
  for (let i = 0; i < sessions.length; i++) {
    const follower = sessions[i];
    // Ogni utente segue i 3 successivi in modo circolare
    for (let j = 1; j <= 3; j++) {
      const target = sessions[(i + j) % sessions.length];
      try {
        await api(follower.token).post(`/segui/${target.username}`);
      } catch {}
      await sleep(150);
    }
    ok(`${follower.username} segue 3 utenti`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Seed ITSocial — avvio\n' + '─'.repeat(50));

  await registerUsers();
  console.log('');

  const sessions = await loginUsers();
  if (sessions.length === 0) {
    console.error('\n❌  Nessun utente autenticato — interrotto.');
    process.exit(1);
  }
  console.log('');

  const posts = await createPosts(sessions);
  console.log('');

  await addLikes(sessions, posts);
  console.log('');

  await addFollows(sessions);

  console.log('\n' + '─'.repeat(50));
  console.log('✅  Seed completato!');
  console.log(`   Utenti autenticati : ${sessions.length}`);
  console.log(`   Post creati        : ${posts.length}`);
  console.log(`   Like               : ~${sessions.length * 4}`);
  console.log(`   Follow             : ~${sessions.length * 3}`);
  console.log('');
}

main().catch((e) => {
  console.error('❌ Errore fatale:', e.message);
  process.exit(1);
});
