import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { Post } from '../types';
import { postService } from '../services/postService';
import { likeService } from '../services/likeService';
import { salvataggioService } from '../services/salvataggioService';
import { withRetry } from '../utils/withRetry';

export type FeedTab = 'pertе' | 'seguiti' | 'tendenze';

const PAGE_SIZE = 20;

// Cache module-level: sopravvive ai remount, usata come fallback offline
const feedCache = new Map<FeedTab, Post[]>();

export function parsePostError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Impossibile raggiungere il server. Controlla la connessione.';
    const status = err.response.status;
    const msg: string | undefined = err.response.data?.message;
    if (status === 403) return 'Non hai i permessi per questa operazione.';
    if (status === 413) return 'Il file è troppo grande (massimo 10 MB).';
    if (msg) return msg;
    if (status >= 500) return 'Errore del server. Riprova più tardi.';
  }
  return 'Si è verificato un errore imprevisto.';
}

export interface UseFeedReturn {
  posts: Post[];
  likedIds: Set<number>;
  savedIds: Set<number>;
  tab: FeedTab;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  feedError: string | null;
  publishError: string | null;
  changeTab: (newTab: FeedTab) => void;
  refresh: () => void;
  loadMore: () => void;
  toggleLike: (postId: number) => void;
  toggleSave: (postId: number) => void;
  deletePost: (postId: number) => Promise<void>;
  publishPost: (text: string, imageUris?: string[]) => Promise<void>;
}

export function useFeed(): UseFeedReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<FeedTab>('pertе');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function fetchPosts(currentTab: FeedTab, pg: number, append: boolean): Promise<void> {
    setFeedError(null);

    // Stale-while-revalidate: mostra la cache subito su caricamento iniziale
    if (!append && pg === 0) {
      const cached = feedCache.get(currentTab);
      if (cached) {
        setPosts(cached);
        setHasMore(false);
      }
    }

    try {
      const fetchFn = () => {
        if (currentTab === 'seguiti') return postService.getFeedSeguiti(pg, PAGE_SIZE);
        if (currentTab === 'tendenze') return postService.getTrending(pg, PAGE_SIZE);
        return postService.getFeed(pg, PAGE_SIZE);
      };
      const response = await withRetry(fetchFn);
      const arr = Array.isArray(response.contenuto) ? response.contenuto : [];
      if (append) {
        setPosts(prev => {
          const merged = [...prev, ...arr.filter(p => !new Set(prev.map(q => q.id)).has(p.id))];
          feedCache.set(currentTab, merged);
          return merged;
        });
      } else {
        feedCache.set(currentTab, arr);
        setPosts(arr);
      }
      setHasMore(!response.ultima);
    } catch (err) {
      if (!append) {
        const cached = feedCache.get(currentTab);
        if (cached) {
          // Rete assente: mostra la cache senza sovrascrivere, blocca il caricamento
          setPosts(cached);
          setHasMore(false);
        } else {
          setPosts([]);
        }
      }
      setFeedError(parsePostError(err));
    }
  }

  async function fetchLikedIds(): Promise<void> {
    try {
      const likes = await likeService.getMyLikes();
      setLikedIds(new Set(likes.map(l => l.idPost)));
    } catch {
      // non-blocking
    }
  }

  async function fetchSavedIds(): Promise<void> {
    try {
      const ids = await salvataggioService.getMieiSalvataggi();
      setSavedIds(new Set(ids));
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([fetchPosts(tab, 0, false), fetchLikedIds(), fetchSavedIds()]);
      setIsLoading(false);
    })();
  }, []);

  function changeTab(newTab: FeedTab): void {
    if (newTab === tab) return;
    setTab(newTab);
    setPage(0);
    setHasMore(true);
    setIsLoading(true);
    fetchPosts(newTab, 0, false).finally(() => setIsLoading(false));
  }

  const refresh = useCallback((): void => {
    setPage(0);
    setHasMore(true);
    setIsRefreshing(true);
    Promise.all([fetchPosts(tab, 0, false), fetchLikedIds(), fetchSavedIds()]).finally(() =>
      setIsRefreshing(false)
    );
  }, [tab]);

  function loadMore(): void {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setIsLoadingMore(true);
    fetchPosts(tab, nextPage, true).finally(() => setIsLoadingMore(false));
  }

  function toggleLike(postId: number): void {
    const wasLiked = likedIds.has(postId);
    setLikedIds(prev => {
      const next = new Set(prev);
      wasLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, numeroLike: (p.numeroLike ?? 0) + (wasLiked ? -1 : 1) }
          : p
      )
    );
    const call = wasLiked
      ? likeService.unlikePost(postId)
      : likeService.likePost(postId);
    call.catch(() => {
      setLikedIds(prev => {
        const next = new Set(prev);
        wasLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, numeroLike: (p.numeroLike ?? 0) + (wasLiked ? 1 : -1) }
            : p
        )
      );
    });
  }

  function toggleSave(postId: number): void {
    const wasSaved = savedIds.has(postId);
    setSavedIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(postId) : next.add(postId);
      return next;
    });
    const call = wasSaved
      ? salvataggioService.rimuovi(postId)
      : salvataggioService.salva(postId);
    call.catch(() => {
      setSavedIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(postId) : next.delete(postId);
        return next;
      });
    });
  }

  async function deletePost(postId: number): Promise<void> {
    try {
      await postService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      Alert.alert('Errore', 'Impossibile eliminare il post. Riprova.');
    }
  }

  async function publishPost(text: string, imageUris?: string[]): Promise<void> {
    setPublishError(null);
    try {
      const newPost = await postService.createPost(text, imageUris);
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      const message = parsePostError(err);
      setPublishError(message);
      throw new Error(message);
    }
  }

  return {
    posts,
    likedIds,
    savedIds,
    tab,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    feedError,
    publishError,
    changeTab,
    refresh,
    loadMore,
    toggleLike,
    toggleSave,
    deletePost,
    publishPost,
  };
}
