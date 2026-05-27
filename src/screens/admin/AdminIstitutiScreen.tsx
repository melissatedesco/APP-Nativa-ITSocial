import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert, Modal, ScrollView,
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
import { ITS_ITALIA, AREE_ITS, AREA_COLORS } from '../../data/itsItalia';

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

  // ── Import ITS modal
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  importModal:   { flex: 1, marginTop: 60, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  importHeader:  { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  importTitle:   { fontSize: 17, fontWeight: '800', color: C.text },
  importSubtitle:{ fontSize: 11, color: C.textSoft, marginTop: 2 },
  importActions: { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: C.border },
  importBtn:     { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  importBtnText: { fontSize: 14, fontWeight: '700' },

  areaSection:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  areaLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },

  itsCard:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  itsCardSelected: { backgroundColor: C.primary + '0D' },
  itsIconWrap:   { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itsInfo:       { flex: 1 },
  itsNome:       { fontSize: 13, fontWeight: '700', color: C.text },
  itsMeta:       { fontSize: 11, color: C.textSoft, marginTop: 1 },
  itsCheck:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});

type FormState = { nome: string; descrizione: string; citta: string; url: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

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
  const [form, setForm] = useState<FormState>({ nome: '', descrizione: '', citta: '', url: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Import ITS Italia ──
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  function toggleSelect(nome: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(nome) ? next.delete(nome) : next.add(nome);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(ITS_ITALIA.map(i => i.nome)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function handleImport() {
    if (selected.size === 0) {
      Alert.alert('Attenzione', 'Seleziona almeno un istituto.');
      return;
    }
    setImporting(true);
    const toImport = ITS_ITALIA.filter(i => selected.has(i.nome));
    let ok = 0;
    let fail = 0;
    for (const its of toImport) {
      try {
        await adminService.creaIstituto({
          nome: its.nome,
          citta: its.citta,
          descrizione: `[${its.area}] ${its.descrizione}`,
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setImporting(false);
    setShowImport(false);
    setSelected(new Set());
    reload();
    Alert.alert(
      'Importazione completata',
      `${ok} istituti importati con successo${fail > 0 ? `, ${fail} già presenti o con errore` : ''}.`
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm({ nome: '', descrizione: '', citta: '', url: '' });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(item: IstitutoDto) {
    setEditingId(item.id);
    setForm({ nome: item.nome, descrizione: item.descrizione ?? '', citta: item.citta ?? '', url: item.url ?? '' });
    setErrors({});
    setShowModal(true);
  }

  async function handleSubmit() {
    const newErrors: FormErrors = {};
    if (!form.nome.trim()) newErrors.nome = 'Il nome è obbligatorio.';
    if (form.url.trim() && !/^https?:\/\/.+/.test(form.url.trim())) {
      newErrors.url = 'Inserisci un URL valido (es. https://www.its.it).';
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descrizione: form.descrizione.trim() || undefined,
        citta: form.citta.trim() || undefined,
        url: form.url.trim() || undefined,
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
          <View>
            <AdminCountBar
              label={`${istituti.length} istituti registrati`}
              onAdd={openCreate}
              addLabel="Nuovo"
            />
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' }}
              onPress={() => { setSelected(new Set()); setShowImport(true); }}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="download-outline" size={18} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563EB' }}>Importa ITS Italia</Text>
                <Text style={{ fontSize: 11, color: '#3B82F6', marginTop: 1 }}>Carica gli istituti ITS Academy ufficiali italiani</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>
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
            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
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
            {!!item.url && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="web" size={15} color={C.textSoft} />
                <Text style={[styles.infoText, { color: C.primary, flexShrink: 1 }]} numberOfLines={1}>{item.url}</Text>
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
          label="Nome *"
          placeholder="es. ITS Academy Milano"
          value={form.nome}
          onChangeText={v => { setForm(p => ({ ...p, nome: v })); setErrors(p => ({ ...p, nome: undefined })); }}
          error={errors.nome}
        />
        <Field
          label="Città (opzionale)"
          placeholder="es. Milano"
          value={form.citta}
          onChangeText={v => setForm(p => ({ ...p, citta: v }))}
        />
        <Field
          label="Sito web (opzionale)"
          placeholder="es. https://www.itscadmo.it"
          value={form.url}
          onChangeText={v => { setForm(p => ({ ...p, url: v })); setErrors(p => ({ ...p, url: undefined })); }}
          error={errors.url}
          keyboardType="url"
          autoCapitalize="none"
        />
        <Field
          label="Descrizione (opzionale)"
          placeholder="Breve descrizione dell'istituto..."
          value={form.descrizione}
          onChangeText={v => setForm(p => ({ ...p, descrizione: v }))}
          multiline
        />
      </FormModal>

      {/* ── Modale Importa ITS Italia ── */}
      <Modal visible={showImport} animationType="slide" transparent onRequestClose={() => setShowImport(false)}>
        <View style={styles.overlay}>
          <View style={styles.importModal}>

            {/* Header */}
            <View style={styles.importHeader}>
              <MaterialCommunityIcons name="domain" size={26} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.importTitle}>ITS Academy Italia</Text>
                <Text style={styles.importSubtitle}>{ITS_ITALIA.length} istituti disponibili · {selected.size} selezionati</Text>
              </View>
              <TouchableOpacity onPress={() => setShowImport(false)}>
                <MaterialCommunityIcons name="close" size={22} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Selezione rapida */}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <TouchableOpacity
                onPress={selectAll}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <MaterialCommunityIcons name="check-all" size={14} color="#fff" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Tutti</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={deselectAll}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <MaterialCommunityIcons name="close" size={14} color={C.textSoft} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.textSoft }}>Nessuno</Text>
              </TouchableOpacity>
            </View>

            {/* Lista per area */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {AREE_ITS.map(area => {
                const lista = ITS_ITALIA.filter(i => i.area === area);
                const col = AREA_COLORS[area];
                return (
                  <View key={area}>
                    <View style={styles.areaSection}>
                      <Text style={[styles.areaLabel, { color: col.color }]}>
                        {area} ({lista.length})
                      </Text>
                    </View>
                    {lista.map(its => {
                      const isSelected = selected.has(its.nome);
                      return (
                        <TouchableOpacity
                          key={its.nome}
                          style={[styles.itsCard, isSelected && styles.itsCardSelected]}
                          onPress={() => toggleSelect(its.nome)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.itsIconWrap, { backgroundColor: col.bg }]}>
                            <MaterialCommunityIcons name={col.icon as any} size={18} color={col.color} />
                          </View>
                          <View style={styles.itsInfo}>
                            <Text style={styles.itsNome} numberOfLines={1}>{its.nome}</Text>
                            <Text style={styles.itsMeta}>{its.citta} · {its.regione}</Text>
                          </View>
                          <View style={[styles.itsCheck, {
                            borderColor: isSelected ? C.primary : C.border,
                            backgroundColor: isSelected ? C.primary : 'transparent',
                          }]}>
                            {isSelected && <MaterialCommunityIcons name="check" size={13} color="#fff" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.importActions}>
              <TouchableOpacity
                style={[styles.importBtn, { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border }]}
                onPress={() => setShowImport(false)}
                disabled={importing}
              >
                <Text style={[styles.importBtnText, { color: C.textSoft }]}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importBtn, { backgroundColor: selected.size === 0 ? C.border : C.primary, flex: 2 }]}
                onPress={handleImport}
                disabled={importing || selected.size === 0}
                activeOpacity={0.8}
              >
                {importing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <MaterialCommunityIcons name="download" size={16} color="#fff" />
                }
                <Text style={[styles.importBtnText, { color: '#fff' }]}>
                  {importing ? 'Importazione…' : `Importa ${selected.size} istituti`}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
}
