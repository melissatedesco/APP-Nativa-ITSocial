import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, ActivityIndicator,
  Alert, RefreshControl, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: C.textSoft, fontSize: 14 },
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
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: C.textSoft, marginBottom: 4 },
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

export default function AdminPermessiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const [sections, setSections] = useState<{ title: string; data: any[] }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', alias: '' });

  const load = useCallback(async () => {
    try {
      const data = await adminService.getPermessi();
      setTotal(data.length);
      const grouped: Record<string, any[]> = {};
      for (const p of data) {
        const gruppo = p.gruppo?.nome ?? 'Altro';
        if (!grouped[gruppo]) grouped[gruppo] = [];
        grouped[gruppo].push(p);
      }
      setSections(Object.entries(grouped).map(([title, items]) => ({ title, data: items })));
    } catch {
      Alert.alert('Errore', 'Impossibile caricare i permessi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  function handleDelete(id: number, nome: string) {
    Alert.alert('Elimina permesso', `Vuoi eliminare "${nome}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive',
        onPress: async () => {
          try {
            await adminService.eliminaPermesso(id);
            setSections(prev => prev
              .map(s => ({ ...s, data: s.data.filter(p => p.id !== id) }))
              .filter(s => s.data.length > 0)
            );
            setTotal(t => t - 1);
          } catch {
            Alert.alert('Errore', 'Impossibile eliminare il permesso.');
          }
        },
      },
    ]);
  }

  async function handleCreate() {
    const { nome, alias } = form;
    if (!nome.trim() || !alias.trim()) {
      Alert.alert('Attenzione', 'Compila nome e alias.');
      return;
    }
    setSaving(true);
    try {
      const newP = await adminService.creaPermesso({ nome: nome.trim(), alias: alias.trim().toUpperCase() });
      setForm({ nome: '', alias: '' });
      setShowModal(false);
      await load();
    } catch {
      Alert.alert('Errore', 'Impossibile creare il permesso. L\'alias potrebbe essere già in uso.');
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        ListHeaderComponent={
          <View style={styles.countBar}>
            <Text style={styles.countText}>{total} permessi configurati</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <MaterialCommunityIcons name="plus" size={14} color="#fff" />
              <Text style={styles.addBtnText}>Nuovo</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialCommunityIcons name="key-off-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>Nessun permesso</Text>
          </View>
        }
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

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Nuovo Permesso</Text>
            <View>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="es. Lettura permessi"
                placeholderTextColor={C.textMuted}
                value={form.nome}
                onChangeText={v => setForm(p => ({ ...p, nome: v }))}
              />
            </View>
            <View>
              <Text style={styles.label}>Alias (identificativo univoco)</Text>
              <TextInput
                style={styles.input}
                placeholder="es. PERMESSO_READ"
                placeholderTextColor={C.textMuted}
                value={form.alias}
                onChangeText={v => setForm(p => ({ ...p, alias: v.toUpperCase() }))}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Crea permesso</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Annulla</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
