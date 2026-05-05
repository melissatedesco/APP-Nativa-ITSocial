import { api } from './api';
import { ClasseCorsoDto, IscrizioneClasseDto } from '../types';

export const classeService = {
  async miIscrizioni(): Promise<IscrizioneClasseDto[]> {
    const { data } = await api.get<IscrizioneClasseDto[]>('/classi/mie-iscrizioni');
    return data;
  },

  async mieClassi(): Promise<ClasseCorsoDto[]> {
    const { data } = await api.get<ClasseCorsoDto[]>('/classi/mie');
    return data;
  },

  async studentiClasse(classeId: number): Promise<IscrizioneClasseDto[]> {
    const { data } = await api.get<IscrizioneClasseDto[]>(`/classi/${classeId}/studenti`);
    return data;
  },

  async dettaglioClasse(classeId: number): Promise<ClasseCorsoDto> {
    const { data } = await api.get<ClasseCorsoDto>(`/classi/${classeId}`);
    return data;
  },
};
