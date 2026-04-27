import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const FIELDS: { key: 'nome' | 'cognome' | 'username' | 'email' | 'password'; label: string }[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'cognome', label: 'Cognome' },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'password', label: 'Password (min 8 caratteri)' },
];

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({ nome: '', cognome: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function updateField(key: keyof typeof form) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister() {
    if (Object.values(form).some((v) => !v)) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Errore', 'La password deve essere di almeno 8 caratteri');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch {
      Alert.alert('Errore', 'Registrazione fallita. Username o email già in uso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Crea account</Text>

        {FIELDS.map(({ key, label }) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={label}
            value={form[key]}
            onChangeText={updateField(key)}
            autoCapitalize={key === 'nome' || key === 'cognome' ? 'words' : 'none'}
            keyboardType={key === 'email' ? 'email-address' : 'default'}
            secureTextEntry={key === 'password'}
            autoCorrect={false}
          />
        ))}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrati</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Hai già un account? Accedi</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a73e8',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#1a73e8',
    textAlign: 'center',
    fontSize: 14,
  },
});
