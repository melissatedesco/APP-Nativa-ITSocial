import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Alert, RefreshControl, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';

type DocenteForm = {
  nome: string;
  cognome: string;
  email: string;
  username: string;
  password: string;
};

const EMPTY_FORM: DocenteForm = { nome: '', cognome: '', email: '', username: '', password: '' };

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: C.textSoft, fontSize: 14 },
  countBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  countText: { fontSize: 13, color: C.textSoft, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primary, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  info: { flex: 1, gap: 2 },
  nome: { fontSize: 15, fontWeight: '700', color: C.text },
  usernameText: { fontSize: 12, color: C.textSoft },
  email: { fontSize: 12, color: C.textSoft },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2 },
  sheetSub: { fontSize: 13, color: C.textSoft, marginBottom: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  fieldWrap: { flex: 1, gap: 4 },
  label: { fontSize: 12, fontWeight: '600', color: C.textSoft },
  input: {
    backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text,
  },
  submitBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: C.textSoft, fontSize: 14 },
});

const AVATAR_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function AdminDocentiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const [docenti, setDocenti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<DocenteForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setDocenti(await adminService.getProfessori()); }
    catch { Alert.alert('Errore', 'Impossibile caricare i docenti.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModalMode('create');
  }

  function openEdit(item: any) {
    setForm({
      nome: item.nome ?? '',
      cognome: item.cognome ?? '',
      email: item.email ?? '',
      username: item.username ?? '',
      password: '',
    });
    setEditTarget(item);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
  }

  function handleDelete(item: any) {
    Alert.alert('Elimina docente', `Vuoi eliminare ${item.nome} ${item.cognome}?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive',
        onPress: async () => {
          try {
            await adminService.eliminaDocente(item.id);
            setDocenti(prev => prev.filter(d => d.id !== item.id));
          } catch {
            Alert.alert('Errore', 'Impossibile eliminare il docente.');
          }
        },
      },
    ]);
  }

  async function handleSave() {
    const { nome, cognome, email, username, password } = form;
    if (!nome.trim() || !cognome.trim() || !email.trim()) {
      Alert.alert('Attenzione', 'Nome, cognome ed email sono obbligatori.');
      return;
    }
    if (modalMode === 'create' && (!username.trim() || !password.trim())) {
      Alert.alert('Attenzione', 'Username e password sono obbligatori per un nuovo docente.');
      return;
    }
    setSaving(true);
    try {
      if (modalMode === 'create') {
        const created = await adminService.creaProfessore({ nome, cognome, email, username, password });
        setDocenti(prev => [...prev, created]);
      } else if (modalMode === 'edit' && editTarget) {
        const payload: any = { nome, cognome, email, username };
        if (password.trim()) payload.password = password;
        const updated = await adminService.modificaDocente(editTarget.id, payload);
        setDocenti(prev => prev.map(d => d.id === editTarget.id ? updated : d));
      }
      closeModal();
    } catch {
      Alert.alert('Errore', modalMode === 'create'
        ? 'Impossibile creare il docente. Username o email già in uso.'
        : 'Impossibile aggiornare il docente.');
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ label, field, placeholder, secure, half }: {
    label: string; field: keyof DocenteForm; placeholder: string; secure?: boolean; half?: boolean;
  }) => (
    <View style={[half ? styles.fieldWrap : undefined, !half && { gap: 4 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        value={form[field]}
        onChangeText={v => setForm(p => ({ ...p, [field]: v }))}
        secureTextEntry={secure}
        autoCapitalize="none"
        keyboardType={field === 'email' ? 'email-address' : 'default'}
      />
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <>
      <FlatList
        style={styles.page}
        data={docenti}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        ListHeaderComponent={
          <View style={styles.countBar}>
            <Text style={styles.countText}>{docenti.length} docenti registrati</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
              <MaterialCommunityIcons name="plus" size={14} color="#fff" />
              <Text style={styles.addBtnText}>Aggiungi</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialCommunityIcons name="account-tie-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>Nessun docente</Text>
          </View>
        }
        renderItem={({ item }) => {
          const initials = `${(item.nome ?? '?')[0]}${(item.cognome ?? '')[0] ?? ''}`.toUpperCase();
          const bgColor = avatarColor(item.nome ?? 'A');
          return (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: bgColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nome}>{item.nome} {item.cognome}</Text>
                <Text style={styles.usernameText}>@{item.username}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color={C.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={C.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={modalMode !== null} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>
              {modalMode === 'create' ? 'Nuovo Docente' : 'Modifica Docente'}
            </Text>
            <Text style={styles.sheetSub}>
              {modalMode === 'edit' ? 'Lascia la password vuota per non modificarla.' : ''}
            </Text>

            <View style={styles.row2}>
              <Field label="Nome *" field="nome" placeholder="Mario" half />
              <Field label="Cognome *" field="cognome" placeholder="Rossi" half />
            </View>
            <Field label="Email *" field="email" placeholder="mario.rossi@its.it" />
            <Field label="Username *" field="username" placeholder="mario.rossi" />
            <Field
              label={modalMode === 'edit' ? 'Nuova password (opzionale)' : 'Password *'}
              field="password"
              placeholder="Min. 8 caratteri"
              secure
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>
                    {modalMode === 'create' ? 'Crea docente' : 'Salva modifiche'}
                  </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelText}>Annulla</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
