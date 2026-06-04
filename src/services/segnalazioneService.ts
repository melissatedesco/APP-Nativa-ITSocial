import { api } from './api';

export const MOTIVI_SEGNALAZIONE = [
  { valore: 'SPAM',            etichetta: 'Spam' },
  { valore: 'INAPPROPRIATO',   etichetta: 'Contenuto inappropriato' },
  { valore: 'MOLESTIE',        etichetta: "Molestie o incitamento all'odio" },
  { valore: 'DISINFORMAZIONE', etichetta: 'Disinformazione' },
  { valore: 'ALTRO',           etichetta: 'Altro' },
] as const;

export type MotivoSegnalazione = typeof MOTIVI_SEGNALAZIONE[number]['valore'];

export const segnalazioneService = {
  async segnala(idPost: number, motivo: MotivoSegnalazione): Promise<void> {
    await api.post('/segnalazioni', { idPost, motivo });
  },
};
