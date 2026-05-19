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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

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
    color: isDark ? C.text : '#000000',
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

  pwLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  forgotLink: { fontSize: 12, fontWeight: '600', color: C.primary },

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
  backBtnText: { fontSize: 14, fontWeight: '600', color: C.textSoft },
});

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { colors: C, isDark } = useTheme();
  const styles = makeStyles(C, isDark);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usernameError = usernameTouched && !username;
  const passwordError = passwordTouched && !password;

  async function handleLogin() {
    setUsernameTouched(true);
    setPasswordTouched(true);
    if (!username || !password) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await login({ username, password });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Errore di accesso. Riprova.');
    } finally {
      setLoading(false);
    }
  }

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
            <MaterialCommunityIcons name="arrow-left" size={20} color={C.textSoft} />
            <Text style={styles.backBtnText}>Indietro</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>

          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo-itsocial.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Bentornato</Text>
          <Text style={styles.subtitle}>Accedi al tuo account per continuare</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, usernameError && styles.inputError]}
              placeholder="Il tuo username"
              placeholderTextColor={C.textMuted}
              value={username}
              onChangeText={(v) => { setUsername(v); setErrorMessage(''); }}
              onBlur={() => setUsernameTouched(true)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            {usernameError && <Text style={styles.fieldError}>L'username è obbligatorio</Text>}
          </View>

          <View style={styles.field}>
            <View style={styles.pwLabelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Password dimenticata?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.pwRow, passwordError && styles.pwRowError]}>
              <TextInput
                style={styles.pwInnerInput}
                placeholder="La tua password"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMessage(''); }}
                onBlur={() => setPasswordTouched(true)}
                secureTextEntry={!showPassword}
                textContentType="none"
                autoComplete="off"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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
            {passwordError && <Text style={styles.fieldError}>La password è obbligatoria</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (loading || !username || !password) && styles.submitDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitText}>Accesso in corso…</Text>
              </>
            ) : (
              <Text style={styles.submitText}>Accedi</Text>
            )}
          </TouchableOpacity>

          {!!errorMessage && (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.divider}>
            <Text style={styles.dividerText}>Non hai un account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.dividerLink}>Registrati</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
