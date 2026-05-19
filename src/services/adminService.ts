import { api } from './api';

export const adminService = {
  // ─── Utenti ───────────────────────────────────────────────────────────────
  async getUtenti(): Promise<any[]> {
    const { data } = await api.get<any[]>('/utenti/tutti');
    return data;
  },

  async eliminaUtente(id: number): Promise<void> {
    await api.delete('/utenti', { data: { id } });
  },

  // ─── Ruoli ────────────────────────────────────────────────────────────────
  async getRuoli(): Promise<any[]> {
    const { data } = await api.get<any[]>('/ruoli/tutti');
    return data;
  },

  async creaRuolo(payload: { nome: string; alias: string }): Promise<any> {
    const { data } = await api.post('/ruoli', payload);
    return data;
  },

  async eliminaRuolo(id: number): Promise<void> {
    await api.delete('/ruoli', { data: { id } });
  },

  // ─── Permessi ─────────────────────────────────────────────────────────────
  async getPermessi(): Promise<any[]> {
    const { data } = await api.get<any[]>('/permessi/tutti');
    return data;
  },

  async creaPermesso(payload: { nome: string; alias: string }): Promise<any> {
    const { data } = await api.post('/permessi', payload);
    return data;
  },

  async eliminaPermesso(id: number): Promise<void> {
    await api.delete('/permessi', { data: { id } });
  },

  // ─── Ruolo-Permesso ───────────────────────────────────────────────────────
  async getPermessiPerRuolo(ruoloId: number): Promise<any[]> {
    const { data } = await api.get<any[]>(`/ruoli-permessi/ruolo/${ruoloId}`);
    return data;
  },

  async assegnaPermesso(ruoloId: number, permessoId: number): Promise<any> {
    const { data } = await api.post('/ruoli-permessi', { ruoloId, permesso: { id: permessoId } });
    return data;
  },

  async rimuoviPermesso(ruoloId: number, permessoId: number): Promise<any> {
    const { data } = await api.delete('/ruoli-permessi', { data: { ruoloId, permesso: { id: permessoId } } });
    return data;
  },

  // ─── Istituti (Classi) ────────────────────────────────────────────────────
  async getClassi(): Promise<any[]> {
    const { data } = await api.get<any[]>('/classi/admin/tutte');
    return data;
  },

  // ─── Professori ───────────────────────────────────────────────────────────
  async getProfessori(): Promise<any[]> {
    const { data } = await api.get<any[]>('/istituto/professori');
    return data;
  },

  async creaProfessore(payload: { nome: string; cognome: string; email: string; username: string; password: string }): Promise<any> {
    const { data } = await api.post('/istituto/professori', payload);
    return data;
  },

  async modificaDocente(id: number, payload: { nome: string; cognome: string; email: string; username: string; password?: string }): Promise<any> {
    const { data } = await api.put(`/istituto/professori/${id}`, { id, ...payload });
    return data;
  },

  async eliminaDocente(id: number): Promise<void> {
    await api.delete('/utenti', { data: { id } });
  },

  async eliminaProfessore(id: number): Promise<void> {
    await api.delete('/utenti', { data: { id } });
  },
};
