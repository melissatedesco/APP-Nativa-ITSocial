import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifPrefs, NotifPrefs } from '../../context/NotifPrefsContext';
import { authService } from '../../services/authService';

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 48 },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  group: {
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  rowSub: { fontSize: 12, color: C.textSoft, marginTop: 1 },

  dangerLabel: { flex: 1, fontSize: 15, color: C.danger, fontWeight: '600' },

  // ── Change password modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 13 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: C.textSoft, fontSize: 14 },
});

// ─── ChangePasswordModal ──────────────────────────────────────────────────────

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [vecchia, setVecchia] = useState('');
  const [nuova, setNuova] = useState('');
  const [conferma, setConferma] = useState('');
  const [showVecchia, setShowVecchia] = useState(false);
  const [showNuova, setShowNuova] = useState(false);
  const [showConferma, setShowConferma] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setVecchia(''); setNuova(''); setConferma('');
    setShowVecchia(false); setShowNuova(false); setShowConferma(false);
  }

  async function handleSubmit() {
    if (!vecchia.trim()) { Alert.alert('Errore', 'Inserisci la password attuale.'); return; }
    if (nuova.length < 6)  { Alert.alert('Errore', 'La nuova password deve avere almeno 6 caratteri.'); return; }
    if (nuova !== conferma) { Alert.alert('Errore', 'Le password non coincidono.'); return; }
    setLoading(true);
    try {
      await authService.cambiaPassword(vecchia, nuova);
      Alert.alert('Successo', 'Password aggiornata con successo.');
      reset();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data ?? 'Errore durante il cambio password.';
      Alert.alert('Errore', String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity activeOpacity={1}>
            <View style={S.modalCard}>
              <Text style={S.modalTitle}>Cambia password</Text>

              {/* Vecchia password */}
              <View style={S.inputWrap}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={C.textMuted} />
                <TextInput
                  style={S.input}
                  value={vecchia}
                  onChangeText={setVecchia}
                  placeholder="Password attuale"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showVecchia}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowVecchia(v => !v)}>
                  <MaterialCommunityIcons name={showVecchia ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Nuova password */}
              <View style={S.inputWrap}>
                <MaterialCommunityIcons name="lock-reset" size={20} color={C.textMuted} />
                <TextInput
                  style={S.input}
                  value={nuova}
                  onChangeText={setNuova}
                  placeholder="Nuova password (min. 6 caratteri)"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showNuova}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNuova(v => !v)}>
                  <MaterialCommunityIcons name={showNuova ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Conferma */}
              <View style={[S.inputWrap, { borderColor: conferma && nuova !== conferma ? C.danger : C.border }]}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={C.textMuted} />
                <TextInput
                  style={S.input}
                  value={conferma}
                  onChangeText={setConferma}
                  placeholder="Conferma nuova password"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showConferma}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowConferma(v => !v)}>
                  <MaterialCommunityIcons name={showConferma ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[S.submitBtn, { opacity: loading ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <MaterialCommunityIcons name="check" size={18} color="#fff" />
                }
                <Text style={S.submitBtnText}>Aggiorna password</Text>
              </TouchableOpacity>

              <TouchableOpacity style={S.cancelBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={S.cancelBtnText}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Row components ───────────────────────────────────────────────────────────

function ToggleRow({
  icon, iconBg, label, sub, value, onChange, isLast,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconBg: string;
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  return (
    <View style={[S.row, isLast && S.rowLast]}>
      <View style={[S.rowIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.rowLabel}>{label}</Text>
        {sub ? <Text style={S.rowSub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.primary + 'aa' }}
        thumbColor={value ? C.primary : C.textMuted}
      />
    </View>
  );
}

function ArrowRow({
  icon, iconBg, label, sub, onPress, isLast, danger,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconBg: string;
  label: string;
  sub?: string;
  onPress: () => void;
  isLast?: boolean;
  danger?: boolean;
}) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  return (
    <TouchableOpacity style={[S.row, isLast && S.rowLast]} onPress={onPress} activeOpacity={0.7}>
      <View style={[S.rowIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={danger ? S.dangerLabel : S.rowLabel}>{label}</Text>
        {sub ? <Text style={S.rowSub}>{sub}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={danger ? C.danger : C.textMuted} />
    </TouchableOpacity>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { prefs, setVibra, setTipo } = useNotifPrefs();
  const S = makeStyles(C);
  const [pwdVisible, setPwdVisible] = useState(false);

  function handleLogout() {
    Alert.alert(
      'Esci',
      'Sei sicuro di voler uscire dall\'account?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Esci', style: 'destructive', onPress: () => logout() },
      ],
    );
  }

  const tipi: { key: keyof NotifPrefs['tipi']; label: string; sub: string }[] = [
    { key: 'like',       label: 'Like',          sub: 'Quando qualcuno mette like a un tuo post' },
    { key: 'commento',   label: 'Commenti',       sub: 'Quando qualcuno commenta il tuo post' },
    { key: 'seguito',    label: 'Nuovi seguaci',  sub: 'Quando qualcuno inizia a seguirti' },
    { key: 'iscrizione', label: 'Iscrizioni',     sub: 'Aggiornamenti sulle richieste di classe' },
    { key: 'annuncio',   label: 'Annunci classe', sub: 'Nuovi annunci nelle classi a cui sei iscritto' },
  ];

  return (
    <ScrollView style={S.page} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

      {/* ── Aspetto ── */}
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>Aspetto</Text>
      </View>
      <View style={S.group}>
        <ToggleRow
          icon={isDark ? 'weather-night' : 'weather-sunny'}
          iconBg={isDark ? '#4A5568' : '#F59E0B'}
          label="Tema scuro"
          sub={isDark ? 'Modalità notte attiva' : 'Modalità chiara attiva'}
          value={isDark}
          onChange={toggleTheme}
          isLast
        />
      </View>

      {/* ── Notifiche ── */}
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>Notifiche</Text>
      </View>
      <View style={S.group}>
        <ToggleRow
          icon="bell-ring-outline"
          iconBg={C.primary}
          label="Vibrazione notifiche"
          sub="Vibra quando arrivano nuove notifiche"
          value={prefs.vibraNotifiche}
          onChange={v => setVibra('vibraNotifiche', v)}
        />
        <ToggleRow
          icon="chat-outline"
          iconBg="#10b981"
          label="Vibrazione messaggi"
          sub="Vibra quando arrivano nuovi messaggi"
          value={prefs.vibraMessaggi}
          onChange={v => setVibra('vibraMessaggi', v)}
        />
        {tipi.map((t, i) => (
          <ToggleRow
            key={t.key}
            icon="bell-outline"
            iconBg="#64748b"
            label={t.label}
            sub={t.sub}
            value={prefs.tipi[t.key]}
            onChange={v => setTipo(t.key, v)}
            isLast={i === tipi.length - 1}
          />
        ))}
      </View>

      {/* ── Sicurezza ── */}
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>Sicurezza</Text>
      </View>
      <View style={S.group}>
        <ArrowRow
          icon="lock-outline"
          iconBg="#8b5cf6"
          label="Cambia password"
          sub="Aggiorna la tua password di accesso"
          onPress={() => setPwdVisible(true)}
          isLast
        />
      </View>

      {/* ── Account ── */}
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>Account</Text>
      </View>
      <View style={S.group}>
        <ArrowRow
          icon="logout"
          iconBg={C.danger}
          label="Esci"
          sub="Disconnettiti dall'account"
          onPress={handleLogout}
          danger
          isLast
        />
      </View>

      <ChangePasswordModal visible={pwdVisible} onClose={() => setPwdVisible(false)} />
    </ScrollView>
  );
}
