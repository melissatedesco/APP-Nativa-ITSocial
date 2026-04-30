import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { MEDIA_BASE_URL } from '../../services/api';
import { Post, MainStackParamList } from '../../types';
import { useFeed, FeedTab } from '../../hooks/useFeed';

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  warm: '#F59E0B',
  warmOn: '#F59E0B',
  warmBg: 'rgba(245,158,11,0.12)',
  danger: '#E53E3E',
  inputBg: '#F8FAFC',
} as const;

const AVATAR_GRADIENT: [string, string] = ['#6BA3E0', '#2B5BA8'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getRuoloTag(ruolo?: string) {
  if (!ruolo) return null;
  const r = ruolo.toUpperCase();
  if (r.includes('ADMIN'))      return { label: 'Admin',      bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
  if (r.includes('PROFESSORE')) return { label: 'Professore', bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
  if (r.includes('STUDENTE'))   return { label: 'Studente',   bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
  return null;
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}g`;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const letter = (name ?? '?')[0].toUpperCase();
  return (
    <LinearGradient
      colors={AVATAR_GRADIENT}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.avatarLetter, { fontSize: size * 0.38 }]}>{letter}</Text>
    </LinearGradient>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────
function PostCard({
  post,
  liked,
  onLike,
  onPressAuthor,
}: {
  post: Post;
  liked: boolean;
  onLike: (id: number) => void;
  onPressAuthor: (username: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ruoloTag = getRuoloTag(post.ruoloUtente);

  function handleLike() {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();
    onLike(post.id);
  }

  const images = post.allegati?.filter(a => a.tipo === 'IMAGE') ?? [];

  return (
    <View style={styles.postCard}>
      {/* Header — cliccabile per navigare al profilo */}
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => onPressAuthor(post.usernameUtente)}
        activeOpacity={0.7}
      >
        <Avatar name={post.nomeUtente} size={44} />
        <View style={styles.postHeaderInfo}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.postAuthorName} numberOfLines={1}>
              {post.nomeUtente ?? 'Utente'}
            </Text>
            {ruoloTag && (
              <View style={[styles.roleTag, { backgroundColor: ruoloTag.bg, borderColor: ruoloTag.border }]}>
                <Text style={[styles.roleTagText, { color: ruoloTag.text }]}>{ruoloTag.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.postMeta}>
            @{post.usernameUtente}{'  ·  '}{timeAgo(post.dataOra)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <Text style={styles.postContent}>{post.contenuto}</Text>

      {/* Images */}
      {images.length > 0 && (
        <View style={styles.imageContainer}>
          {images.map(a => (
            <Image
              key={a.id}
              source={{ uri: MEDIA_BASE_URL + a.url }}
              style={images.length === 1 ? styles.postImageSingle : styles.postImageGrid}
              contentFit="cover"
            />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        {/* Like */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Animated.Text
            style={[
              styles.actionIcon,
              liked ? styles.actionIconLikedStar : styles.actionIconStar,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            ★
          </Animated.Text>
          <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>
            {post.numeroLike ?? 0}
          </Text>
        </TouchableOpacity>

        {/* Commenti */}
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.commenti?.length ?? 0}</Text>
        </TouchableOpacity>

        {/* Condividi */}
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionIcon}>↗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Composer (create post) ───────────────────────────────────────────────────
function Composer({
  username,
  onPublish,
}: {
  username: string;
  onPublish: (text: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (!text.trim()) return;
    setPublishing(true);
    try {
      await onPublish(text.trim());
      setText('');
      setOpen(false);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={styles.composer}>
      <Avatar name={username} size={40} />
      {!open ? (
        <TouchableOpacity style={styles.composerFakeInput} onPress={() => setOpen(true)} activeOpacity={0.7}>
          <Text style={styles.composerPlaceholder}>A cosa stai pensando?</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.composerOpen}>
          <TextInput
            style={styles.composerTextarea}
            placeholder="A cosa stai pensando?"
            placeholderTextColor={C.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            maxLength={500}
          />
          <View style={styles.composerFooter}>
            <Text style={styles.composerCounter}>{text.length}/500</Text>
            <View style={styles.composerActions}>
              <TouchableOpacity
                style={styles.composerCancel}
                onPress={() => { setOpen(false); setText(''); }}
              >
                <Text style={styles.composerCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.composerPublish, (!text.trim() || publishing) && styles.composerPublishDisabled]}
                onPress={handlePublish}
                disabled={!text.trim() || publishing}
              >
                {publishing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.composerPublishText}>Pubblica</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {
    posts,
    likedIds,
    tab,
    isLoading,
    isRefreshing,
    publishError,
    changeTab,
    refresh,
    toggleLike,
    publishPost,
  } = useFeed();

  const ListHeader = (
    <View>
      {/* Tab filter */}
      <View style={styles.tabBar}>
        {(['pertе', 'seguiti'] as FeedTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => changeTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'pertе' ? 'Per te' : 'Seguiti'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Composer */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Composer username={user?.username ?? '?'} onPublish={publishPost} />
      </KeyboardAvoidingView>

      {/* Publish error banner */}
      {publishError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{publishError}</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.feedLoading}>
          <ActivityIndicator color={C.primary} />
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={isLoading ? [] : posts}
      keyExtractor={(item) => String(item.id)}
      style={styles.page}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={C.primary} />
      }
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Nessun post nel feed</Text>
            <Text style={styles.emptySubtitle}>Sii il primo a pubblicare qualcosa!</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          liked={likedIds.has(item.id)}
          onLike={toggleLike}
          onPressAuthor={(username) => navigation.navigate('UserProfile', { username })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 32 },

  // Avatar
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '800', letterSpacing: -0.5 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: C.textSoft },
  tabBtnTextActive: { color: C.primary },

  // Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  composerFakeInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.inputBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
  },
  composerPlaceholder: { fontSize: 14, color: C.textMuted },
  composerOpen: { flex: 1, gap: 10 },
  composerTextarea: {
    fontSize: 14,
    color: C.text,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerCounter: { fontSize: 12, color: C.textMuted },
  composerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  composerCancel: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  composerCancelText: { fontSize: 13, fontWeight: '600', color: C.textSoft },
  composerPublish: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  composerPublishDisabled: { opacity: 0.5 },
  composerPublishText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Feed loading
  feedLoading: { paddingVertical: 24, alignItems: 'center' },

  // Post card
  postCard: {
    marginHorizontal: 12,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    paddingBottom: 0,
  },
  postHeaderInfo: { flex: 1, gap: 2 },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  postAuthorName: { fontSize: 14, fontWeight: '700', color: C.text, flexShrink: 1 },
  postMeta: { fontSize: 12, color: C.textMuted },

  // Role tag
  roleTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  // Post content
  postContent: {
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },

  // Images
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  postImageSingle: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: C.border,
  },
  postImageGrid: {
    width: '48%',
    height: 150,
    borderRadius: 10,
    backgroundColor: C.border,
  },

  // Actions bar
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 10,
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  actionIcon: { fontSize: 16, color: C.textSoft },
  actionIconStar: { color: C.textSoft },
  actionIconLikedStar: {
    color: C.warmOn,
    textShadowColor: 'rgba(245,158,11,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  actionCount: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
  actionCountLiked: { color: C.warm, fontWeight: '700' },

  // Publish error banner
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: { fontSize: 13, color: '#B91C1C', fontWeight: '500' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 13, color: C.textSoft },
});
