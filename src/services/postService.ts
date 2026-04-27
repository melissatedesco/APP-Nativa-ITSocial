import { api } from './api';
import { Post } from '../types';

export const postService = {
  async getFeed(page = 0, size = 20): Promise<Post[]> {
    const { data } = await api.get<Post[]>('/post', { params: { page, size } });
    return data;
  },

  async getTrending(limit = 10): Promise<Post[]> {
    const { data } = await api.get<Post[]>('/post/tendenze', { params: { limit } });
    return data;
  },

  async getPostById(id: number): Promise<Post> {
    const { data } = await api.get<Post>(`/post/${id}`);
    return data;
  },

  async getPostsByUser(userId: number): Promise<Post[]> {
    const { data } = await api.get<Post[]>(`/post/all/${userId}`);
    return data;
  },

  async getFeedSeguiti(): Promise<Post[]> {
    const { data } = await api.get<Post[]>('/post/seguiti');
    return data;
  },

  async createPost(contenuto: string): Promise<Post> {
    const formData = new FormData();
    formData.append('contenuto', contenuto);
    const { data } = await api.post<Post>('/post', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deletePost(id: number): Promise<void> {
    await api.delete(`/post/elimina/${id}`);
  },
};
