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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { userService } from '../../services/userService';
import { MEDIA_BASE_URL } from '../../services/api';

const AVATAR_SIZE = 100;

const makeStyles = (C: ThemeColors, isDark: boolean) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  scrollContent: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 24,
    alignItems: 'center',
  },

  avatarSection: { alignItems: 'center', gap: 10 },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'visible',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 38, fontWeight: '800' },
  avatarCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.bg,
  },
  avatarHint: { fontSize: 12, color: C.textSoft },

  formCard: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    gap: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: C.text },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: C.inputBg,
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
    borderColor: C.danger + '40',
    borderRadius: 12,
  },
  alertErrorText: { fontSize: 13, color: C.danger, fontWeight: '500', flex: 1 },

  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: isDark ? 'rgba(74,222,128,0.12)' : '#D1FAE5',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(74,222,128,0.30)' : '#A7F3D0',
    borderRadius: 12,
  },
  alertSuccessText: { fontSize: 13, color: isDark ? '#4ade80' : '#065F46', fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: C.primary,
    borderRadius: 9999,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
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

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile, loadProfile, updateProfile } = useProfile();
  const { colors: C, isDark } = useTheme();
  const styles = makeStyles(C, isDark);

  const AVATAR_GRADIENT: [string, string] = [C.primary, C.primaryDark];

  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [bio, setBio] = useState('');
  const [serverPhotoUrl, setServerPhotoUrl] = useState('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
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
      setServerPhotoUrl(profile.fotoProfilo ?? '');
    } else if (user) {
      setNome(user.nome ?? '');
      setCognome(user.cognome ?? '');
    }
  }, [profile]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso richiesto', "Abilita l'accesso alla galleria nelle impostazioni.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
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
      let finalPhotoUrl: string | undefined = serverPhotoUrl || undefined;

      if (localImageUri) {
        const updated = await userService.updateProfilePhoto(localImageUri);
        finalPhotoUrl = updated.fotoProfilo;
        setServerPhotoUrl(updated.fotoProfilo ?? '');
        setLocalImageUri(null);
      }

      await updateProfile({
        nome: nome.trim(),
        cognome: cognome.trim(),
        bio: bio.trim() || undefined,
        fotoProfilo: finalPhotoUrl,
      });

      setSuccess(true);
      setTimeout(() => navigation.goBack(), 800);
    } catch (err: any) {
      setError(err?.message ?? 'Impossibile salvare il profilo.');
    } finally {
      setSaving(false);
    }
  }

  const displayInitial = ((nome || user?.nome || '?')[0]).toUpperCase();
  const canSave = nome.trim().length > 0 && cognome.trim().length > 0 && !saving;

  // Build the URI to show in the avatar: prefer locally picked, then server URL
  const displayUri: string | null = localImageUri
    ?? (serverPhotoUrl
      ? (serverPhotoUrl.startsWith('http') ? serverPhotoUrl : MEDIA_BASE_URL + serverPhotoUrl)
      : null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar con image picker */}
        <TouchableOpacity
          style={styles.avatarSection}
          onPress={pickImage}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cambia foto profilo"
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatarInner}>
              {displayUri ? (
                <Image source={{ uri: displayUri }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={AVATAR_GRADIENT} style={styles.avatarGradient}>
                  <Text style={styles.avatarLetter}>{displayInitial}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.avatarCameraBtn}>
              <MaterialCommunityIcons name="camera" size={16} color="#fff" />
            </View>
          </View>
          <Text style={styles.avatarHint}>
            {localImageUri ? 'Foto selezionata — salva per applicare' : 'Tocca per cambiare la foto'}
          </Text>
        </TouchableOpacity>

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
