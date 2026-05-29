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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

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

const makeStyles = (C: ThemeColors, isDark: boolean) => StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

  brandRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logo: { width: 170, height: 170 },
  brandName: { fontWeight: '800', fontSize: 22, letterSpacing: -0.4, color: C.primary },

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
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 28,
    fontSize: 14,
    color: C.text,
  },
  inputError: { borderColor: C.danger },
  fieldError: { marginTop: 5, fontSize: 12, fontWeight: '500', color: C.danger },

  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 28,
    backgroundColor: C.inputBg,
    overflow: 'hidden',
  },
  pwRowError: { borderColor: C.danger },
  pwInnerInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
  },
  pwEyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

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
    borderColor: isDark ? 'rgba(239,68,68,0.35)' : '#FECACA',
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

  backRow: { width: '100%', maxWidth: 440, paddingBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4, alignSelf: 'flex-start' },
  backBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },

  smartinaBanner: {
    width: '100%', maxWidth: 440,
    borderRadius: 24, paddingHorizontal: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 20,
  },
  smartinaImg: { width: 72, height: 72, borderRadius: 36, flexShrink: 0 },
  smartinaText: { flex: 1, gap: 3 },
  smartinaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 2, marginBottom: 2,
  },
  smartinaChipText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  smartinaTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  smartinaDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17, marginBottom: 8 },
  smartinaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  smartinaBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { colors: C, isDark } = useTheme();
  const styles = makeStyles(C, isDark);

  const [form, setForm] = useState({ nome: '', cognome: '', username: '', email: '', password: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        <View style={styles.backRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Welcome')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#2B5BA8', '#0f2545']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.smartinaBanner}
        >
          <Image source={require('../../../assets/smartina.png')} style={styles.smartinaImg} resizeMode="contain" />
          <View style={styles.smartinaText}>
            <View style={styles.smartinaChip}>
              <MaterialCommunityIcons name="auto-fix" size={10} color="rgba(255,255,255,0.85)" />
              <Text style={styles.smartinaChipText}>Assistente AI</Text>
            </View>
            <Text style={styles.smartinaTitle}>Ciao, sono SmarTina!</Text>
            <Text style={styles.smartinaDesc}>Registrati e chiedimi tutto su corsi, scadenze e opportunità ITS.</Text>
            <TouchableOpacity style={styles.smartinaBtn} onPress={() => navigation.navigate('SmartinaChat')} activeOpacity={0.8}>
              <Text style={styles.smartinaBtnText}>Chatta →</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.card}>

          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo-itsocial.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Crea account</Text>
          <Text style={styles.subtitle}>Unisciti alla community di ITSocial</Text>

          {FIELDS.map(({ key, label, keyboard, autoCapitalize }) => {
            const fieldError = getFieldError(key);
            const isPasswordField = key === 'password';

            return (
              <View key={key} style={styles.field}>
                <Text style={styles.label}>{label}</Text>

                {isPasswordField ? (
                  <View style={[styles.pwRow, fieldError ? styles.pwRowError : null]}>
                    <TextInput
                      style={styles.pwInnerInput}
                      placeholder={label}
                      placeholderTextColor={C.textMuted}
                      value={form[key]}
                      onChangeText={updateField(key)}
                      onBlur={() => touchField(key)}
                      autoCapitalize={autoCapitalize ?? 'none'}
                      secureTextEntry={!showPassword}
                      textContentType="none"
                      autoComplete="off"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                    />
                    <TouchableOpacity
                      style={styles.pwEyeBtn}
                      onPress={() => setShowPassword(prev => !prev)}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={showPassword ? C.primary : C.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, fieldError ? styles.inputError : null]}
                    placeholder={label}
                    placeholderTextColor={C.textMuted}
                    value={form[key]}
                    onChangeText={updateField(key)}
                    onBlur={() => touchField(key)}
                    autoCapitalize={autoCapitalize ?? 'none'}
                    keyboardType={keyboard ?? 'default'}
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}

                {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
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
