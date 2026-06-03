import { api } from './api';
import { LikeDto } from '../types';

// Spring Data returns Page<T> — a wrapper object with a `content` array.
interface SpringPage<T> {
  content: T[];
}

export const likeService = {
  async getMyLikes(): Promise<LikeDto[]> {
    const { data } = await api.get<SpringPage<LikeDto>>('/likes/miei');
    return data.content ?? [];
  },

  async likePost(idPost: number): Promise<void> {
    await api.post('/likes', { idPost });
  },

  async unlikePost(idPost: number): Promise<void> {
    await api.delete('/likes', { data: { idPost } });
  },
};
