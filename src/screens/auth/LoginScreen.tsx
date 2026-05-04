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

// Design tokens — fedeli al CSS del frontend Angular
const C = {
  bg: '#F1F5F9',          // --bg  (ink-50)
  card: '#FFFFFF',         // --bg-elev
  border: '#E2E8F0',       // --border (ink-200)
  text: '#1E293B',         // --text (ink-900)
  textSoft: '#64748B',     // --text-soft (ink-500)
  primary: '#4A8FD4',      // --primary (brand-500 oklch≈)
  primaryDark: '#2D6BB5',  // --primary-h (brand-600)
  brand700: '#2B5BA8',     // brand-700
  danger: '#E53E3E',       // --c-danger
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
} as const;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  console.log('[LoginScreen] montato');
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

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
    } catch {
      setErrorMessage('Username o password non validi. Riprova.');
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

          {/* Heading */}
          <Text style={styles.title}>Bentornato</Text>
          <Text style={styles.subtitle}>Accedi al tuo account per continuare</Text>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, usernameError && styles.inputError]}
              placeholder="Il tuo username"
              placeholderTextColor={C.textSoft}
              value={username}
              onChangeText={(v) => { setUsername(v); setErrorMessage(''); }}
              onBlur={() => setUsernameTouched(true)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            {usernameError && (
              <Text style={styles.fieldError}>L'username è obbligatorio</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <View style={styles.pwLabelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Password dimenticata?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              placeholder="La tua password"
              placeholderTextColor={C.textSoft}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorMessage(''); }}
              onBlur={() => setPasswordTouched(true)}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            {passwordError && (
              <Text style={styles.fieldError}>La password è obbligatoria</Text>
            )}
          </View>

          {/* Submit */}
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

          {/* Error alert */}
          {!!errorMessage && (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Divider */}
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

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  // Card
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

  // Brand
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandName: {
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: -0.4,
    color: C.brand700,
  },

  // Headings
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

  // Form
  field: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    fontSize: 13,
    color: C.text,
    marginBottom: 6,
  },
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
  inputError: {
    borderColor: C.danger,
  },
  fieldError: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '500',
    color: C.danger,
  },

  // Password row
  pwLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primaryDark,
  },

  // Submit button
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
  submitDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },

  // Alert
  alertError: {
    marginTop: 12,
    padding: 12,
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    borderRadius: 14,
  },
  alertErrorText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.danger,
  },

  // Bottom link
  divider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSoft,
  },
  dividerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primaryDark,
  },
});
