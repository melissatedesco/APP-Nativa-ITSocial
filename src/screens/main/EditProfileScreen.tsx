import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';

const C = {
  bg: '#F8FAFC',
  card: '#ffffff',
  border: '#E8F0F5',
  text: '#1A2433',
  textSoft: '#6b7280',
  textMuted: '#9ca3af',
  primary: '#00ACC1',
  primaryDark: '#0097A7',
  danger: '#dc2626',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
} as const;

const AVATAR_GRADIENT: [string, string] = ['#67E8F9', '#00ACC1'];
const AVATAR_SIZE = 96;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile, loadProfile, updateProfile } = useProfile();

  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [bio, setBio] = useState('');
  const [fotoProfilo, setFotoProfilo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!profile && user?.username) {
      loadProfile(user.username).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? '');
      setCognome(profile.cognome ?? '');
      setBio(profile.bio ?? '');
      setFotoProfilo(profile.fotoProfilo ?? '');
    } else if (user) {
      setNome(user.nome ?? '');
      setCognome(user.cognome ?? '');
    }
  }, [profile]);

  async function handleSave() {
    if (!nome.trim() || !cognome.trim()) {
      setError('Nome e Cognome sono obbligatori.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile({
        nome: nome.trim(),
        cognome: cognome.trim(),
        bio: bio.trim() || undefined,
        fotoProfilo: fotoProfilo.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => navigation.goBack(), 800);
    } catch (err: any) {
      setError(err?.message ?? 'Impossibile salvare il profilo.');
    } finally {
      setSaving(false);
    }
  }

  const currentPhoto = fotoProfilo.trim() || profile?.fotoProfilo || null;
  const displayInitial = ((nome || user?.nome || '?')[0]).toUpperCase();
  const canSave = nome.trim().length > 0 && cognome.trim().length > 0 && !saving;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {currentPhoto ? (
              <Image source={{ uri: currentPhoto }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatarGradient}>
                <Text style={styles.avatarLetter}>{displayInitial}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.avatarHint}>
            Inserisci un URL foto nel campo sottostante
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>

          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Il tuo nome"
              placeholderTextColor={C.textMuted}
              value={nome}
              onChangeText={v => { setNome(v); setError(''); }}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cognome</Text>
            <TextInput
              style={styles.input}
              placeholder="Il tuo cognome"
              placeholderTextColor={C.textMuted}
              value={cognome}
              onChangeText={v => { setCognome(v); setError(''); }}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Foto profilo (URL)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://esempio.com/mia-foto.jpg"
              placeholderTextColor={C.textMuted}
              value={fotoProfilo}
              onChangeText={v => { setFotoProfilo(v); setError(''); }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Scriviti qualcosa su di te…"
              placeholderTextColor={C.textMuted}
              value={bio}
              onChangeText={v => { setBio(v); setError(''); }}
              multiline
              maxLength={160}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>

          {error !== '' && (
            <View style={styles.alertError}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={C.danger} />
              <Text style={styles.alertErrorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.alertSuccess}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#065F46" />
              <Text style={styles.alertSuccessText}>Profilo aggiornato!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveBtnText}>Salvataggio…</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Salva modifiche</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Annulla</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  scrollContent: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 24,
    alignItems: 'center',
  },

  avatarSection: { alignItems: 'center', gap: 8 },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  avatarHint: { fontSize: 12, color: C.textSoft },

  formCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    gap: 20,
    shadowColor: '#1A2433',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: C.text },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    fontSize: 14,
    color: C.text,
  },
  bioInput: {
    minHeight: 96,
    paddingTop: 11,
  },
  charCount: { fontSize: 11, color: C.textMuted, alignSelf: 'flex-end' },

  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    borderRadius: 12,
  },
  alertErrorText: { fontSize: 13, color: C.danger, fontWeight: '500', flex: 1 },

  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
  },
  alertSuccessText: { fontSize: 13, color: '#065F46', fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: C.primary,
    borderRadius: 9999,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: { fontSize: 14, color: C.textSoft, fontWeight: '500' },
});
