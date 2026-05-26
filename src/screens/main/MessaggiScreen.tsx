import React, { useCallback, useEffect, useRef, useState } from 'react';
import { storage } from '../../utils/storage';
import { API_BASE_URL } from '../../config';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { messaggiService } from '../../services/messaggiService';
import { ConversazioneDto, MessaggioDto } from '../../types';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

// Cache module-level: sopravvive ai remount, consente stale-while-revalidate
const msgCache = new Map<string, { messages: MessaggioDto[]; lastId: number }>();

type ScreenView = 'list' | 'chat';

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'adesso';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}g`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function formatChatTime(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  listContent: { padding: 16, paddingBottom: 32 },

  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  convCardUnread: {
    borderColor: C.primary + '40',
    backgroundColor: C.saveBg,
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convAvatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  convBody: { flex: 1, gap: 2 },
  convNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 15, fontWeight: '600', color: C.text },
  convNameUnread: { fontWeight: '800' },
  convTime: { fontSize: 11, color: C.textMuted },
  convHandle: { fontSize: 12, color: C.textSoft },
  convLastMsg: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  convLastMsgUnread: { color: C.text, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: C.primary,
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft, textAlign: 'center', paddingHorizontal: 32 },

  chatContainer: { flex: 1, backgroundColor: C.bg },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  backBtn: { padding: 4 },
  chatAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  chatName: { fontSize: 15, fontWeight: '700', color: C.text },
  chatHandle: { fontSize: 12, color: C.textSoft },

  msgListContent: { padding: 16, paddingBottom: 8, gap: 6 },
  msgRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 4 },
  msgRowOut: { justifyContent: 'flex-end' },
  msgBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 2,
  },
  msgBubbleIn: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  msgBubbleOut: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  msgSender: { fontSize: 11, fontWeight: '700', color: C.primary, marginBottom: 2 },
  msgText: { fontSize: 14, color: C.text, lineHeight: 20 },
  msgTextOut: { color: '#fff' },
  msgTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  msgTime: { fontSize: 10, color: C.textMuted },
  msgTimeOut: { color: 'rgba(255,255,255,0.7)' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  msgInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: C.bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 14,
    color: C.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.4 },
});

// ─── Conversation List ────────────────────────────────────────────────────────
function ConversationList({
  conversations,
  loading,
  refreshing,
  onRefresh,
  onOpen,
}: {
  conversations: ConversazioneDto[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (conv: ConversazioneDto) => void;
}) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const AVATAR_GRADIENT: [string, string] = [C.primary, C.primaryDark];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.altroUtente.username}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="message-text-outline" size={52} color={C.textMuted} />
          <Text style={styles.emptyTitle}>Nessun messaggio</Text>
          <Text style={styles.emptySubtitle}>Cerca un utente nel feed e inizia una conversazione</Text>
        </View>
      }
      renderItem={({ item }) => {
        const u = item.altroUtente;
        const initials = `${u.nome?.[0] ?? ''}${u.cognome?.[0] ?? ''}`.toUpperCase();
        const lastMsg = item.ultimoMessaggio;
        const hasUnread = item.nonLetti > 0;
        return (
          <TouchableOpacity
            style={[styles.convCard, hasUnread && styles.convCardUnread]}
            onPress={() => onOpen(item)}
            activeOpacity={0.75}
          >
            <LinearGradient colors={AVATAR_GRADIENT} style={styles.convAvatar}>
              <Text style={styles.convAvatarText}>{initials || '?'}</Text>
            </LinearGradient>
            <View style={styles.convBody}>
              <View style={styles.convNameRow}>
                <Text style={[styles.convName, hasUnread && styles.convNameUnread]}>
                  {u.nome} {u.cognome}
                </Text>
                {lastMsg && <Text style={styles.convTime}>{timeAgo(lastMsg.dataOra)}</Text>}
              </View>
              <Text style={styles.convHandle}>@{u.username}</Text>
              {lastMsg && (
                <Text style={[styles.convLastMsg, hasUnread && styles.convLastMsgUnread]} numberOfLines={1}>
                  {lastMsg.testo}
                </Text>
              )}
            </View>
            {hasUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.nonLetti}</Text>
              </View>
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
            )}
          </TouchableOpacity>
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────
function ChatView({
  conversation,
  currentUsername,
  onBack,
}: {
  conversation: ConversazioneDto;
  currentUsername: string;
  onBack: () => void;
}) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const AVATAR_GRADIENT: [string, string] = [C.primary, C.primaryDark];

  const cached = msgCache.get(conversation.altroUtente.username);
  const [messages, setMessages] = useState<MessaggioDto[]>(
    conversation.messaggi ?? cached?.messages ?? []
  );
  const [loading, setLoading] = useState(
    conversation.messaggi === undefined && !cached
  );
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const otherUsername = conversation.altroUtente.username;
  const lastIdRef = useRef<number>(cached?.lastId ?? 0);

  async function loadMessages(after?: number) {
    // Stale-while-revalidate: mostra subito la cache su caricamento iniziale
    if (after === undefined) {
      const hit = msgCache.get(otherUsername);
      if (hit) {
        setMessages(hit.messages);
        lastIdRef.current = hit.lastId;
        setLoading(false);
      }
    }

    try {
      const data = await messaggiService.getConversazione(otherUsername, after);
      const incoming = data.messaggi ?? [];

      if (after != null) {
        // Fetch incrementale: aggiungi solo i messaggi nuovi
        setMessages(prev => {
          const known = new Set(prev.map(m => m.id));
          const toAdd = incoming.filter(m => !known.has(m.id));
          if (toAdd.length === 0) return prev;
          const merged = [...prev, ...toAdd];
          const newLastId = merged[merged.length - 1].id;
          lastIdRef.current = newLastId;
          msgCache.set(otherUsername, { messages: merged, lastId: newLastId });
          return merged;
        });
      } else {
        // Reload completo: sostituisci
        const newLastId = incoming.length > 0
          ? incoming[incoming.length - 1].id
          : lastIdRef.current;
        lastIdRef.current = newLastId;
        msgCache.set(otherUsername, { messages: incoming, lastId: newLastId });
        setMessages(incoming);
      }

      messaggiService.segnaComeLetti(otherUsername).catch(() => {});
    } catch {
      // mantieni i messaggi correnti
    } finally {
      setLoading(false);
    }
  }

  const sseAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (loading) loadMessages();

    let stopped = false;
    let retries = 0;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    async function startSse() {
      if (stopped) return;

      const controller = new AbortController();
      sseAbortRef.current = controller;

      try {
        const token = await storage.getToken();
        if (stopped || !token) throw new Error('no-token');

        const response = await fetch(
          `${API_BASE_URL}/messaggi/stream/${otherUsername}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
              'Cache-Control': 'no-cache',
            },
            signal: controller.signal,
          }
        );

        if (!response.ok || !response.body) throw new Error('sse-unavailable');

        retries = 0;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop() ?? '';

          for (const part of parts) {
            const isMessage = part.split('\n').some(
              l => l.startsWith('event:') && l.slice(6).trim() === 'messaggio'
            );
            // Fetch incrementale: solo i messaggi dopo l'ultimo noto
            if (isMessage) loadMessages(lastIdRef.current);
          }
        }

        if (!stopped) reconnectTimeout = setTimeout(startSse, 1000);
      } catch {
        if (stopped) return;
        retries += 1;
        if (retries <= 3) {
          reconnectTimeout = setTimeout(startSse, 2000 * retries);
        } else {
          fallbackInterval = setInterval(() => loadMessages(lastIdRef.current), 5000);
        }
      }
    }

    startSse();

    return () => {
      stopped = true;
      sseAbortRef.current?.abort();
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!newText.trim() || sending) return;
    const text = newText.trim();
    setSending(true);
    setNewText('');
    try {
      const msg = await messaggiService.invia(otherUsername, text);
      setMessages(prev => {
        const updated = [...prev, msg];
        lastIdRef.current = msg.id;
        msgCache.set(otherUsername, { messages: updated, lastId: msg.id });
        return updated;
      });
    } catch {
      Alert.alert('Errore', 'Impossibile inviare il messaggio.');
      setNewText(text);
    } finally {
      setSending(false);
    }
  }

  const u = conversation.altroUtente;
  const initials = `${u.nome?.[0] ?? ''}${u.cognome?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.primary} />
        </TouchableOpacity>
        <LinearGradient colors={AVATAR_GRADIENT} style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatName}>{u.nome} {u.cognome}</Text>
          <Text style={styles.chatHandle}>@{u.username}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.msgListContent}
          renderItem={({ item }) => {
            const isOut = item.mittente.username === currentUsername;
            return (
              <View style={[styles.msgRow, isOut && styles.msgRowOut]}>
                <View style={[styles.msgBubble, isOut ? styles.msgBubbleOut : styles.msgBubbleIn]}>
                  {!isOut && (
                    <Text style={styles.msgSender}>{item.mittente.nome}</Text>
                  )}
                  <Text style={[styles.msgText, isOut && styles.msgTextOut]}>{item.testo}</Text>
                  <View style={styles.msgTimeRow}>
                    <Text style={[styles.msgTime, isOut && styles.msgTimeOut]}>
                      {formatChatTime(item.dataOra)}
                    </Text>
                    {isOut && (
                      <MaterialCommunityIcons
                        name={item.letto ? 'check-all' : 'check'}
                        size={12}
                        color={item.letto ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.msgInput}
            placeholder="Scrivi un messaggio…"
            placeholderTextColor={C.textMuted}
            value={newText}
            onChangeText={setNewText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!newText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!newText.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="send" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MessaggiScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const routeUsername = (route.params as { username?: string } | undefined)?.username ?? null;

  const [view, setView] = useState<ScreenView>(routeUsername ? 'chat' : 'list');
  const [conversations, setConversations] = useState<ConversazioneDto[]>([]);
  const [activeConv, setActiveConv] = useState<ConversazioneDto | null>(
    routeUsername
      ? { altroUtente: { id: 0, username: routeUsername, nome: routeUsername, cognome: '' }, nonLetti: 0 }
      : null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadConversazioni() {
    try {
      const data = await messaggiService.getConversazioni();
      setConversations(data);
    } catch {
      // stay with current
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (view === 'list') {
        setLoading(true);
        loadConversazioni();
      }
    }, [view])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadConversazioni();
    setRefreshing(false);
  }

  function openConversation(conv: ConversazioneDto) {
    setActiveConv(conv);
    setView('chat');
  }

  function goBack() {
    if (routeUsername) { navigation.goBack(); return; }
    setView('list');
    setActiveConv(null);
    loadConversazioni();
  }

  if (view === 'chat' && activeConv) {
    return (
      <ChatView
        conversation={activeConv}
        currentUsername={user?.username ?? ''}
        onBack={goBack}
      />
    );
  }

  return (
    <View style={styles.page}>
      <ConversationList
        conversations={conversations}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onOpen={openConversation}
      />
    </View>
  );
}
