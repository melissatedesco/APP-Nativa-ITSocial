import { api } from './api';

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
};
