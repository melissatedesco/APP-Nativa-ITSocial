import { api } from './api';
import { MessaggioDto, ConversazioneDto } from '../types';

export const messaggiService = {
  async getConversazioni(): Promise<ConversazioneDto[]> {
    const { data } = await api.get<ConversazioneDto[]>('/messaggi/conversazioni');
    return data;
  },

  async getConversazione(username: string): Promise<ConversazioneDto> {
    const { data } = await api.get<ConversazioneDto>(`/messaggi/conversazioni/${username}`);
    return data;
  },

  async invia(username: string, testo: string, replyToId?: number | null): Promise<MessaggioDto> {
    const { data } = await api.post<MessaggioDto>(`/messaggi/conversazioni/${username}`, {
      testo,
      replyToId: replyToId ?? null,
    });
    return data;
  },

  async segnaComeLetti(username: string): Promise<void> {
    await api.put(`/messaggi/conversazioni/${username}/letti`, {});
  },

  async getNonLettiTotale(): Promise<{ nonLetti: number }> {
    const { data } = await api.get<{ nonLetti: number }>('/messaggi/nonletti');
    return data;
  },

  async eliminaMessaggio(id: number): Promise<void> {
    await api.delete(`/messaggi/${id}`);
  },
};
