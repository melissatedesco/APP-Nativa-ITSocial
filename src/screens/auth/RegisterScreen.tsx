import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  primary: '#4A8FD4',
  primaryDark: '#2D6BB5',
  brand700: '#2B5BA8',
  danger: '#E53E3E',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
} as const;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const FIELDS: {
  key: 'nome' | 'cognome' | 'username' | 'email' | 'password';
  label: string;
  keyboard?: 'email-address' | 'default';
  secure?: boolean;
  autoCapitalize?: 'words' | 'none';
}[] = [
  { key: 'nome',     label: 'Nome',     autoCapitalize: 'words' },
  { key: 'cognome',  label: 'Cognome',  autoCapitalize: 'words' },
  { key: 'username', label: 'Username', autoCapitalize: 'none' },
  { key: 'email',    label: 'Email',    keyboard: 'email-address', autoCapitalize: 'none' },
  { key: 'password', label: 'Password (min 8 caratteri)', secure: true, autoCapitalize: 'none' },
];

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({ nome: '', cognome: '', username: '', email: '', password: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function updateField(key: keyof typeof form) {
    return (value: string) => {
      setForm(prev => ({ ...prev, [key]: value }));
      setErrorMessage('');
    };
  }

  function touchField(key: string) {
    setTouched(prev => ({ ...prev, [key]: true }));
  }

  function getFieldError(key: keyof typeof form): string | null {
    if (!touched[key]) return null;
    if (!form[key]) return 'Campo obbligatorio';
    if (key === 'password' && form.password.length < 8) return 'Minimo 8 caratteri';
    if (key === 'email' && !/\S+@\S+\.\S+/.test(form.email)) return 'Email non valida';
    return null;
  }

  async function handleRegister() {
    const allTouched = Object.fromEntries(FIELDS.map(f => [f.key, true]));
    setTouched(allTouched);
    const hasEmpty = Object.values(form).some(v => !v);
    if (hasEmpty) return;
    if (form.password.length < 8) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await register(form);
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Registrazione fallita. Username o email già in uso.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = Object.values(form).every(v => v.length > 0) && form.password.length >= 8;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>

          {/* Brand */}
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo-itsocial.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>ITSocial</Text>
          </View>

          <Text style={styles.title}>Crea account</Text>
          <Text style={styles.subtitle}>Unisciti alla community di ITSocial</Text>

          {FIELDS.map(({ key, label, keyboard, secure, autoCapitalize }) => {
            const fieldError = getFieldError(key);
            return (
              <View key={key} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={[styles.input, fieldError ? styles.inputError : null]}
                  placeholder={label}
                  placeholderTextColor={C.textMuted}
                  value={form[key]}
                  onChangeText={updateField(key)}
                  onBlur={() => touchField(key)}
                  autoCapitalize={autoCapitalize ?? 'none'}
                  keyboardType={keyboard ?? 'default'}
                  secureTextEntry={secure ?? false}
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {fieldError && (
                  <Text style={styles.fieldError}>{fieldError}</Text>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.submitBtn, (!canSubmit || loading) && styles.submitDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitText}>Registrazione in corso…</Text>
              </>
            ) : (
              <Text style={styles.submitText}>Crea account</Text>
            )}
          </TouchableOpacity>

          {!!errorMessage && (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.divider}>
            <Text style={styles.dividerText}>Hai già un account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.dividerLink}>Accedi</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 40,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logo: { width: 78, height: 78 },
  brandName: { fontWeight: '800', fontSize: 26, letterSpacing: -0.4, color: C.primary },

  title: {
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: -0.5,
    textAlign: 'center',
    color: C.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  field: { marginBottom: 16 },
  label: { fontWeight: '600', fontSize: 13, color: C.text, marginBottom: 6 },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    fontSize: 14,
    color: C.text,
  },
  inputError: { borderColor: C.danger },
  fieldError: { marginTop: 5, fontSize: 12, fontWeight: '500', color: C.danger },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 13,
    marginTop: 4,
    backgroundColor: C.primary,
    borderRadius: 9999,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 5,
  },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },

  alertError: {
    marginTop: 12,
    padding: 12,
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    borderRadius: 14,
  },
  alertErrorText: { fontSize: 13, fontWeight: '500', color: C.danger },

  divider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  dividerText: { fontSize: 13, fontWeight: '500', color: C.textSoft },
  dividerLink: { fontSize: 13, fontWeight: '700', color: C.primary },
});
