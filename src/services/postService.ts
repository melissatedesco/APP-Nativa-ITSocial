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

  async createPost(contenuto: string, imageUris?: string[]): Promise<Post> {
    const formData = new FormData();
    formData.append('contenuto', contenuto);
    if (imageUris && imageUris.length > 0) {
      imageUris.forEach((uri) => {
        const filename = uri.split('/').pop() ?? 'photo.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        formData.append('files', { uri, name: filename, type: `image/${ext}` } as any);
      });
    }
    const { data } = await api.post<Post>('/post', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async updatePost(id: number, contenuto: string): Promise<Post> {
    const { data } = await api.put<Post>('/post', { id, contenuto });
    return data;
  },

  async deletePost(id: number): Promise<void> {
    await api.delete(`/post/elimina/${id}`);
  },
};
