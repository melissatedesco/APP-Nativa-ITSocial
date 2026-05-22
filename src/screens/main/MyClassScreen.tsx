import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { classeService } from '../../services/classeService';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import {
  IscrizioneClasseDto,
  AnnuncioDto,
  CommentoAnnuncioDto,
  MaterialeClasseDto,
  CompitoDto,
} from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}g`;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function scadenzaInfo(iso?: string): { label: string; color: string } {
  if (!iso) return { label: 'Nessuna scadenza', color: '#64748b' };
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { label: 'Scaduto', color: '#ef4444' };
  if (days === 0) return { label: 'Scade oggi!', color: '#f97316' };
  if (days <= 3) return { label: `Scade in ${days}g`, color: '#f97316' };
  return { label: `${formatDate(iso)}`, color: '#16a34a' };
}

function statoBadge(stato: string) {
  if (stato === 'APPROVATA') return { label: 'Approvata', bg: 'rgba(74,222,128,0.15)',  text: '#16a34a' };
  if (stato === 'IN_ATTESA') return { label: 'In attesa',  bg: 'rgba(245,158,11,0.15)',  text: '#d97706' };
  return                           { label: 'Rifiutata',  bg: 'rgba(239,68,68,0.15)',    text: '#ef4444' };
}

function materialeIcon(tipo?: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  if (!tipo) return 'file-outline';
  const t = tipo.toUpperCase();
  if (t === 'IMMAGINE' || t === 'IMAGE') return 'image-outline';
  if (t === 'VIDEO') return 'video-outline';
  if (t === 'LINK') return 'link-variant';
  if (t === 'DOCUMENTO' || t === 'DOCUMENT' || t === 'PDF') return 'file-pdf-box';
  return 'file-outline';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page:         { flex: 1, backgroundColor: C.bg },
  listContent:  { padding: 16, paddingBottom: 48 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  errorTitle:   { fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center' },
  errorText:    { fontSize: 13, color: C.textSoft, textAlign: 'center' },
  emptyState:   { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle:{ fontSize: 13, color: C.textSoft, textAlign: 'center', paddingHorizontal: 32 },

  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: C.primary, borderRadius: 999,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: C.primary, borderRadius: 999,
  },
  btnOutlineText: { color: C.primary, fontSize: 14, fontWeight: '700' },

  // ── header banner
  banner: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  bannerBack: { position: 'absolute', top: 14, left: 14, padding: 6 },
  bannerContent: { alignItems: 'center', gap: 6 },
  bannerTitle: { fontSize: 21, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.3 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  // ── tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 11 },
  tabBtnActive: { borderBottomWidth: 2.5, borderBottomColor: C.primary },
  tabLabel: { fontSize: 12, fontWeight: '600', color: C.textSoft },
  tabLabelActive: { color: C.primary },

  // ── class list card
  classeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 15,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 14,
    shadowColor: '#1A2433', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  classeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  classeInfo: { flex: 1, gap: 3 },
  classeName: { fontSize: 15, fontWeight: '700', color: C.text },
  classeProfessore: { fontSize: 12, color: C.textSoft },

  // ── join banner
  joinBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 15,
    borderWidth: 1.5, borderColor: C.primary + '44',
    padding: 16, marginBottom: 20,
  },
  joinBannerText: { flex: 1 },
  joinBannerTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  joinBannerSub: { fontSize: 12, color: C.textSoft, marginTop: 2 },

  // ── annuncio
  annuncioCard: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10, overflow: 'hidden',
  },
  annuncioHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  annuncioInfo: { flex: 1 },
  annuncioTitolo: { fontSize: 14, fontWeight: '700', color: C.text },
  annuncioMeta: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  annuncioContenuto: { fontSize: 13, color: C.text, paddingHorizontal: 14, paddingBottom: 12, lineHeight: 20 },
  commentiToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  commentiToggleText: { fontSize: 12, color: C.textSoft },
  commentiSection: { backgroundColor: C.bgAlt ?? C.bg, paddingHorizontal: 14, paddingTop: 8 },
  commentoRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentoInfo: { flex: 1 },
  commentoAutore: { fontSize: 12, fontWeight: '700', color: C.text },
  commentoTesto: { fontSize: 13, color: C.text, marginTop: 2, lineHeight: 18 },
  commentoTime: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  addCommentoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  addCommentoInput: {
    flex: 1, fontSize: 13, color: C.text,
    backgroundColor: C.bg, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: C.border,
  },

  // ── materiale
  materialeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 8,
  },
  materialeIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.primary + '1a',
  },
  materialeInfo: { flex: 1 },
  materialeNome: { fontSize: 14, fontWeight: '600', color: C.text },
  materialeMeta: { fontSize: 12, color: C.textSoft, marginTop: 2 },

  // ── compito
  compitoCard: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 8,
  },
  compitoTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  compitoTitolo: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  scadenzaBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  scadenzaText: { fontSize: 11, fontWeight: '700' },
  compitoDescrizione: { fontSize: 13, color: C.textSoft, lineHeight: 18, marginTop: 4 },
  compitoPunti: { fontSize: 12, color: C.textSoft, marginTop: 6, fontWeight: '600' },

  // ── studente card
  studentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 13, marginBottom: 8,
  },
  studentInfo: { flex: 1, gap: 2 },
  studentName: { fontSize: 14, fontWeight: '700', color: C.text },
  studentUsername: { fontSize: 12, color: C.textSoft },
  roleBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },

  // ── avatar
  avatarCircle: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },

  // ── join modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36, gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center' },
  modalSub: { fontSize: 13, color: C.textSoft, textAlign: 'center', marginTop: -8 },
  codeInput: {
    fontSize: 22, fontWeight: '800', letterSpacing: 6,
    textAlign: 'center', color: C.text,
    borderWidth: 2, borderColor: C.border, borderRadius: 14,
    padding: 14, backgroundColor: C.bg,
  },
  codeInputFocused: { borderColor: C.primary },
});

// ─── AvatarCircle ─────────────────────────────────────────────────────────────

function AvatarCircle({ name, size = 40 }: { name?: string; size?: number }) {
  const { colors: C } = useTheme();
  const letters = (name ?? '?').split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  return (
    <LinearGradient
      colors={[C.primary, C.primaryDark]}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{letters || '?'}</Text>
    </LinearGradient>
  );
}

// ─── StudentiTab ──────────────────────────────────────────────────────────────

function StudentiTab({ classeId }: { classeId: number }) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [studenti, setStudenti] = useState<IscrizioneClasseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classeService.studentiClasse(classeId).then(d => setStudenti(d)).catch(() => {}).finally(() => setLoading(false));
  }, [classeId]);

  if (loading) return <View style={S.centered}><ActivityIndicator color={C.primary} /></View>;
  if (studenti.length === 0) return (
    <View style={S.emptyState}>
      <MaterialCommunityIcons name="account-group-outline" size={48} color={C.textMuted} />
      <Text style={S.emptyTitle}>Nessuno studente</Text>
    </View>
  );
  return (
    <FlatList
      data={studenti}
      keyExtractor={i => String(i.id)}
      contentContainerStyle={S.listContent}
      renderItem={({ item }) => {
        const badge = statoBadge(item.stato ?? '');
        return (
          <View style={S.studentCard}>
            <AvatarCircle name={item.studenteNome} size={42} />
            <View style={S.studentInfo}>
              <Text style={S.studentName} numberOfLines={1}>{item.studenteNome ?? 'Utente'}</Text>
              <Text style={S.studentUsername}>@{item.studenteUsername}</Text>
            </View>
            <View style={[S.roleBadge, { backgroundColor: badge.bg }]}>
              <Text style={[S.roleBadgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

// ─── MaterialiTab ─────────────────────────────────────────────────────────────

function MaterialiTab({ classeId }: { classeId: number }) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [materiali, setMateriali] = useState<MaterialeClasseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classeService.materiali(classeId).then(d => setMateriali(d)).catch(() => {}).finally(() => setLoading(false));
  }, [classeId]);

  if (loading) return <View style={S.centered}><ActivityIndicator color={C.primary} /></View>;
  if (materiali.length === 0) return (
    <View style={S.emptyState}>
      <MaterialCommunityIcons name="folder-open-outline" size={48} color={C.textMuted} />
      <Text style={S.emptyTitle}>Nessun materiale</Text>
      <Text style={S.emptySubtitle}>Il docente non ha ancora caricato materiali</Text>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={S.listContent}>
      {materiali.map(m => (
        <View key={m.id} style={S.materialeCard}>
          <View style={S.materialeIconWrap}>
            <MaterialCommunityIcons name={materialeIcon(m.tipo)} size={22} color={C.primary} />
          </View>
          <View style={S.materialeInfo}>
            <Text style={S.materialeNome} numberOfLines={2}>{m.nome}</Text>
            <Text style={S.materialeMeta}>{m.tipo} · {formatDate(m.dataCaricamento)}</Text>
          </View>
          <MaterialCommunityIcons name="download-outline" size={20} color={C.textMuted} />
        </View>
      ))}
    </ScrollView>
  );
}

// ─── CompitiTab ───────────────────────────────────────────────────────────────

function CompitiTab({ classeId }: { classeId: number }) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [compiti, setCompiti] = useState<CompitoDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classeService.compiti(classeId).then(d => setCompiti(d)).catch(() => {}).finally(() => setLoading(false));
  }, [classeId]);

  if (loading) return <View style={S.centered}><ActivityIndicator color={C.primary} /></View>;
  if (compiti.length === 0) return (
    <View style={S.emptyState}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={C.textMuted} />
      <Text style={S.emptyTitle}>Nessun compito</Text>
      <Text style={S.emptySubtitle}>Il docente non ha ancora assegnato compiti</Text>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={S.listContent}>
      {compiti.map(c => {
        const sc = scadenzaInfo(c.scadenza);
        return (
          <View key={c.id} style={S.compitoCard}>
            <View style={S.compitoTop}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={C.primary} />
              <Text style={S.compitoTitolo} numberOfLines={2}>{c.titolo}</Text>
              <View style={[S.scadenzaBadge, { backgroundColor: sc.color + '20' }]}>
                <Text style={[S.scadenzaText, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>
            {c.descrizione ? <Text style={S.compitoDescrizione}>{c.descrizione}</Text> : null}
            {c.puntiMax ? <Text style={S.compitoPunti}>Punteggio max: {c.puntiMax} pt</Text> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── AnnuncioItem ─────────────────────────────────────────────────────────────

function AnnuncioItem({
  annuncio, classeId, currentUsername,
}: {
  annuncio: AnnuncioDto;
  classeId: number;
  currentUsername: string;
}) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [expanded, setExpanded] = useState(false);
  const [showCommenti, setShowCommenti] = useState(false);
  const [commenti, setCommenti] = useState<CommentoAnnuncioDto[]>([]);
  const [loadingCommenti, setLoadingCommenti] = useState(false);
  const [commentoText, setCommentoText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function toggleCommenti() {
    if (!showCommenti && commenti.length === 0) {
      setLoadingCommenti(true);
      try {
        const data = await classeService.commentiAnnuncio(classeId, annuncio.id);
        setCommenti(data);
      } catch {}
      setLoadingCommenti(false);
    }
    setShowCommenti(v => !v);
  }

  async function handleSend() {
    if (!commentoText.trim() || sending) return;
    setSending(true);
    try {
      const c = await classeService.aggiungiCommento(classeId, annuncio.id, commentoText.trim());
      setCommenti(prev => [...prev, c]);
      setCommentoText('');
    } catch {}
    setSending(false);
  }

  async function handleDeleteCommento(id: number) {
    try {
      await classeService.eliminaCommento(classeId, annuncio.id, id);
      setCommenti(prev => prev.filter(c => c.id !== id));
    } catch {}
  }

  return (
    <View style={S.annuncioCard}>
      <TouchableOpacity style={S.annuncioHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.75}>
        <AvatarCircle name={annuncio.autoreNome} size={38} />
        <View style={S.annuncioInfo}>
          <Text style={S.annuncioTitolo} numberOfLines={expanded ? undefined : 1}>{annuncio.titolo}</Text>
          <Text style={S.annuncioMeta}>{annuncio.autoreNome} · {timeAgo(annuncio.createdAt)}</Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={C.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <Text style={S.annuncioContenuto}>{annuncio.contenuto}</Text>
      )}

      <TouchableOpacity style={S.commentiToggle} onPress={toggleCommenti} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name={showCommenti ? 'comment' : 'comment-outline'}
          size={15}
          color={showCommenti ? C.primary : C.textSoft}
        />
        <Text style={[S.commentiToggleText, showCommenti && { color: C.primary }]}>
          {annuncio.numeroCommenti} commenti
        </Text>
      </TouchableOpacity>

      {showCommenti && (
        <View style={S.commentiSection}>
          {loadingCommenti
            ? <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 8 }} />
            : commenti.length === 0
              ? <Text style={[S.commentoTime, { marginBottom: 8 }]}>Nessun commento ancora.</Text>
              : commenti.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={S.commentoRow}
                  onLongPress={() => {
                    if (c.autoreUsername !== currentUsername) return;
                    Alert.alert('Elimina commento', 'Sei sicuro?', [
                      { text: 'Annulla', style: 'cancel' },
                      { text: 'Elimina', style: 'destructive', onPress: () => handleDeleteCommento(c.id) },
                    ]);
                  }}
                  activeOpacity={0.85}
                >
                  <AvatarCircle name={c.autoreNome} size={30} />
                  <View style={S.commentoInfo}>
                    <Text style={S.commentoAutore}>{c.autoreNome}</Text>
                    <Text style={S.commentoTesto}>{c.testo}</Text>
                    <Text style={S.commentoTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              ))
          }

          <View style={[S.addCommentoRow, { paddingHorizontal: 0, marginBottom: 10 }]}>
            <TextInput
              ref={inputRef}
              style={S.addCommentoInput}
              value={commentoText}
              onChangeText={setCommentoText}
              placeholder="Scrivi un commento…"
              placeholderTextColor={C.textMuted}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={handleSend} disabled={!commentoText.trim() || sending}>
              {sending
                ? <ActivityIndicator size="small" color={C.primary} />
                : <MaterialCommunityIcons name="send" size={22} color={commentoText.trim() ? C.primary : C.textMuted} />
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── AnnunciTab ───────────────────────────────────────────────────────────────

function AnnunciTab({ classeId, currentUsername }: { classeId: number; currentUsername: string }) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [annunci, setAnnunci] = useState<AnnuncioDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classeService.annunci(classeId).then(d => setAnnunci(d)).catch(() => {}).finally(() => setLoading(false));
  }, [classeId]);

  if (loading) return <View style={S.centered}><ActivityIndicator color={C.primary} /></View>;
  if (annunci.length === 0) return (
    <View style={S.emptyState}>
      <MaterialCommunityIcons name="bullhorn-outline" size={48} color={C.textMuted} />
      <Text style={S.emptyTitle}>Nessun annuncio</Text>
      <Text style={S.emptySubtitle}>Il docente non ha ancora pubblicato annunci</Text>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={S.listContent}>
      {annunci.map(a => (
        <AnnuncioItem key={a.id} annuncio={a} classeId={classeId} currentUsername={currentUsername} />
      ))}
    </ScrollView>
  );
}

// ─── JoinModal ────────────────────────────────────────────────────────────────

function JoinModal({
  visible, onClose, onJoined,
}: {
  visible: boolean;
  onClose: () => void;
  onJoined: () => void;
}) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [codice, setCodice] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const code = codice.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    try {
      await classeService.iscrivitiConCodice(code);
      setCodice('');
      onClose();
      onJoined();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data ?? 'Codice non valido o già iscritto.';
      Alert.alert('Errore', String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity activeOpacity={1}>
            <View style={S.modalCard}>
              <Text style={S.modalTitle}>Unisciti a una classe</Text>
              <Text style={S.modalSub}>Inserisci il codice invito fornito dal docente</Text>

              <TextInput
                style={[S.codeInput, focused && S.codeInputFocused]}
                value={codice}
                onChangeText={t => setCodice(t.toUpperCase())}
                placeholder="ES: AB12CD34"
                placeholderTextColor={C.textMuted}
                autoCapitalize="characters"
                maxLength={8}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleJoin}
              />

              <TouchableOpacity
                style={[S.btn, { opacity: !codice.trim() || loading ? 0.5 : 1 }]}
                onPress={handleJoin}
                disabled={!codice.trim() || loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <MaterialCommunityIcons name="login-variant" size={18} color="#fff" />
                }
                <Text style={S.btnText}>Iscriviti</Text>
              </TouchableOpacity>

              <TouchableOpacity style={S.btnOutline} onPress={onClose} activeOpacity={0.8}>
                <Text style={S.btnOutlineText}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── ClasseDetail ─────────────────────────────────────────────────────────────

type DetailTab = 'annunci' | 'materiali' | 'compiti' | 'studenti';

const TABS: { id: DetailTab; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { id: 'annunci',  label: 'Annunci',  icon: 'bullhorn-outline' },
  { id: 'materiali',label: 'Materiali',icon: 'folder-outline' },
  { id: 'compiti',  label: 'Compiti',  icon: 'clipboard-text-outline' },
  { id: 'studenti', label: 'Studenti', icon: 'account-group-outline' },
];

function ClasseDetail({
  classe, currentUsername, onBack,
}: {
  classe: IscrizioneClasseDto;
  currentUsername: string;
  onBack: () => void;
}) {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const [activeTab, setActiveTab] = useState<DetailTab>('annunci');

  return (
    <View style={S.page}>
      <LinearGradient colors={[C.primary, C.primaryDark, '#006064']} style={S.banner}>
        <TouchableOpacity style={S.bannerBack} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={S.bannerContent}>
          <MaterialCommunityIcons name="school" size={30} color="rgba(255,255,255,0.85)" />
          <Text style={S.bannerTitle}>{classe.classeNome}</Text>
          {classe.professoreNome
            ? <Text style={S.bannerSub}>Docente: {classe.professoreNome}</Text>
            : null}
        </View>
      </LinearGradient>

      <View style={S.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[S.tabBtn, activeTab === t.id && S.tabBtnActive]}
            onPress={() => setActiveTab(t.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={t.icon}
              size={20}
              color={activeTab === t.id ? C.primary : C.textSoft}
            />
            <Text style={[S.tabLabel, activeTab === t.id && S.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'annunci'   && <AnnunciTab   classeId={classe.classeId} currentUsername={currentUsername} />}
        {activeTab === 'materiali' && <MaterialiTab  classeId={classe.classeId} />}
        {activeTab === 'compiti'   && <CompitiTab    classeId={classe.classeId} />}
        {activeTab === 'studenti'  && <StudentiTab   classeId={classe.classeId} />}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MyClassScreen() {
  const { colors: C } = useTheme();
  const S = makeStyles(C);
  const { user } = useAuth();
  const currentUsername = user?.username ?? '';

  const [iscrizioni, setIscrizioni] = useState<IscrizioneClasseDto[]>([]);
  const [selected, setSelected]     = useState<IscrizioneClasseDto | null>(null);
  const [joinVisible, setJoinVisible] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');

  async function loadIscrizioni() {
    try {
      const data = await classeService.miIscrizioni();
      setIscrizioni(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError('Impossibile caricare le classi.');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setSelected(null);
      loadIscrizioni();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadIscrizioni();
    setRefreshing(false);
  }

  if (selected) {
    return (
      <>
        <ClasseDetail classe={selected} currentUsername={currentUsername} onBack={() => setSelected(null)} />
        <JoinModal visible={joinVisible} onClose={() => setJoinVisible(false)} onJoined={() => { loadIscrizioni(); }} />
      </>
    );
  }

  if (loading) {
    return <View style={S.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  if (error) {
    return (
      <View style={S.centered}>
        <MaterialCommunityIcons name="cloud-off-outline" size={52} color={C.textMuted} />
        <Text style={S.errorTitle}>Qualcosa è andato storto</Text>
        <Text style={S.errorText}>{error}</Text>
        <TouchableOpacity style={S.btn} onPress={() => { setLoading(true); loadIscrizioni(); }}>
          <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
          <Text style={S.btnText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={iscrizioni}
        keyExtractor={i => String(i.id)}
        style={S.page}
        contentContainerStyle={S.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}
        ListHeaderComponent={
          <TouchableOpacity style={S.joinBanner} onPress={() => setJoinVisible(true)} activeOpacity={0.75}>
            <LinearGradient colors={[C.primary, C.primaryDark]} style={{ width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </LinearGradient>
            <View style={S.joinBannerText}>
              <Text style={S.joinBannerTitle}>Unisciti a una classe</Text>
              <Text style={S.joinBannerSub}>Inserisci il codice invito del docente</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={S.emptyState}>
            <MaterialCommunityIcons name="school-outline" size={56} color={C.textMuted} />
            <Text style={S.emptyTitle}>Nessuna classe</Text>
            <Text style={S.emptySubtitle}>Non sei ancora iscritto a nessuna classe.{'\n'}Usa il codice invito del tuo docente.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={S.classeCard} onPress={() => setSelected(item)} activeOpacity={0.75}>
            <LinearGradient colors={[C.primary, C.primaryDark, '#006064']} style={S.classeIcon}>
              <MaterialCommunityIcons name="school" size={24} color="#fff" />
            </LinearGradient>
            <View style={S.classeInfo}>
              <Text style={S.classeName} numberOfLines={1}>{item.classeNome}</Text>
              {item.professoreNome
                ? <Text style={S.classeProfessore} numberOfLines={1}>Docente: {item.professoreNome}</Text>
                : null}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={C.textMuted} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      <JoinModal
        visible={joinVisible}
        onClose={() => setJoinVisible(false)}
        onJoined={() => { setJoinVisible(false); loadIscrizioni(); }}
      />
    </>
  );
}
