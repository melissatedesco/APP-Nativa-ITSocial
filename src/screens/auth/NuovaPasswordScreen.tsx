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
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/authService';

function parseNuovaPasswordError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Impossibile raggiungere il server. Controlla la connessione.';
    const status = err.response.status;
    if (status === 400) return 'Il codice è scaduto o non valido. Torna indietro e richiedi un nuovo codice.';
    if (status === 422) return 'La password non rispetta i requisiti minimi.';
    const msg: string | undefined = err.response.data?.message;
    if (msg) return msg;
    if (status >= 500) return 'Errore del server. Riprova più tardi.';
  }
  return 'Impossibile cambiare la password. Riprova.';
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
  successBg: '#D1FAE5',
  successBorder: '#A7F3D0',
  success: '#065F46',
} as const;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'NuovaPassword'>;
  route: RouteProp<AuthStackParamList, 'NuovaPassword'>;
};

export default function NuovaPasswordScreen({ navigation, route }: Props) {
  const { codice } = route.params;
  const [password, setPassword] = useState('');
  const [conferma, setConferma] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const canSubmit = password.length >= 6 && password === conferma;

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    try {
      await authService.nuovaPassword(codice, password);
      setSuccess(true);
    } catch (err) {
      setError(parseNuovaPasswordError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>

          <Text style={styles.title}>Nuova password</Text>
          <Text style={styles.subtitle}>Scegli una nuova password di almeno 6 caratteri.</Text>

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Password cambiata con successo! Ora puoi accedere con le nuove credenziali.
              </Text>
              <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.btnText}>Vai al login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Nuova password</Text>
                <TextInput
                  style={[styles.input, !!error && styles.inputError]}
                  placeholder="Minimo 6 caratteri"
                  placeholderTextColor={C.textSoft}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  secureTextEntry
                  returnKeyType="next"
                />
                {password.length > 0 && password.length < 6 && (
                  <Text style={styles.hint}>Almeno 6 caratteri richiesti</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Conferma password</Text>
                <TextInput
                  style={[
                    styles.input,
                    conferma.length > 0 && password !== conferma && styles.inputError,
                  ]}
                  placeholder="Ripeti la password"
                  placeholderTextColor={C.textSoft}
                  value={conferma}
                  onChangeText={v => { setConferma(v); setError(''); }}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                {conferma.length > 0 && password !== conferma && (
                  <Text style={styles.fieldError}>Le password non coincidono</Text>
                )}
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btn, (!canSubmit || loading) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Cambia password</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {!success && (
            <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backLinkText}>← Torna al login</Text>
            </TouchableOpacity>
          )}

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
  hint: { fontSize: 11, color: C.textSoft, marginTop: 3 },
  fieldError: { fontSize: 12, color: C.danger, fontWeight: '500', marginTop: 3 },

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
