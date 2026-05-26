import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { IstitutoDto } from '../../types';
import { useAdminList } from '../../hooks/useAdminList';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { AdminCountBar } from '../../components/admin/AdminCountBar';
import { FormModal } from '../../components/admin/FormModal';
import { Field } from '../../components/admin/Field';
import { confirmDelete } from '../../utils/confirmDelete';

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    marginHorizontal: 12, marginVertical: 6,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  descText: { fontSize: 13, color: C.textSoft, lineHeight: 18 },
  divider: { height: 1, backgroundColor: C.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: C.textSoft },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
});

type FormState = { nome: string; descrizione: string; citta: string };

export default function AdminIstitutiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);

  const { items: istituti, setItems: setIstituti, loading, refreshing, refresh, reload } = useAdminList(
    () => adminService.getIstituti(),
    'Impossibile caricare gli istituti.'
  );

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ nome: '', descrizione: '', citta: '' });

  function openCreate() {
    setEditingId(null);
    setForm({ nome: '', descrizione: '', citta: '' });
    setShowModal(true);
  }

  function openEdit(item: IstitutoDto) {
    setEditingId(item.id);
    setForm({ nome: item.nome, descrizione: item.descrizione ?? '', citta: item.citta ?? '' });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.nome.trim()) { Alert.alert('Attenzione', 'Il nome è obbligatorio.'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descrizione: form.descrizione.trim() || undefined,
        citta: form.citta.trim() || undefined,
      };
      if (editingId !== null) {
        const updated = await adminService.modificaIstituto(editingId, payload);
        setIstituti(prev => prev.map(i => i.id === editingId ? updated : i));
      } else {
        await adminService.creaIstituto(payload);
        reload();
      }
      setShowModal(false);
    } catch {
      Alert.alert('Errore', 'Impossibile salvare l\'istituto.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number, nome: string) {
    confirmDelete(
      'Elimina istituto',
      `Vuoi eliminare "${nome}"? Le classi associate perderanno il collegamento all'istituto.`,
      async () => {
        await adminService.eliminaIstituto(id);
        setIstituti(prev => prev.filter(i => i.id !== id));
      },
      'Impossibile eliminare l\'istituto.'
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <>
      <FlatList
        style={styles.page}
        data={istituti}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.primary} />}
        ListHeaderComponent={
          <AdminCountBar
            label={`${istituti.length} istituti registrati`}
            onAdd={openCreate}
            addLabel="Nuovo"
          />
        }
        ListEmptyComponent={<AdminEmptyState icon="domain" text="Nessun istituto registrato" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="domain" size={22} color="#16A34A" />
              </View>
              <Text style={styles.cardTitle}>{item.nome}</Text>
            </View>
            {!!item.descrizione && (
              <Text style={styles.descText} numberOfLines={2}>{item.descrizione}</Text>
            )}
            <View style={styles.divider} />
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {!!item.citta && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={15} color={C.textSoft} />
                  <Text style={styles.infoText}>{item.citta}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="book-open-variant" size={15} color={C.textSoft} />
                <Text style={styles.infoText}>{item.numeroClassi} classi</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: C.primary, backgroundColor: C.primary + '12' }]}
                onPress={() => openEdit(item)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil-outline" size={14} color={C.primary} />
                <Text style={[styles.actionBtnText, { color: C.primary }]}>Modifica</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: C.danger, backgroundColor: C.danger + '12' }]}
                onPress={() => handleDelete(item.id, item.nome)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={14} color={C.danger} />
                <Text style={[styles.actionBtnText, { color: C.danger }]}>Elimina</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <FormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={editingId !== null ? 'Modifica Istituto' : 'Nuovo Istituto'}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={editingId !== null ? 'Salva modifiche' : 'Crea istituto'}
      >
        <Field
          label="Nome"
          placeholder="es. ITS Academy Milano"
          value={form.nome}
          onChangeText={v => setForm(p => ({ ...p, nome: v }))}
        />
        <Field
          label="Città (opzionale)"
          placeholder="es. Milano"
          value={form.citta}
          onChangeText={v => setForm(p => ({ ...p, citta: v }))}
        />
        <Field
          label="Descrizione (opzionale)"
          placeholder="Breve descrizione dell'istituto..."
          value={form.descrizione}
          onChangeText={v => setForm(p => ({ ...p, descrizione: v }))}
          multiline
        />
      </FormModal>
    </>
  );
}
