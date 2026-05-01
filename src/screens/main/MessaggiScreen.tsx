import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { messaggiService } from '../../services/messaggiService';
import { ConversazioneDto, MessaggioDto } from '../../types';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  primary: '#4A8FD4',
  primaryDark: '#2D6BB5',
  brand700: '#2B5BA8',
  danger: '#E53E3E',
  msgOut: '#4A8FD4',
  msgIn: '#F1F5F9',
} as const;

const AVATAR_GRADIENT: [string, string] = ['#6BA3E0', '#2B5BA8'];

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
          <Text style={styles.emptyEmoji}>✉️</Text>
          <Text style={styles.emptyTitle}>Nessun messaggio</Text>
          <Text style={styles.emptySubtitle}>Cerca un utente nel feed e inizia una conversazione</Text>
        </View>
      }
      renderItem={({ item }) => {
        const u = item.altroUtente;
        const initials = `${u.nome?.[0] ?? ''}${u.cognome?.[0] ?? ''}`.toUpperCase();
        const lastMsg = item.ultimoMessaggio;
        return (
          <TouchableOpacity
            style={styles.convCard}
            onPress={() => onOpen(item)}
            activeOpacity={0.75}
          >
            <LinearGradient colors={AVATAR_GRADIENT} style={styles.convAvatar}>
              <Text style={styles.convAvatarText}>{initials || '?'}</Text>
            </LinearGradient>
            <View style={styles.convBody}>
              <View style={styles.convNameRow}>
                <Text style={styles.convName}>{u.nome} {u.cognome}</Text>
                {lastMsg && <Text style={styles.convTime}>{timeAgo(lastMsg.dataOra)}</Text>}
              </View>
              <Text style={styles.convHandle}>@{u.username}</Text>
              {lastMsg && (
                <Text style={styles.convLastMsg} numberOfLines={1}>
                  {lastMsg.testo}
                </Text>
              )}
            </View>
            {item.nonLetti > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.nonLetti}</Text>
              </View>
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
  const [messages, setMessages] = useState<MessaggioDto[]>(conversation.messaggi ?? []);
  const [loading, setLoading] = useState(conversation.messaggi === undefined);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const otherUsername = conversation.altroUtente.username;

  async function loadMessages() {
    try {
      const data = await messaggiService.getConversazione(otherUsername);
      setMessages(data.messaggi ?? []);
      messaggiService.segnaComeLetti(otherUsername).catch(() => {});
    } catch {
      // stay with current messages
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading) loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
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
      setMessages(prev => [...prev, msg]);
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
      {/* Chat header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <LinearGradient colors={AVATAR_GRADIENT} style={styles.chatAvatar}>
          <Text style={styles.chatAvatarText}>{initials}</Text>
        </LinearGradient>
        <View>
          <Text style={styles.chatName}>{u.nome} {u.cognome}</Text>
          <Text style={styles.chatHandle}>@{u.username}</Text>
        </View>
      </View>

      {/* Messages */}
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
                  <Text style={[styles.msgTime, isOut && styles.msgTimeOut]}>
                    {formatChatTime(item.dataOra)}
                    {isOut && (item.letto ? '  ✓✓' : '  ✓')}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              : <Text style={styles.sendBtnText}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MessaggiScreen() {
  const { user } = useAuth();
  const [view, setView] = useState<ScreenView>('list');
  const [conversations, setConversations] = useState<ConversazioneDto[]>([]);
  const [activeConv, setActiveConv] = useState<ConversazioneDto | null>(null);
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { padding: 16, paddingBottom: 32 },

  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
  convName: { fontSize: 15, fontWeight: '700', color: C.text },
  convTime: { fontSize: 11, color: C.textMuted },
  convHandle: { fontSize: 12, color: C.textSoft },
  convLastMsg: { fontSize: 13, color: C.textMuted, marginTop: 2 },
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

  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft, textAlign: 'center' },

  // Chat
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
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 28, color: C.primary, fontWeight: '300', lineHeight: 32 },
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
    backgroundColor: C.msgOut,
    borderBottomRightRadius: 4,
  },
  msgSender: { fontSize: 11, fontWeight: '700', color: C.primary, marginBottom: 2 },
  msgText: { fontSize: 14, color: C.text, lineHeight: 20 },
  msgTextOut: { color: '#fff' },
  msgTime: { fontSize: 10, color: C.textMuted, alignSelf: 'flex-end' },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
