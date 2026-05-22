import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeColors, getRuoloBadge } from '../../context/ThemeContext';
import { MEDIA_BASE_URL } from '../../services/api';
import { postService } from '../../services/postService';
import { commentoService } from '../../services/commentoService';
import { likeService } from '../../services/likeService';
import { salvataggioService } from '../../services/salvataggioService';
import { sondaggioService } from '../../services/sondaggioService';
import { Post, CommentoDto, SondaggioDto, MainStackParamList } from '../../types';
import ImageViewerModal from '../../components/ImageViewerModal';

type NavProp   = NativeStackNavigationProp<MainStackParamList>;
type RoutePropT = RouteProp<MainStackParamList, 'PostDetail'>;

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

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (C: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  // Post
  postCard: {
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    paddingBottom: 0,
  },
  postHeaderInfo: { flex: 1, gap: 2 },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  postAuthorName: { fontSize: 15, fontWeight: '700', color: C.text, flexShrink: 1 },
  postMeta: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  roleTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  roleTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  postContent: {
    fontSize: 15,
    color: C.text,
    lineHeight: 23,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  postImageSingle: { width: '100%', height: 240, borderRadius: 12, backgroundColor: C.border },
  postImageGrid:   { width: '48%', height: 160, borderRadius: 12, backgroundColor: C.border },

  // Actions
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  actionBtnActive: { backgroundColor: 'rgba(74,143,212,0.10)' },
  actionBtnSaved:  { backgroundColor: C.saveBg },
  actionCount:      { fontSize: 14, color: C.textSoft, fontWeight: '500' },
  actionCountLiked: { color: C.warm, fontWeight: '700' },
  actionCountSaved: { color: C.primary, fontWeight: '600' },

  // Comments divider
  commentsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.bg,
    gap: 10,
  },
  commentsDividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  commentsDividerText: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },

  // Comment row
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  commentAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  commentBody: { flex: 1, gap: 2 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: C.text },
  commentTime: { fontSize: 11, color: C.textMuted },
  commentText: { fontSize: 14, color: C.textSoft, lineHeight: 20 },
  commentDeleteBtn: { padding: 4, alignSelf: 'center' },

  // Empty comments
  emptyComments: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
  },
  emptyCommentsEmoji: { fontSize: 32 },
  emptyCommentsText: { fontSize: 14, color: C.textMuted, fontWeight: '500' },

  // Input bar (sticky bottom)
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: C.inputBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 14,
    color: C.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { opacity: 0.4 },

  // Loading / error
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: C.textMuted },
  errorEmoji: { fontSize: 40 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  errorMsg: { fontSize: 13, color: C.textSoft, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Poll
  pollSection: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  pollQuestion: { fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  pollOptions: { gap: 8 },
  pollVoteBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: C.primary, alignItems: 'center', minHeight: 40, justifyContent: 'center' },
  pollVoteBtnDimmed: { opacity: 0.4 },
  pollVoteBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  pollResultRow: { gap: 4 },
  pollBarWrap: { borderRadius: 8, overflow: 'hidden', backgroundColor: C.border, height: 34, position: 'relative', justifyContent: 'center' },
  pollBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(74,143,212,0.18)', borderRadius: 8 },
  pollBarVoted: { backgroundColor: 'rgba(74,143,212,0.35)' },
  pollBarLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  pollOptionText: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
  pollOptionTextVoted: { color: C.primary, fontWeight: '700' },
  pollPct: { fontSize: 12, fontWeight: '700', color: C.textSoft },
  pollMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pollMetaText: { fontSize: 11, color: C.textMuted },
  pollMetaScaduto: { color: C.danger },
});

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const { colors: C } = useTheme();
  const letter = (name ?? '?')[0].toUpperCase();
  return (
    <LinearGradient
      colors={[C.primary, C.primaryDark]}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{letter}</Text>
    </LinearGradient>
  );
}

// ─── PollSection ─────────────────────────────────────────────────────────────

