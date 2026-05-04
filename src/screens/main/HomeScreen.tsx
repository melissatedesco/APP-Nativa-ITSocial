import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { MEDIA_BASE_URL } from '../../services/api';
import { commentoService } from '../../services/commentoService';
import { sondaggioService } from '../../services/sondaggioService';
import { Post, CommentoDto, SondaggioDto, MainStackParamList } from '../../types';
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
  saveBg: 'rgba(74,143,212,0.12)',
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

// ─── CommentsSection ─────────────────────────────────────────────────────────
function CommentsSection({
  postId,
  initialComments,
  currentUsername,
}: {
  postId: number;
  initialComments: CommentoDto[];
  currentUsername: string;
}) {
  const [comments, setComments] = useState<CommentoDto[]>(initialComments);
  const [loading] = useState(false);
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newText.trim() || adding) return;
    setAdding(true);
    try {
      const c = await commentoService.creaCommento(postId, newText.trim());
      setComments(prev => [...prev, c]);
      setNewText('');
    } catch {
      Alert.alert('Errore', 'Impossibile aggiungere il commento.');
    } finally {
      setAdding(false);
    }
  }

  function handleDelete(idCommento: number, authorUsername: string) {
    if (authorUsername !== currentUsername) return;
    Alert.alert('Elimina commento', 'Sei sicuro?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive', onPress: async () => {
          try {
            await commentoService.eliminaCommento(idCommento);
            setComments(prev => prev.filter(c => c.idCommento !== idCommento));
          } catch {
            Alert.alert('Errore', 'Impossibile eliminare il commento.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.commentsSection}>
      {loading && <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 8 }} />}
      {comments.map(c => (
        <TouchableOpacity
          key={c.idCommento}
          style={styles.commentRow}
          onLongPress={() => handleDelete(c.idCommento, c.utente?.username ?? '')}
          activeOpacity={0.85}
        >
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {(c.utente?.username ?? '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentBody}>
            <Text style={styles.commentAuthor}>@{c.utente?.username}</Text>
            <Text style={styles.commentText}>{c.testo}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={styles.addCommentRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Aggiungi un commento…"
          placeholderTextColor={C.textMuted}
          value={newText}
          onChangeText={setNewText}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleAdd}
          editable={!adding}
        />
        <TouchableOpacity
          style={[styles.commentSendBtn, (!newText.trim() || adding) && styles.commentSendBtnDisabled]}
          onPress={handleAdd}
          disabled={!newText.trim() || adding}
        >
          {adding
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.commentSendText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Poll Section ────────────────────────────────────────────────────────────
function PollSection({ initialSondaggio }: { initialSondaggio: SondaggioDto }) {
  const [sondaggio, setSondaggio] = useState<SondaggioDto>(initialSondaggio);
  const [voting, setVoting] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const hasVoted = sondaggio.idOpzioneVotata != null;
  const showResults = hasVoted || sondaggio.scaduto;

  function scadenzaLabel(): string {
    if (sondaggio.scaduto) return 'Scaduto';
    if (!sondaggio.scadenza) return '';
    const diff = new Date(sondaggio.scadenza).getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Scade tra meno di 1h';
    if (h < 24) return `Scade tra ${h}h`;
    return `Scade tra ${Math.floor(h / 24)}g`;
  }

  function buildOptimistic(prev: SondaggioDto, idOpzione: number): SondaggioDto {
    const totale = (prev.totaleVoti ?? 0) + 1;
    const opzioni = prev.opzioni.map(o => {
      const voti = o.idOpzione === idOpzione ? o.numVoti + 1 : o.numVoti;
      return { ...o, numVoti: voti, percentuale: Math.round((voti / totale) * 100) };
    });
    return { ...prev, totaleVoti: totale, idOpzioneVotata: idOpzione, opzioni };
  }

  async function handleVote(idOpzione: number) {
    if (showResults || voting) return;
    setVoteError(null);
    setVoting(true);
    setVotingId(idOpzione);
    // Optimistic update
    setSondaggio(prev => buildOptimistic(prev, idOpzione));

    try {
      const updated = await sondaggioService.vota(idOpzione);
      setSondaggio(updated);
    } catch (err: unknown) {
      // Rollback and show inline error
      setSondaggio(initialSondaggio);
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number } }).response == null
      ) {
        setVoteError('Nessuna connessione. Controlla la rete e riprova.');
      } else {
        setVoteError('Impossibile registrare il voto. Riprova.');
      }
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
          const isThisVoting = votingId === opzione.idOpzione;

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
              style={[styles.pollVoteBtn, voting && !isThisVoting && styles.pollVoteBtnDimmed]}
              onPress={() => handleVote(opzione.idOpzione)}
              disabled={voting}
              activeOpacity={0.7}
            >
              {isThisVoting
                ? <ActivityIndicator size="small" color={C.primary} />
                : <Text style={styles.pollVoteBtnText}>{opzione.testo}</Text>
              }
            </TouchableOpacity>
          );
        })}
      </View>

      {voteError && (
        <Text style={styles.pollVoteError}>{voteError}</Text>
      )}

      <View style={styles.pollMeta}>
        <Text style={styles.pollMetaText}>{sondaggio.totaleVoti} voti</Text>
        {scadenzaLabel() !== '' && (
          <>
            <Text style={styles.pollMetaDot}>·</Text>
            <Text style={[styles.pollMetaText, sondaggio.scaduto && styles.pollMetaScaduto]}>
              {scadenzaLabel()}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────
function PostCard({
  post,
  liked,
  saved,
  onLike,
  onSave,
  onDelete,
  onPressAuthor,
  currentUsername,
}: {
  post: Post;
  liked: boolean;
  saved: boolean;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onDelete: (id: number) => void;
  onPressAuthor: (username: string) => void;
  currentUsername: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ruoloTag = getRuoloTag(post.ruoloUtente);
  const [showComments, setShowComments] = useState(false);
  const isOwn = post.usernameUtente === currentUsername;

  function handleLike() {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();
    onLike(post.id);
  }

  function handleDelete() {
    Alert.alert('Elimina post', 'Sei sicuro di voler eliminare questo post?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => onDelete(post.id) },
    ]);
  }

  const images = post.allegati?.filter(a => a.tipo === 'IMAGE') ?? [];

  return (
    <View style={styles.postCard}>
      {/* Header */}
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
        {isOwn && (
          <TouchableOpacity style={styles.deletePostBtn} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.deletePostIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Content */}
      <Text style={styles.postContent}>{post.contenuto}</Text>

      {/* Images */}
      {images.length > 0 && (
        <View style={styles.imageContainer}>
          {images.map(a => (
            <ExpoImage
              key={a.id}
              source={{ uri: MEDIA_BASE_URL + a.url }}
              style={images.length === 1 ? styles.postImageSingle : styles.postImageGrid}
              contentFit="cover"
            />
          ))}
        </View>
      )}

      {/* Poll */}
      {post.sondaggio && (
        <PollSection initialSondaggio={post.sondaggio} />
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
        <TouchableOpacity
          style={[styles.actionBtn, showComments && styles.actionBtnActive]}
          onPress={() => setShowComments(v => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.numeroCommenti ?? post.commenti?.length ?? 0}</Text>
        </TouchableOpacity>

        {/* Salva */}
        <TouchableOpacity
          style={[styles.actionBtn, saved && styles.actionBtnSaved]}
          onPress={() => onSave(post.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionIcon, saved && styles.actionIconSaved]}>
            {saved ? '🔖' : '🔖'}
          </Text>
          <Text style={[styles.actionCount, saved && styles.actionCountSaved]}>
            {saved ? 'Salvato' : 'Salva'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments section (lazy) */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          initialComments={Array.isArray(post.commenti) ? post.commenti as CommentoDto[] : []}
          currentUsername={currentUsername}
        />
      )}
    </View>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────
function Composer({
  username,
  onPublish,
}: {
  username: string;
  onPublish: (text: string, imageUris?: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso richiesto', 'Abilita l\'accesso alla galleria nelle impostazioni.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, 5));
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handlePublish() {
    if (!text.trim() && images.length === 0) return;
    setPublishing(true);
    try {
      await onPublish(text.trim(), images.length > 0 ? images : undefined);
      setText('');
      setImages([]);
      setOpen(false);
    } finally {
      setPublishing(false);
    }
  }

  const canPublish = (text.trim().length > 0 || images.length > 0) && !publishing;

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

          {/* Image previews */}
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imagePreviewWrap}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(i)}>
                    <Text style={styles.imageRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.composerFooter}>
            <View style={styles.composerLeft}>
              <TouchableOpacity
                style={[styles.attachBtn, images.length >= 5 && styles.attachBtnDisabled]}
                onPress={pickImages}
                disabled={images.length >= 5}
              >
                <Text style={styles.attachBtnText}>📷 {images.length > 0 ? `${images.length}/5` : 'Foto'}</Text>
              </TouchableOpacity>
              <Text style={styles.composerCounter}>{text.length}/500</Text>
            </View>
            <View style={styles.composerActions}>
              <TouchableOpacity
                style={styles.composerCancel}
                onPress={() => { setOpen(false); setText(''); setImages([]); }}
              >
                <Text style={styles.composerCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.composerPublish, !canPublish && styles.composerPublishDisabled]}
                onPress={handlePublish}
                disabled={!canPublish}
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
    savedIds,
    tab,
    isLoading,
    isRefreshing,
    isLoadingMore,
    feedError,
    publishError,
    changeTab,
    refresh,
    loadMore,
    toggleLike,
    toggleSave,
    deletePost,
    publishPost,
  } = useFeed();

  const currentUsername = user?.username ?? '';

  const ListHeader = (
    <View>
      <View style={styles.tabBar}>
        {(['pertе', 'seguiti', 'tendenze'] as FeedTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => changeTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'pertе' ? 'Per te' : t === 'seguiti' ? 'Seguiti' : '🔥 Tendenze'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Composer username={currentUsername} onPublish={publishPost} />
      </KeyboardAvoidingView>

      {publishError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{publishError}</Text>
        </View>
      )}

      {feedError && !isLoading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {feedError}</Text>
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
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        !isLoading ? (
          feedError ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>Nessun post nel feed</Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'seguiti'
                  ? 'Segui altri utenti per vedere i loro post.'
                  : tab === 'tendenze'
                  ? 'Non ci sono post in tendenza al momento.'
                  : 'Sii il primo a pubblicare qualcosa!'}
              </Text>
            </View>
          )
        ) : null
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator color={C.primary} size="small" />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          liked={likedIds.has(item.id)}
          saved={savedIds.has(item.id)}
          onLike={toggleLike}
          onSave={toggleSave}
          onDelete={deletePost}
          onPressAuthor={(username) => navigation.navigate('UserProfile', { username })}
          currentUsername={currentUsername}
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

  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '800', letterSpacing: -0.5 },

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
  imagePreviewRow: { flexDirection: 'row', marginBottom: 4 },
  imagePreviewWrap: { marginRight: 8, position: 'relative' },
  imagePreview: { width: 72, height: 72, borderRadius: 10, backgroundColor: C.border },
  imageRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  attachBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  attachBtnDisabled: { opacity: 0.4 },
  attachBtnText: { fontSize: 12, color: C.textSoft, fontWeight: '600' },
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

  deletePostBtn: {
    padding: 4,
    marginLeft: 4,
  },
  deletePostIcon: { fontSize: 13, color: C.textMuted },

  roleTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  postContent: {
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },

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
  actionBtnActive: {
    backgroundColor: 'rgba(74,143,212,0.08)',
  },
  actionBtnSaved: {
    backgroundColor: C.saveBg,
  },
  actionIcon: { fontSize: 16, color: C.textSoft },
  actionIconStar: { color: C.textSoft },
  actionIconLikedStar: {
    color: C.warmOn,
    textShadowColor: 'rgba(245,158,11,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  actionIconSaved: { color: C.primary },
  actionCount: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
  actionCountLiked: { color: C.warm, fontWeight: '700' },
  actionCountSaved: { color: C.primary, fontWeight: '600' },

  // Comments section
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 11, fontWeight: '700', color: C.text },
  commentText: { fontSize: 13, color: C.textSoft, lineHeight: 18 },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 13,
    color: C.text,
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendBtnDisabled: { opacity: 0.4 },
  commentSendText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Error banner
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

loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Poll
  pollSection: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
  },
  pollQuestion: { fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  pollOptions: { gap: 8 },
  pollVoteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.primary,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  pollVoteBtnDimmed: { opacity: 0.4 },
  pollVoteBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },
  pollVoteError: { fontSize: 12, color: C.danger, fontWeight: '500', marginTop: 2 },
  pollResultRow: { gap: 4 },
  pollBarWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.border,
    height: 34,
    position: 'relative',
    justifyContent: 'center',
  },
  pollBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(74,143,212,0.18)',
    borderRadius: 8,
  },
  pollBarVoted: { backgroundColor: 'rgba(74,143,212,0.32)' },
  pollBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pollOptionText: { fontSize: 13, color: C.textSoft, fontWeight: '500' },
  pollOptionTextVoted: { color: C.primary, fontWeight: '700' },
  pollPct: { fontSize: 12, fontWeight: '700', color: C.textSoft },
  pollMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pollMetaText: { fontSize: 11, color: C.textMuted },
  pollMetaDot: { fontSize: 11, color: C.textMuted },
  pollMetaScaduto: { color: C.danger },

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
