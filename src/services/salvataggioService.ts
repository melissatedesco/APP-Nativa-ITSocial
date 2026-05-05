import { api } from './api';
import { Post } from '../types';

export const salvataggioService = {
  async salva(postId: number): Promise<void> {
    await api.post(`/salvati/${postId}`, {});
  },

  async rimuovi(postId: number): Promise<void> {
    await api.delete(`/salvati/${postId}`);
  },

  async getMieiSalvataggi(): Promise<number[]> {
    const { data } = await api.get<number[]>('/salvati/miei');
    return data;
  },

  async mieiSalvataggiPosts(): Promise<Post[]> {
    const { data } = await api.get<Post[]>('/salvati/miei/posts');
    return data;
  },
};
