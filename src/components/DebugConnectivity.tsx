import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HOST } from '../config';

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
    addLog(`→ ${label}`, true);
    addLog(`  ${url}`, true);
    const start = Date.now();
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
      const body = await res.text().catch(() => '(body non leggibile)');
      const elapsed = Date.now() - start;
      addLog(`← ${res.status} ${res.statusText}  (${elapsed}ms)`, res.ok);
      if (body) addLog(`  ${body.slice(0, 200)}`, res.ok);
    } catch (e: any) {
      const elapsed = Date.now() - start;
      addLog(`✗ (${elapsed}ms): ${e?.message ?? String(e)}`, false);
      addLog(`  name=${e?.name}  code=${e?.code ?? 'N/D'}`, false);
    }
    addLog('', true);
  }

  async function runAll() {
    setBusy(true);
    setLogs([{ ts: ts(), text: `Target: ${HOST}`, ok: true }]);

    await runFetch('GET / (root, 404=ok)', `${HOST}/`);
    await runFetch('GET /api/post (pubblico)', `${HOST}/api/post`);
    await runFetch(
      'POST /api/auth/login (cred. vuote → 400/401=ok)',
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
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="wifi-check" size={15} color="#00ACC1" />
        <Text style={styles.title}>Debug connettività</Text>
        <Text style={styles.target}>{HOST}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={runAll} disabled={busy} activeOpacity={0.8}>
        {busy ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.btnText}>Test in corso…</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="play-circle-outline" size={16} color="#fff" />
            <Text style={styles.btnText}>Esegui test fetch()</Text>
          </>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.logBox} contentContainerStyle={styles.logContent}>
        {logs.length === 0 ? (
          <Text style={styles.logEmpty}>Premi il bottone per avviare i test di rete.</Text>
        ) : (
          logs.map((l, i) => (
            <Text key={i} style={[styles.logLine, !l.ok && styles.logLineErr]}>
              {l.ts ? `${l.ts}  ` : ''}{l.text}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#00ACC1',
    overflow: 'hidden',
    shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2433',
    flex: 1,
  },
  target: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
    width: '100%',
    paddingLeft: 21,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#00ACC1',
    borderRadius: 10,
    paddingVertical: 9,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  logBox: {
    backgroundColor: '#EFF8FB',
    maxHeight: 240,
    borderTopWidth: 1,
    borderTopColor: '#B2EBF2',
  },
  logContent: { padding: 12 },
  logEmpty: {
    color: '#9ca3af',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 16,
  },
  logLine: {
    color: '#0097A7',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 1,
    lineHeight: 16,
  },
  logLineErr: {
    color: '#dc2626',
  },
});
