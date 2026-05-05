import { api } from './api';
import { CommentoDto } from '../types';

export const commentoService = {
  // Comments are embedded in the Post DTO — use post.commenti directly.
  // No GET /commenti/post/{id} endpoint exists on the backend.

  async creaCommento(idPost: number, testo: string): Promise<CommentoDto> {
    const { data } = await api.post<CommentoDto>('/commenti', { idPost, testo });
    return data;
  },

  async eliminaCommento(idCommento: number): Promise<void> {
    await api.delete(`/commenti/${idCommento}`);
  },
};
