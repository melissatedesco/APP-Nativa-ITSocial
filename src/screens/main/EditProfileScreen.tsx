import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';
import { userService } from '../../services/userService';

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

const AVATAR_GRADIENT: [string, string] = ['#6BA3E0', '#2B5BA8'];
const AVATAR_SIZE = 96;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile, loadProfile, updateProfile } = useProfile();

  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
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
    } else if (user) {
      setNome(user.nome ?? '');
      setCognome(user.cognome ?? '');
    }
  }, [profile]);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso richiesto', 'Abilita l\'accesso alla galleria nelle impostazioni.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!nome.trim() || !cognome.trim()) {
      setError('Nome e Cognome sono obbligatori.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Upload photo first if selected
      if (photoUri) {
        setSavingPhoto(true);
        try {
          await userService.updateProfilePhoto(photoUri);
          setSavingPhoto(false);
        } catch {
          setSavingPhoto(false);
          Alert.alert(
            'Foto non aggiornata',
            'Il caricamento della foto ha fallito. Gli altri dati verranno comunque salvati.',
          );
        }
      }

      // Update text fields
      await updateProfile({
        nome: nome.trim(),
        cognome: cognome.trim(),
        bio: bio.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch (err: any) {
      setError(err?.message ?? 'Impossibile salvare il profilo.');
    } finally {
      setSaving(false);
    }
  }

  const currentPhoto = photoUri ?? profile?.fotoProfilo ?? null;
  const displayInitial = ((nome || user?.nome || '?')[0]).toUpperCase();

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
          <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap} activeOpacity={0.8}>
            {currentPhoto ? (
              <Image source={{ uri: currentPhoto }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatarGradient}>
                <Text style={styles.avatarLetter}>{displayInitial}</Text>
              </LinearGradient>
            )}
            <View style={styles.avatarEditOverlay}>
              <Text style={styles.avatarEditIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tocca per cambiare foto</Text>
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
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Scriviti qualcosa su di te…"
              placeholderTextColor={C.textMuted}
              value={bio}
              onChangeText={v => { setBio(v); setError(''); }}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>
          </View>

          {error !== '' && (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.alertSuccess}>
              <Text style={styles.alertSuccessText}>✓ Profilo aggiornato!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (saving || !nome.trim() || !cognome.trim()) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || !nome.trim() || !cognome.trim()}
            activeOpacity={0.85}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveBtnText}>
                  {savingPhoto ? 'Caricamento foto…' : 'Salvataggio…'}
                </Text>
              </>
            ) : (
              <Text style={styles.saveBtnText}>Salva modifiche</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: AVATAR_SIZE * 0.32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: { fontSize: 16 },
  avatarHint: { fontSize: 12, color: C.textSoft },

  formCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    gap: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: C.text },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    fontSize: 14,
    color: C.text,
  },
  bioInput: {
    minHeight: 96,
    paddingTop: 11,
  },
  charCount: { fontSize: 11, color: C.textMuted, alignSelf: 'flex-end' },

  alertError: {
    padding: 12,
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    borderRadius: 12,
  },
  alertErrorText: { fontSize: 13, color: C.danger, fontWeight: '500' },

  alertSuccess: {
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
    elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelBtnText: { fontSize: 14, color: C.textSoft, fontWeight: '500' },
});
