import { api } from './api';
import { CommentoDto } from '../types';

export const commentoService = {
  async getCommentiByPost(idPost: number): Promise<CommentoDto[]> {
    const { data } = await api.get<CommentoDto[]>(`/commenti/post/${idPost}`);
    return data;
  },

  async creaCommento(idPost: number, testo: string): Promise<CommentoDto> {
    const { data } = await api.post<CommentoDto>('/commenti', { idPost, testo });
    return data;
  },

  async eliminaCommento(idCommento: number): Promise<void> {
    await api.delete(`/commenti/${idCommento}`);
  },
};
