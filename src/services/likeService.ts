import { api } from './api';

interface LikeDto {
  id: number;
  idPost: number;
}

export const likeService = {
  async getMyLikes(): Promise<LikeDto[]> {
    const { data } = await api.get<LikeDto[]>('/likes/miei');
    return data;
  },

  async likePost(idPost: number): Promise<void> {
    await api.post('/likes', { idPost });
  },

  async unlikePost(idPost: number): Promise<void> {
    await api.delete('/likes', { data: { idPost } });
  },
};
