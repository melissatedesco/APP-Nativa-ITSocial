import { api } from './api';
import { SondaggioDto } from '../types';

export const sondaggioService = {
  async vota(idOpzione: number): Promise<SondaggioDto> {
    const { data } = await api.post<SondaggioDto>(`/sondaggi/vota/${idOpzione}`);
    return data;
  },
};
