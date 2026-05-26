import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { useAdminList } from '../../hooks/useAdminList';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { AdminCountBar } from '../../components/admin/AdminCountBar';
import { FormModal } from '../../components/admin/FormModal';
import { Field } from '../../components/admin/Field';
import { confirmDelete } from '../../utils/confirmDelete';

type DocenteForm = {
  nome: string;
  cognome: string;
  email: string;
  username: string;
  password: string;
};

const EMPTY_FORM: DocenteForm = { nome: '', cognome: '', email: '', username: '', password: '' };

const AVATAR_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  row2: { flexDirection: 'row', gap: 10 },
});

export default function AdminDocentiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const { items: docenti, setItems: setDocenti, loading, refreshing, refresh } = useAdminList(
    () => adminService.getProfessori(),
    'Impossibile caricare i docenti.'
  );

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<DocenteForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModalMode('create');
  }

  function openEdit(item: any) {
    setForm({ nome: item.nome ?? '', cognome: item.cognome ?? '', email: item.email ?? '', username: item.username ?? '', password: '' });
    setEditTarget(item);
    setModalMode('edit');
  }

  function closeModal() { setModalMode(null); setEditTarget(null); }

  function handleDelete(item: any) {
    confirmDelete(
      'Elimina docente',
      `Vuoi eliminare ${item.nome} ${item.cognome}?`,
      async () => {
        await adminService.eliminaDocente(item.id);
        setDocenti(prev => prev.filter(d => d.id !== item.id));
      },
      'Impossibile eliminare il docente.'
    );
  }

  async function handleSave() {
    const { nome, cognome, email, username, password } = form;
    if (!nome.trim() || !cognome.trim() || !email.trim()) {
      return;
    }
    if (modalMode === 'create' && (!username.trim() || !password.trim())) {
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
      // Error handled by FormModal staying open
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <>
      <FlatList
        style={styles.page}
        data={docenti}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.primary} />}
        ListHeaderComponent={<AdminCountBar label={`${docenti.length} docenti registrati`} onAdd={openCreate} />}
        ListEmptyComponent={<AdminEmptyState icon="account-tie-outline" text="Nessun docente" />}
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

      <FormModal
        visible={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Nuovo Docente' : 'Modifica Docente'}
        subtitle={modalMode === 'edit' ? 'Lascia la password vuota per non modificarla.' : undefined}
        onSubmit={handleSave}
        saving={saving}
        submitLabel={modalMode === 'create' ? 'Crea docente' : 'Salva modifiche'}
      >
        <View style={styles.row2}>
          <Field label="Nome *" placeholder="Mario" value={form.nome} onChangeText={v => setForm(p => ({ ...p, nome: v }))} style={{ flex: 1 }} />
          <Field label="Cognome *" placeholder="Rossi" value={form.cognome} onChangeText={v => setForm(p => ({ ...p, cognome: v }))} style={{ flex: 1 }} />
        </View>
        <Field label="Email *" placeholder="mario.rossi@its.it" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Username *" placeholder="mario.rossi" value={form.username} onChangeText={v => setForm(p => ({ ...p, username: v }))} autoCapitalize="none" />
        <Field
          label={modalMode === 'edit' ? 'Nuova password (opzionale)' : 'Password *'}
          placeholder="Min. 8 caratteri"
          value={form.password}
          onChangeText={v => setForm(p => ({ ...p, password: v }))}
          secureTextEntry
          autoCapitalize="none"
        />
      </FormModal>
    </>
  );
}
