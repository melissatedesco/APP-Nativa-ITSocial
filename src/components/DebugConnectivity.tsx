import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const HOST = 'http://192.168.1.100:8080';

type LogEntry = { ts: string; text: string; ok: boolean };

function ts() {
  return new Date().toISOString().slice(11, 23);
}

export default function DebugConnectivity() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);

  function addLog(text: string, ok: boolean) {
    setLogs(prev => [...prev, { ts: ts(), text, ok }]);
  }

  async function runFetch(label: string, url: string, init?: RequestInit) {
    addLog(`→ ${label}  ${url}`, true);
    const start = Date.now();
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
      const body = await res.text().catch(() => '(body non leggibile)');
      const elapsed = Date.now() - start;
      addLog(`← ${res.status} ${res.statusText}  (${elapsed}ms)`, res.ok);
      addLog(`   body: ${body.slice(0, 200)}`, res.ok);
    } catch (e: any) {
      const elapsed = Date.now() - start;
      addLog(`✗ ERRORE (${elapsed}ms): ${e?.message ?? String(e)}`, false);
      addLog(`  name: ${e?.name}  code: ${e?.code ?? 'N/D'}`, false);
    }
  }

  async function runAll() {
    setBusy(true);
    setLogs([]);

    // 1. GET root del backend (nessun endpoint, risposta 404 è ok – conferma rete)
    await runFetch('GET root', `${HOST}/`);

    // 2. GET endpoint pubblico dei post
    await runFetch('GET /api/post (pubblico)', `${HOST}/api/post`);

    // 3. POST login con credenziali vuote (aspettiamo 401/400, non ERR_NETWORK)
    await runFetch(
      'POST /api/auth/login (cred. vuote → 400/401)',
      `${HOST}/api/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '__debug__', password: '__debug__' }),
      }
    );

    addLog('── Test completati ──', true);
    setBusy(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Connettività</Text>
      <Text style={styles.subtitle}>Target: {HOST}</Text>

      <TouchableOpacity style={styles.btn} onPress={runAll} disabled={busy}>
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Esegui test fetch()</Text>
        }
      </TouchableOpacity>

      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 10 }}>
        {logs.length === 0 && (
          <Text style={styles.logEmpty}>Premi il bottone per avviare i test.</Text>
        )}
        {logs.map((l, i) => (
          <Text key={i} style={[styles.logLine, !l.ok && styles.logLineErr]}>
            {l.ts}  {l.text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 14,
    padding: 12,
    paddingBottom: 2,
    fontFamily: 'monospace',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 11,
    paddingHorizontal: 12,
    paddingBottom: 10,
    fontFamily: 'monospace',
  },
  btn: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#4A8FD4',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  logBox: {
    backgroundColor: '#020617',
    maxHeight: 260,
  },
  logEmpty: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 20,
  },
  logLine: {
    color: '#4ADE80',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
    lineHeight: 16,
  },
  logLineErr: {
    color: '#F87171',
  },
});
