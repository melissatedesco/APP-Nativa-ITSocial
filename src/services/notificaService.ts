import { api } from './api';
import { NotificaDto } from '../types';

export const notificaService = {
  async getNotifiche(page = 0, size = 20): Promise<NotificaDto[]> {
    const { data } = await api.get<NotificaDto[]>('/notifiche', { params: { page, size } });
    return data;
  },

  async getContatore(): Promise<{ nonLette: number }> {
    const { data } = await api.get<{ nonLette: number }>('/notifiche/contatore');
    return data;
  },

  async segnaComeLetta(id: number): Promise<void> {
    await api.put(`/notifiche/${id}/letta`, {});
  },

  async segnaComeLetteTutte(): Promise<void> {
    await api.put('/notifiche/lette-tutte', {});
  },

  async elimina(id: number): Promise<void> {
    await api.delete(`/notifiche/${id}`);
  },
};
