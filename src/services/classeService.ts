import { api } from './api';
import {
  ClasseCorsoDto,
  IscrizioneClasseDto,
  AnnuncioDto,
  CommentoAnnuncioDto,
  MaterialeClasseDto,
  CompitoDto,
} from '../types';

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

  async annunci(classeId: number): Promise<AnnuncioDto[]> {
    const { data } = await api.get<AnnuncioDto[]>(`/classi/${classeId}/annunci`);
    return data;
  },

  async commentiAnnuncio(classeId: number, annuncioId: number): Promise<CommentoAnnuncioDto[]> {
    const { data } = await api.get<CommentoAnnuncioDto[]>(`/classi/${classeId}/annunci/${annuncioId}/commenti`);
    return data;
  },

  async aggiungiCommento(classeId: number, annuncioId: number, testo: string): Promise<CommentoAnnuncioDto> {
    const { data } = await api.post<CommentoAnnuncioDto>(`/classi/${classeId}/annunci/${annuncioId}/commenti`, { testo });
    return data;
  },

  async eliminaCommento(classeId: number, annuncioId: number, commentoId: number): Promise<void> {
    await api.delete(`/classi/${classeId}/annunci/${annuncioId}/commenti/${commentoId}`);
  },

  async materiali(classeId: number): Promise<MaterialeClasseDto[]> {
    const { data } = await api.get<MaterialeClasseDto[]>(`/classi/${classeId}/materiali`);
    return data;
  },

  async compiti(classeId: number): Promise<CompitoDto[]> {
    const { data } = await api.get<CompitoDto[]>(`/classi/${classeId}/compiti`);
    return data;
  },

  async iscrivitiConCodice(codice: string): Promise<IscrizioneClasseDto> {
    const { data } = await api.post<IscrizioneClasseDto>(`/classi/iscriviti-con-codice/${codice}`);
    return data;
  },
};
