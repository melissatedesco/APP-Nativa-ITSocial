import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { ClasseCorsoDto, IstitutoDto } from '../../types';
import { useAdminList } from '../../hooks/useAdminList';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { AdminCountBar } from '../../components/admin/AdminCountBar';
import { FormModal } from '../../components/admin/FormModal';
import { Field } from '../../components/admin/Field';
import { confirmDelete } from '../../utils/confirmDelete';

const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  PUBBLICA: { bg: '#EFF6FF', color: '#2563EB' },
  PRIVATA:  { bg: '#FDF4FF', color: '#9333EA' },
};

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
    backgroundColor: '#EFF6FF',
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },
  tipoChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tipoText: { fontSize: 11, fontWeight: '700' },
  istitutoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  istitutoChipText: { fontSize: 11, fontWeight: '600', color: '#16A34A' },
  descText: { fontSize: 13, color: C.textSoft, lineHeight: 18 },
  divider: { height: 1, backgroundColor: C.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: C.textSoft },
  docenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.inputBg, borderRadius: 10, padding: 10,
  },
  docenteAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  docenteAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  docenteInfo: { flex: 1 },
  docenteName: { fontSize: 13, fontWeight: '700', color: C.text },
  docenteUsername: { fontSize: 11, color: C.textSoft },
  noDocenteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.inputBg, borderRadius: 10, padding: 10,
  },
  noDocenteText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  pickerLabel: { fontSize: 12, fontWeight: '600', color: C.textSoft, marginBottom: 6, marginTop: 4 },
  tipoRow: { flexDirection: 'row', gap: 10 },
  tipoBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center',
  },
  tipoBtnText: { fontSize: 13, fontWeight: '700' },
  istitutoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, marginBottom: 6,
  },
  istitutoItemText: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },
  istitutoItemSub: { fontSize: 11, color: C.textSoft },
});

type FormState = {
  nome: string;
  descrizione: string;
  tipo: 'PUBBLICA' | 'PRIVATA';
  istitutoId: number | null;
};

