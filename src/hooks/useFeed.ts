import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { Post } from '../types';
import { postService } from '../services/postService';
import { likeService } from '../services/likeService';
import { salvataggioService } from '../services/salvataggioService';

export type FeedTab = 'pertе' | 'seguiti';

function parsePostError(err: unknown): string {
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
  publishError: string | null;
  changeTab: (newTab: FeedTab) => void;
  refresh: () => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function fetchPosts(currentTab: FeedTab): Promise<void> {
    try {
      const data = currentTab === 'seguiti'
        ? await postService.getFeedSeguiti()
        : await postService.getFeed();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
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
      await Promise.all([fetchPosts(tab), fetchLikedIds(), fetchSavedIds()]);
      setIsLoading(false);
    })();
  }, []);

  function changeTab(newTab: FeedTab): void {
    if (newTab === tab) return;
    setTab(newTab);
    setIsLoading(true);
    fetchPosts(newTab).finally(() => setIsLoading(false));
  }

  const refresh = useCallback((): void => {
    setIsRefreshing(true);
    Promise.all([fetchPosts(tab), fetchLikedIds(), fetchSavedIds()]).finally(() =>
      setIsRefreshing(false)
    );
  }, [tab]);

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
    publishError,
    changeTab,
    refresh,
    toggleLike,
    toggleSave,
    deletePost,
    publishPost,
  };
}