function PollSection({ initialSondaggio }: { initialSondaggio: SondaggioDto }) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const [sondaggio, setSondaggio] = useState(initialSondaggio);
  const [voting, setVoting] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);

  const hasVoted   = sondaggio.idOpzioneVotata != null;
  const showResults = hasVoted || sondaggio.scaduto;

  function scadenzaLabel() {
    if (sondaggio.scaduto) return 'Scaduto';
    if (!sondaggio.scadenza) return '';
    const h = Math.floor((new Date(sondaggio.scadenza).getTime() - Date.now()) / 3600000);
    if (h < 1) return 'Scade tra meno di 1h';
    if (h < 24) return `Scade tra ${h}h`;
    return `Scade tra ${Math.floor(h / 24)}g`;
  }

  async function handleVote(idOpzione: number) {
    if (showResults || voting) return;
    setVoting(true);
    setVotingId(idOpzione);
    const totale = (sondaggio.totaleVoti ?? 0) + 1;
    setSondaggio(prev => ({
      ...prev,
      totaleVoti: totale,
      idOpzioneVotata: idOpzione,
      opzioni: prev.opzioni.map(o => {
        const voti = o.idOpzione === idOpzione ? o.numVoti + 1 : o.numVoti;
        return { ...o, numVoti: voti, percentuale: Math.round((voti / totale) * 100) };
      }),
    }));
    try {
      const updated = await sondaggioService.vota(idOpzione);
      setSondaggio(updated);
    } catch {
      setSondaggio(initialSondaggio);
    } finally {
      setVoting(false);
      setVotingId(null);
    }
  }

  return (
    <View style={styles.pollSection}>
      <Text style={styles.pollQuestion}>{sondaggio.domanda}</Text>
      <View style={styles.pollOptions}>
        {sondaggio.opzioni.map(opzione => {
          const isVoted = sondaggio.idOpzioneVotata === opzione.idOpzione;
          const pct = opzione.percentuale ?? 0;
          if (showResults) {
            return (
              <View key={opzione.idOpzione} style={styles.pollResultRow}>
                <View style={styles.pollBarWrap}>
                  <View style={[styles.pollBar, { width: `${pct}%` as any }, isVoted && styles.pollBarVoted]} />
                  <View style={styles.pollBarLabel}>
                    <Text style={[styles.pollOptionText, isVoted && styles.pollOptionTextVoted]}>
                      {isVoted ? '✓ ' : ''}{opzione.testo}
                    </Text>
                    <Text style={styles.pollPct}>{pct}%</Text>
                  </View>
                </View>
              </View>
            );
          }
          return (
            <TouchableOpacity
              key={opzione.idOpzione}
              style={[styles.pollVoteBtn, voting && votingId !== opzione.idOpzione && styles.pollVoteBtnDimmed]}
              onPress={() => handleVote(opzione.idOpzione)}
              disabled={voting}
              activeOpacity={0.7}
            >
              {voting && votingId === opzione.idOpzione
                ? <ActivityIndicator size="small" color={C.primary} />
                : <Text style={styles.pollVoteBtnText}>{opzione.testo}</Text>
              }
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.pollMeta}>
        <Text style={styles.pollMetaText}>{sondaggio.totaleVoti} voti</Text>
        {scadenzaLabel() !== '' && (
          <>
            <Text style={styles.pollMetaText}>·</Text>
            <Text style={[styles.pollMetaText, sondaggio.scaduto && styles.pollMetaScaduto]}>
              {scadenzaLabel()}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// ─── CommentItem ─────────────────────────────────────────────────────────────

function CommentItem({ comment, currentUsername, onDelete }: {
  comment: CommentoDto;
  currentUsername: string;
  onDelete: (id: number) => void;
}) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const isOwn = comment.utente?.username === currentUsername;

  function handleLongPress() {
    if (!isOwn) return;
    Alert.alert('Elimina commento', 'Sei sicuro di voler eliminare questo commento?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => onDelete(comment.idCommento) },
    ]);
  }

  return (
    <TouchableOpacity
      style={styles.commentRow}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
    >
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {(comment.utente?.username ?? '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentAuthorRow}>
          <Text style={styles.commentAuthor}>@{comment.utente?.username}</Text>
          <Text style={styles.commentTime}>{timeAgo(comment.dataOra)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.testo}</Text>
      </View>
      {isOwn && (
        <TouchableOpacity
          style={styles.commentDeleteBtn}
          onPress={handleLongPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close" size={16} color={C.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── PostDetailScreen ─────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const { user } = useAuth();
  const { colors: C } = useTheme();
  const styles = makeStyles(C);
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropT>();
  const { postId, initialLiked = false, initialSaved = false } = route.params;

  const currentUsername = user?.username ?? '';

  const [post, setPost]         = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentoDto[]>([]);
  const [liked, setLiked]       = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved]       = useState(initialSaved);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex]     = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flatRef   = useRef<FlatList>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, likedList, savedIds] = await Promise.all([
        postService.getPostById(postId),
        likeService.getMyLikes(),
        salvataggioService.getMieiSalvataggi(),
      ]);
      setPost(p);
      setComments(Array.isArray(p.commenti) ? p.commenti : []);
      setLikeCount(p.numeroLike ?? 0);
      setLiked(likedList.some(l => l.idPost === postId));
      setSaved(savedIds.includes(postId));
    } catch {
      setError('Impossibile caricare il post. Controlla la connessione.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  // Like / unlike
  async function handleLike() {
    if (!post) return;
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start();
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(n => wasLiked ? n - 1 : n + 1);
    try {
      if (wasLiked) await likeService.unlikePost(post.id);
      else          await likeService.likePost(post.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount(n => wasLiked ? n + 1 : n - 1);
    }
  }

  // Save / unsave
  async function handleSave() {
    if (!post) return;
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) await salvataggioService.rimuovi(post.id);
      else          await salvataggioService.salva(post.id);
    } catch {
      setSaved(wasSaved);
    }
  }

  // Add comment
  async function handleAddComment() {
    const text = newComment.trim();
    if (!text || addingComment || !post) return;
    setAddingComment(true);
    try {
      const c = await commentoService.creaCommento(post.id, text);
      setComments(prev => [...prev, c]);
      setNewComment('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Errore', 'Impossibile aggiungere il commento.');
    } finally {
      setAddingComment(false);
    }
  }

  // Delete comment
  async function handleDeleteComment(idCommento: number) {
    try {
      await commentoService.eliminaCommento(idCommento);
      setComments(prev => prev.filter(c => c.idCommento !== idCommento));
    } catch {
      Alert.alert('Errore', 'Impossibile eliminare il commento.');
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Caricamento post…</Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Errore</Text>
        <Text style={styles.errorMsg}>{error ?? 'Post non trovato.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images    = post.allegati?.filter(a => a.tipo === 'IMAGE') ?? [];
  const imageUris = images.map(a => MEDIA_BASE_URL + a.url);
  const ruoloTag  = getRuoloBadge(post.ruoloUtente);

  // ── Post header (used as FlatList header) ────────────────────────────────

  const ListHeader = (
    <View>
      {/* Post card */}
      <View style={styles.postCard}>
        {/* Author */}
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => navigation.navigate('UserProfile', { username: post.usernameUtente })}
          activeOpacity={0.75}
        >
          <Avatar name={post.nomeUtente} size={46} />
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
            <Text style={styles.postMeta}>@{post.usernameUtente}{'  ·  '}{timeAgo(post.dataOra)}</Text>
          </View>
        </TouchableOpacity>

        {/* Content */}
        <Text style={styles.postContent}>{post.contenuto}</Text>

        {/* Images */}
        {images.length > 0 && (
          <View style={styles.imageContainer}>
            {images.map((a, i) => (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.92}
                onPress={() => { setViewerIndex(i); setViewerVisible(true); }}
              >
                <ExpoImage
                  source={{ uri: MEDIA_BASE_URL + a.url }}
                  style={images.length === 1 ? styles.postImageSingle : styles.postImageGrid}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ImageViewerModal
          images={imageUris}
          initialIndex={viewerIndex}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />

        {/* Poll */}
        {post.sondaggio && <PollSection initialSondaggio={post.sondaggio} />}

        {/* Actions */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <MaterialCommunityIcons
                name={liked ? 'star' : 'star-outline'}
                size={21}
                color={liked ? C.warm : C.textSoft}
              />
            </Animated.View>
            <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="comment-outline" size={21} color={C.primary} />
            <Text style={[styles.actionCount, { color: C.primary, fontWeight: '600' }]}>
              {comments.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, saved && styles.actionBtnSaved]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={21}
              color={saved ? C.primary : C.textSoft}
            />
            <Text style={[styles.actionCount, saved && styles.actionCountSaved]}>
              {saved ? 'Salvato' : 'Salva'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.commentsDivider}>
        <View style={styles.commentsDividerLine} />
        <Text style={styles.commentsDividerText}>
          {comments.length > 0 ? `${comments.length} commenti` : 'Commenti'}
        </Text>
        <View style={styles.commentsDividerLine} />
      </View>
    </View>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatRef}
        data={comments}
        keyExtractor={item => String(item.idCommento)}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            currentUsername={currentUsername}
            onDelete={handleDeleteComment}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Text style={styles.emptyCommentsEmoji}>💬</Text>
            <Text style={styles.emptyCommentsText}>Nessun commento. Sii il primo!</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
      />

      {/* Sticky comment input */}
      <View style={styles.inputBar}>
        <Avatar name={currentUsername} size={34} />
        <TextInput
          style={styles.input}
          placeholder="Scrivi un commento…"
          placeholderTextColor={C.textMuted}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleAddComment}
          editable={!addingComment}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newComment.trim() || addingComment) && styles.sendBtnDisabled]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || addingComment}
          activeOpacity={0.8}
        >
          {addingComment
            ? <ActivityIndicator size="small" color="#fff" />
            : <MaterialCommunityIcons name="arrow-up" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
