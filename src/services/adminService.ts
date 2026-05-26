import { api } from './api';
import {
  User,
  ClasseCorsoDto,
  IstitutoDto,
  PermessoAdminDto,
  RuoloAdminDto,
  ProfessoreDto,
} from '../types';

export const adminService = {
  // ─── Utenti ───────────────────────────────────────────────────────────────
  async getUtenti(): Promise<User[]> {
    const { data } = await api.get<User[]>('/utenti/tutti');
    return data;
  },

  async eliminaUtente(id: number): Promise<void> {
    await api.delete('/utenti', { data: { id } });
  },

  // ─── Ruoli ────────────────────────────────────────────────────────────────
  async getRuoli(): Promise<RuoloAdminDto[]> {
    const { data } = await api.get<RuoloAdminDto[]>('/ruoli/tutti');
    return data;
  },

  async creaRuolo(payload: { nome: string; alias: string }): Promise<RuoloAdminDto> {
    const { data } = await api.post<RuoloAdminDto>('/ruoli', payload);
    return data;
  },

  async eliminaRuolo(id: number): Promise<void> {
    await api.delete('/ruoli', { data: { id } });
  },

  // ─── Permessi ─────────────────────────────────────────────────────────────
  async getPermessi(): Promise<PermessoAdminDto[]> {
    const { data } = await api.get<PermessoAdminDto[]>('/permessi/tutti');
    return data;
  },

  async creaPermesso(payload: { nome: string; alias: string }): Promise<PermessoAdminDto> {
    const { data } = await api.post<PermessoAdminDto>('/permessi', payload);
    return data;
  },

  async eliminaPermesso(id: number): Promise<void> {
    await api.delete('/permessi', { data: { id } });
  },

  // ─── Ruolo-Permesso ───────────────────────────────────────────────────────
  async getPermessiPerRuolo(ruoloId: number): Promise<PermessoAdminDto[]> {
    const { data } = await api.get<PermessoAdminDto[]>(`/ruoli-permessi/ruolo/${ruoloId}`);
    return data;
  },

  async assegnaPermesso(ruoloId: number, permessoId: number): Promise<void> {
    await api.post('/ruoli-permessi', { ruoloId, permesso: { id: permessoId } });
  },

  async rimuoviPermesso(ruoloId: number, permessoId: number): Promise<void> {
    await api.delete('/ruoli-permessi', { data: { ruoloId, permesso: { id: permessoId } } });
  },

  // ─── Classi Corso ─────────────────────────────────────────────────────────
  async getClassi(): Promise<ClasseCorsoDto[]> {
    const { data } = await api.get<ClasseCorsoDto[]>('/classi/admin/tutte');
    return data;
  },

  async modificaClasse(id: number, form: { nome: string; descrizione?: string; tipo: string; istitutoId?: number | null }): Promise<ClasseCorsoDto> {
    const { data } = await api.put<ClasseCorsoDto>(`/classi/${id}`, form);
    return data;
  },

  async eliminaClasse(id: number): Promise<void> {
    await api.delete(`/classi/${id}`);
  },

  // ─── Istituti ─────────────────────────────────────────────────────────────
  async getIstituti(): Promise<IstitutoDto[]> {
    const { data } = await api.get<IstitutoDto[]>('/istituti');
    return data;
  },

  async creaIstituto(form: { nome: string; descrizione?: string; citta?: string }): Promise<IstitutoDto> {
    const { data } = await api.post<IstitutoDto>('/istituti', form);
    return data;
  },

  async modificaIstituto(id: number, form: { nome: string; descrizione?: string; citta?: string }): Promise<IstitutoDto> {
    const { data } = await api.put<IstitutoDto>(`/istituti/${id}`, form);
    return data;
  },

  async eliminaIstituto(id: number): Promise<void> {
    await api.delete(`/istituti/${id}`);
  },

  // ─── Professori ───────────────────────────────────────────────────────────
  async getProfessori(): Promise<ProfessoreDto[]> {
    const { data } = await api.get<ProfessoreDto[]>('/istituto/professori');
    return data;
  },

  async creaProfessore(payload: { nome: string; cognome: string; email: string; username: string; password: string }): Promise<ProfessoreDto> {
    const { data } = await api.post<ProfessoreDto>('/istituto/professori', payload);
    return data;
  },

  async modificaDocente(id: number, payload: { nome: string; cognome: string; email: string; username: string; password?: string }): Promise<ProfessoreDto> {
    const { data } = await api.put<ProfessoreDto>(`/istituto/professori/${id}`, { id, ...payload });
    return data;
  },

  async eliminaDocente(id: number): Promise<void> {
    await api.delete('/utenti', { data: { id } });
  },

  async eliminaProfessore(id: number): Promise<void> {
    await api.delete('/utenti', { data: { id } });
  },
};
