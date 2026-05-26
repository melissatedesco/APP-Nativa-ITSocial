import React, { useMemo, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, ActivityIndicator,
  Alert, RefreshControl, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { PermessoAdminDto } from '../../types';
import { adminService } from '../../services/adminService';
import { useAdminList } from '../../hooks/useAdminList';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { AdminCountBar } from '../../components/admin/AdminCountBar';
import { FormModal } from '../../components/admin/FormModal';
import { Field } from '../../components/admin/Field';
import { confirmDelete } from '../../utils/confirmDelete';

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.bg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  nome: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  alias: {
    backgroundColor: C.inputBg, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: C.border,
  },
  aliasText: { fontSize: 10, fontWeight: '700', color: C.textSoft },
  deleteBtn: { padding: 4 },
});

export default function AdminPermessiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const { items: permessi, setItems: setPermessi, loading, refreshing, refresh, reload } = useAdminList(
    () => adminService.getPermessi(),
    'Impossibile caricare i permessi.'
  );

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', alias: '' });

  const sections = useMemo(() => {
    const grouped: Record<string, PermessoAdminDto[]> = {};
    for (const p of permessi) {
      const gruppo = p.gruppo?.nome ?? 'Altro';
      if (!grouped[gruppo]) grouped[gruppo] = [];
      grouped[gruppo].push(p);
    }
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [permessi]);

  function handleDelete(id: number, nome: string) {
    confirmDelete(
      'Elimina permesso',
      `Vuoi eliminare "${nome}"?`,
      async () => {
        await adminService.eliminaPermesso(id);
        setPermessi(prev => prev.filter(p => p.id !== id));
      },
      'Impossibile eliminare il permesso.'
    );
  }

  async function handleCreate() {
    const { nome, alias } = form;
    if (!nome.trim() || !alias.trim()) {
      Alert.alert('Attenzione', 'Compila nome e alias.');
      return;
    }
    setSaving(true);
    try {
      await adminService.creaPermesso({ nome: nome.trim(), alias: alias.trim().toUpperCase() });
      setForm({ nome: '', alias: '' });
      setShowModal(false);
      reload();
    } catch {
      Alert.alert('Errore', "Impossibile creare il permesso. L'alias potrebbe essere già in uso.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <>
      <SectionList
        style={styles.page}
        sections={sections}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.primary} />}
        ListHeaderComponent={
          <AdminCountBar
            label={`${permessi.length} permessi configurati`}
            onAdd={() => setShowModal(true)}
            addLabel="Nuovo"
          />
        }
        ListEmptyComponent={<AdminEmptyState icon="key-outline" text="Nessun permesso" />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title} ({section.data.length})</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <MaterialCommunityIcons name="key-variant" size={18} color={C.primary} />
            <Text style={styles.nome}>{item.nome}</Text>
            <View style={styles.alias}>
              <Text style={styles.aliasText}>{item.alias}</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.nome)}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.danger} />
            </TouchableOpacity>
          </View>
        )}
      />

      <FormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Nuovo Permesso"
        onSubmit={handleCreate}
        saving={saving}
        submitLabel="Crea permesso"
      >
        <Field
          label="Nome"
          placeholder="es. Lettura permessi"
          value={form.nome}
          onChangeText={v => setForm(p => ({ ...p, nome: v }))}
        />
        <Field
          label="Alias (identificativo univoco)"
          placeholder="es. PERMESSO_READ"
          value={form.alias}
          onChangeText={v => setForm(p => ({ ...p, alias: v.toUpperCase() }))}
          autoCapitalize="characters"
        />
      </FormModal>
    </>
  );
}
