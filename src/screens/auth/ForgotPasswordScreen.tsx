import React, { useState } from 'react';
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

function parseResetError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Impossibile raggiungere il server. Controlla la connessione.';
    const status = err.response.status;
    if (status === 404) return 'Nessun account trovato con questa email.';
    if (status === 429) return 'Troppi tentativi. Attendi qualche minuto e riprova.';
    const msg: string | undefined = err.response.data?.message;
    if (msg) return msg;
    if (status >= 500) return 'Errore del server. Riprova più tardi.';
  }
  return 'Si è verificato un errore. Riprova.';
}

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  primary: '#4A8FD4',
  primaryDark: '#2D6BB5',
  brand700: '#2B5BA8',
  danger: '#E53E3E',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  successBg: '#D1FAE5',
  successBorder: '#A7F3D0',
  success: '#065F46',
} as const;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) { setError('Inserisci la tua email.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Inserisci un indirizzo email valido.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.richiestaReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(parseResetError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>

          <Text style={styles.title}>Password dimenticata</Text>
          <Text style={styles.subtitle}>
            Inserisci la tua email e ti invieremo un codice di verifica a 4 cifre.
          </Text>

          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Codice inviato! Controlla la tua casella email e inserisci il codice nel passaggio successivo.
              </Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.navigate('VerificaCodice')}
              >
                <Text style={styles.btnText}>Inserisci il codice →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, !!error && styles.inputError]}
                  placeholder="La tua email"
                  placeholderTextColor={C.textSoft}
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                />
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!email.trim() || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Invia codice</Text>
                }
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backLinkText}>← Torna al login</Text>
          </TouchableOpacity>

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
    gap: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

  title: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.textSoft, textAlign: 'center', lineHeight: 22 },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: C.text },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.card,
  },
  inputError: { borderColor: C.danger },

  errorBox: { padding: 12, backgroundColor: C.dangerBg, borderWidth: 1, borderColor: C.dangerBorder, borderRadius: 12 },
  errorText: { fontSize: 13, color: C.danger, fontWeight: '500' },

  successBox: { gap: 16 },
  successText: {
    padding: 14,
    backgroundColor: C.successBg,
    borderWidth: 1,
    borderColor: C.successBorder,
    borderRadius: 12,
    fontSize: 13,
    color: C.success,
    lineHeight: 20,
  },

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

  backLink: { alignItems: 'center', paddingTop: 4 },
  backLinkText: { fontSize: 13, fontWeight: '600', color: C.primary },
});
