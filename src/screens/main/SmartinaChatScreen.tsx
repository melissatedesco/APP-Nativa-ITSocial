import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { chatbotService } from '../../services/chatbotService';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomUserId() {
  return 'user_' + Math.random().toString(36).slice(2, 11);
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  text: 'Ciao, sono SmarTina. In cosa ti posso essere utile?',
  timestamp: new Date(),
};

// ── Fixed header colors (always dark — identico agli screenshot) ──────────────
const HEADER_BG      = '#0F172A';
const ONLINE_DOT     = '#22C55E';
const VERIFIED_COLOR = '#3B82F6';

// ── Typing dots component ─────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0)), useRef(new Animated.Value(0)), useRef(new Animated.Value(0))];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot.current, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.ease }),
          Animated.timing(dot.current, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.ease }),
          Animated.delay(600 - i * 150),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: color,
            opacity: dot.current,
            transform: [{ translateY: dot.current.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
          }}
        />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },

  // Header (sempre scuro)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HEADER_BG,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: ONLINE_DOT,
    borderWidth: 2,
    borderColor: HEADER_BG,
  },
  headerInfo: { flex: 1 },
  headerName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerNameText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages
  listContent: { padding: 16, paddingBottom: 8 },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },

  msgAvatar: { width: 30, height: 30, borderRadius: 15 },
  avatarSpacer: { width: 30 },

  bubbleWrap: { maxWidth: '78%', gap: 4 },
  bubbleWrapUser: { alignItems: 'flex-end' },

  bubbleAssistant: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: { fontSize: 14, color: C.text, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },

  msgTime: { fontSize: 11, color: C.textMuted, paddingHorizontal: 2 },

  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  typingBubble: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  // Input area
  inputArea: {
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.4 },
  hint: { fontSize: 11, color: C.textMuted, textAlign: 'center' },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SmartinaChatScreen() {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const userIdRef = useRef(randomUserId());
  const flatRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  function scrollToEnd(animated = true) {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated }), 80);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    scrollToEnd();

    try {
      const res = await chatbotService.sendMessage(userIdRef.current, text);
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: res.smartina, timestamp: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Mi dispiace, si è verificato un errore. Riprova.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  const canSend = input.trim().length > 0 && !loading;

  return (
    <View style={[styles.page, { flex: 1 }]}>
      {/* ── Header fisso (sempre dark navy) ─────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerAvatarWrap}>
          <Image
            source={require('../../../assets/smartina.png')}
            style={styles.headerAvatar}
          />
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.headerName}>
            <Text style={styles.headerNameText}>SmarTina</Text>
            <MaterialCommunityIcons name="check-decagram" size={15} color={VERIFIED_COLOR} />
          </View>
          <Text style={styles.headerStatus}>Online · pronta ad aiutarti</Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Messages ────────────────────────────────────────────────── */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => scrollToEnd(false)}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
                {!isUser && (
                  <Image
                    source={require('../../../assets/smartina.png')}
                    style={styles.msgAvatar}
                  />
                )}

                <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
                  <View style={isUser ? styles.bubbleUser : styles.bubbleAssistant}>
                    <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                      {item.text}
                    </Text>
                  </View>
                  <Text style={styles.msgTime}>{fmtTime(item.timestamp)}</Text>
                </View>

                {isUser && <View style={styles.avatarSpacer} />}
              </View>
            );
          }}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingRow}>
                <Image
                  source={require('../../../assets/smartina.png')}
                  style={styles.msgAvatar}
                />
                <View style={styles.typingBubble}>
                  <TypingDots color={C.textMuted} />
                </View>
              </View>
            ) : null
          }
        />

        {/* ── Input area ──────────────────────────────────────────────── */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Chiedi qualcosa a SmarTina..."
              placeholderTextColor={C.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="arrow-up" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            SmarTina può fare errori. Verifica sempre le info importanti.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