export default function AdminClasseCorsoScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);

  const { items: classi, setItems: setClassi, loading, refreshing, refresh } = useAdminList(
    () => adminService.getClassi(),
    'Impossibile caricare le classi corso.'
  );

  const [istituti, setIstituti] = useState<IstitutoDto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ nome: '', descrizione: '', tipo: 'PUBBLICA', istitutoId: null });
  const [nomeError, setNomeError] = useState<string | undefined>(undefined);

  useEffect(() => {
    adminService.getIstituti().then(setIstituti).catch(() => {});
  }, []);

  function openEdit(item: ClasseCorsoDto) {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      descrizione: item.descrizione ?? '',
      tipo: (item.tipo as 'PUBBLICA' | 'PRIVATA') ?? 'PUBBLICA',
      istitutoId: item.istitutoId ?? null,
    });
    setNomeError(undefined);
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.nome.trim()) { setNomeError('Il nome è obbligatorio.'); return; }
    if (editingId === null) return;
    setSaving(true);
    try {
      const updated = await adminService.modificaClasse(editingId, {
        nome: form.nome.trim(),
        descrizione: form.descrizione.trim() || undefined,
        tipo: form.tipo,
        istitutoId: form.istitutoId,
      });
      setClassi(prev => prev.map(c => c.id === editingId ? updated : c));
      setShowModal(false);
    } catch {
      Alert.alert('Errore', 'Impossibile modificare la classe corso.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number, nome: string) {
    confirmDelete(
      'Elimina classe',
      `Vuoi eliminare "${nome}"? Verranno eliminate anche tutte le iscrizioni associate.`,
      async () => {
        await adminService.eliminaClasse(id);
        setClassi(prev => prev.filter(c => c.id !== id));
      },
      'Impossibile eliminare la classe corso.'
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.primary} /></View>;

  return (
    <>
      <FlatList
        style={styles.page}
        data={classi}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.primary} />}
        ListHeaderComponent={<AdminCountBar label={`${classi.length} classi corso registrate`} />}
        ListEmptyComponent={<AdminEmptyState icon="book-open-variant" text="Nessuna classe corso" />}
        renderItem={({ item }) => {
          const tipoCol = TIPO_COLORS[item.tipo ?? ''] ?? { bg: C.inputBg, color: C.textSoft };
          const hasDocente = !!item.professoreNome;
          const firstLetter = (item.professoreNome ?? '?')[0].toUpperCase();
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name="book-open-variant" size={22} color="#2563EB" />
                </View>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <View style={[styles.tipoChip, { backgroundColor: tipoCol.bg }]}>
                  <Text style={[styles.tipoText, { color: tipoCol.color }]}>{item.tipo}</Text>
                </View>
              </View>

              {!!item.istitutoNome && (
                <View style={styles.istitutoChip}>
                  <MaterialCommunityIcons name="domain" size={13} color="#16A34A" />
                  <Text style={styles.istitutoChipText}>{item.istitutoNome}</Text>
                </View>
              )}

              {!!item.descrizione && (
                <Text style={styles.descText} numberOfLines={2}>{item.descrizione}</Text>
              )}
              <View style={styles.divider} />
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-group-outline" size={15} color={C.textSoft} />
                  <Text style={styles.infoText}>{item.numeroStudenti ?? 0} studenti</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="key-outline" size={15} color={C.textSoft} />
                  <Text style={styles.infoText}>{item.codiceInvito}</Text>
                </View>
              </View>
              {hasDocente ? (
                <View style={styles.docenteRow}>
                  <View style={styles.docenteAvatar}>
                    <Text style={styles.docenteAvatarText}>{firstLetter}</Text>
                  </View>
                  <View style={styles.docenteInfo}>
                    <Text style={styles.docenteName}>{item.professoreNome}</Text>
                    <Text style={styles.docenteUsername}>@{item.professoreUsername}</Text>
                  </View>
                  <MaterialCommunityIcons name="account-tie" size={18} color={C.textSoft} />
                </View>
              ) : (
                <View style={styles.noDocenteRow}>
                  <MaterialCommunityIcons name="account-off-outline" size={16} color={C.textMuted} />
                  <Text style={styles.noDocenteText}>Nessun docente assegnato</Text>
                </View>
              )}
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
          );
        }}
      />

      <FormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Modifica Classe Corso"
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel="Salva modifiche"
      >
        <Field
          label="Nome *"
          placeholder="es. 5A Informatica"
          value={form.nome}
          onChangeText={v => { setForm(p => ({ ...p, nome: v })); setNomeError(undefined); }}
          error={nomeError}
        />
        <Field
          label="Descrizione (opzionale)"
          placeholder="Breve descrizione della classe..."
          value={form.descrizione}
          onChangeText={v => setForm(p => ({ ...p, descrizione: v }))}
          multiline
        />

        <Text style={styles.pickerLabel}>Tipo iscrizione</Text>
        <View style={styles.tipoRow}>
          {(['PUBBLICA', 'PRIVATA'] as const).map(t => {
            const sel = form.tipo === t;
            const col = TIPO_COLORS[t];
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tipoBtn, {
                  borderColor: sel ? col.color : C.border,
                  backgroundColor: sel ? col.bg : C.inputBg,
                }]}
                onPress={() => setForm(p => ({ ...p, tipo: t }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.tipoBtnText, { color: sel ? col.color : C.textSoft }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.pickerLabel, { marginTop: 12 }]}>
          Istituto {form.istitutoId ? '✓' : '— nessuno selezionato'}
        </Text>
        {istituti.length === 0 ? (
          <Text style={{ fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>
            Nessun istituto disponibile. Creane uno dalla sezione Istituti.
          </Text>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.istitutoItem, {
                borderColor: form.istitutoId === null ? C.primary : C.border,
                backgroundColor: form.istitutoId === null ? C.primary + '10' : C.inputBg,
              }]}
              onPress={() => setForm(p => ({ ...p, istitutoId: null }))}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="minus-circle-outline" size={18} color={form.istitutoId === null ? C.primary : C.textMuted} />
              <Text style={[styles.istitutoItemText, { color: form.istitutoId === null ? C.primary : C.textMuted }]}>
                Nessun istituto
              </Text>
              {form.istitutoId === null && <MaterialCommunityIcons name="check-circle" size={18} color={C.primary} />}
            </TouchableOpacity>
            {istituti.map(ist => {
              const sel = form.istitutoId === ist.id;
              return (
                <TouchableOpacity
                  key={ist.id}
                  style={[styles.istitutoItem, {
                    borderColor: sel ? '#16A34A' : C.border,
                    backgroundColor: sel ? '#F0FDF4' : C.inputBg,
                  }]}
                  onPress={() => setForm(p => ({ ...p, istitutoId: ist.id }))}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="domain" size={18} color={sel ? '#16A34A' : C.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.istitutoItemText}>{ist.nome}</Text>
                    {!!ist.citta && <Text style={styles.istitutoItemSub}>{ist.citta}</Text>}
                  </View>
                  {sel && <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </FormModal>
    </>
  );
}
