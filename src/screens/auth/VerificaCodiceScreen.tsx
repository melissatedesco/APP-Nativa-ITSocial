import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/authService';

function parseCodiceError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Impossibile raggiungere il server. Controlla la connessione.';
    const status = err.response.status;
    if (status === 400) return 'Codice non valido o scaduto. Richiedi un nuovo codice.';
    if (status === 429) return 'Troppi tentativi falliti. Attendi e richiedi un nuovo codice.';
    const msg: string | undefined = err.response.data?.message;
    if (msg) return msg;
    if (status >= 500) return 'Errore del server. Riprova più tardi.';
  }
  return 'Codice non valido o scaduto. Riprova.';
}

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  primary: '#4A8FD4',
  primaryDark: '#2D6BB5',
  danger: '#E53E3E',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
} as const;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerificaCodice'>;
};

export default function VerificaCodiceScreen({ navigation }: Props) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const codice = digits.join('');
  const isComplete = codice.length === 4;

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < 3) refs[index + 1].current?.focus();
    if (!digit && index > 0) refs[index - 1].current?.focus();
  }

  async function handleVerifica() {
    if (!isComplete || loading) return;
    setLoading(true);
    setError('');
    try {
      await authService.verificaCodice(codice);
      navigation.navigate('NuovaPassword', { codice });
    } catch (err) {
      setError(parseCodiceError(err));
      setDigits(['', '', '', '']);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>

          <Text style={styles.title}>Verifica il codice</Text>
          <Text style={styles.subtitle}>
            Inserisci il codice a 4 cifre che hai ricevuto via email.
          </Text>

          {/* 4-digit input */}
          <View style={styles.codeRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={refs[i]}
                style={[styles.digitBox, !!error && styles.digitBoxError, d && styles.digitBoxFilled]}
                value={d}
                onChangeText={v => handleDigit(i, v)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
                autoFocus={i === 0}
              />
            ))}
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (!isComplete || loading) && styles.btnDisabled]}
            onPress={handleVerifica}
            disabled={!isComplete || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Verifica codice</Text>
            }
          </TouchableOpacity>

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Non hai ricevuto il codice? Richiedi di nuovo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>← Torna al login</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, paddingVertical: 48 },

  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

  title: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.textSoft, textAlign: 'center', lineHeight: 22 },

  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  digitBox: {
    width: 58,
    height: 68,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 16,
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    backgroundColor: '#F8FAFC',
  },
  digitBoxFilled: { borderColor: C.primary, backgroundColor: '#EFF6FF' },
  digitBoxError: { borderColor: C.danger },

  errorBox: { padding: 12, backgroundColor: C.dangerBg, borderWidth: 1, borderColor: C.dangerBorder, borderRadius: 12 },
  errorText: { fontSize: 13, color: C.danger, fontWeight: '500' },

  btn: {
    paddingVertical: 13,
    backgroundColor: C.primary,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  linksRow: { alignItems: 'center', gap: 10 },
  link: { fontSize: 12, fontWeight: '600', color: C.primary, textAlign: 'center' },
});
