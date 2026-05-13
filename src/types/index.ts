export interface RuoloDto {
  id: number;
  nome: string;
  alias: string;
}

export interface PermessoDto {
  id: number;
  nome: string;
  alias: string;
}

export interface GruppoDto {
  id: number;
  nome: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nome: string;
  cognome: string;
  dataNascita?: string;
  telefono?: string;
  indirizzo?: string;
  ruolo?: RuoloDto;
  createdAt?: string;
}

export interface ProfiloDto {
  id: number;
  username: string;
  nome: string;
  cognome: string;
  bio?: string;
  fotoProfilo?: string;
  ruolo?: string;
  numPost: number;
  numLike: number;
  numSeguaci: number;
  numSeguiti: number;
  seguito: boolean;
  posts?: Post[];
  memberDal?: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  nome: string;
  cognome: string;
  ruoli: RuoloDto[];
  permessi: PermessoDto[];
  gruppi: GruppoDto[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  nome: string;
  cognome: string;
  email: string;
  username: string;
  password: string;
}

export interface AllegatoDto {
  id: number;
  nomeOriginale: string;
  url: string;
  mimeType: string;
  tipo: string; // "IMAGE" | "DOCUMENT"
}

export interface Post {
  id: number;
  idUtente: number;
  nomeUtente: string;
  usernameUtente: string;
  ruoloUtente?: string;
  contenuto: string;
  dataOra: string;
  numeroLike: number;
  numeroCommenti?: number;
  commenti: CommentoDto[];
  like: unknown[];
  allegati?: AllegatoDto[];
  sondaggio?: SondaggioDto | null;
}

export interface UserProfile {
  id: number;
  username: string;
  nome: string;
  cognome: string;
  bio?: string;
  fotoProfilo?: string;
  ruolo?: string;
  numPost: number;
  numLike: number;
  numSeguaci: number;
  numSeguiti: number;
  seguito: boolean;
  posts?: Post[];
  memberDal?: string;
}

export interface UpdateProfileData {
  nome?: string;
  cognome?: string;
  bio?: string;
  fotoProfilo?: string;
  dataNascita?: string;
  telefono?: string;
  indirizzo?: string;
}

// ─── Polls ────────────────────────────────────────────────────────────────────
export interface OpzioneDto {
  idOpzione: number;
  testo: string;
  numVoti: number;
  percentuale: number;
}

export interface SondaggioDto {
  idSondaggio: number;
  domanda: string;
  scadenza?: string;
  scaduto: boolean;
  totaleVoti: number;
  opzioni: OpzioneDto[];
  idOpzioneVotata?: number | null;
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export interface CommentoDto {
  idCommento: number;
  utente: { id: number; username: string };
  testo: string;
  dataOra: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface NotificaDto {
  id: number;
  tipo: string;
  attoreUsername: string;
  attoreNome?: string;
  messaggio: string;
  letta: boolean;
  createdAt: string;
  idRiferimento: number;
  tipoRiferimento: string;
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export interface MessaggioDto {
  id: number;
  mittente: { id: number; username: string; nome: string; cognome: string };
  testo: string;
  dataOra: string;
  letto: boolean;
  fissato?: boolean;
  importante?: boolean;
  replyTo?: MessaggioDto | null;
}

export interface ConversazioneDto {
  altroUtente: { id: number; username: string; nome: string; cognome: string };
  messaggi?: MessaggioDto[];
  ultimoMessaggio?: MessaggioDto;
  nonLetti: number;
}

// ─── Classes ──────────────────────────────────────────────────────────────────
export interface ClasseCorsoDto {
  id: number;
  nome: string;
  descrizione?: string;
  codiceInvito?: string;
  tipo?: string;
  professoreUsername?: string;
  professoreNome?: string;
  numeroStudenti: number;
  createdAt?: string;
}

export interface IscrizioneClasseDto {
  id: number;
  classeId: number;
  classeNome: string;
  professoreNome?: string;
  studenteUsername?: string;
  studenteNome?: string;
  stato: 'IN_ATTESA' | 'APPROVATA' | 'RIFIUTATA' | string;
  dataRichiesta?: string;
  dataRisposta?: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerificaCodice: undefined;
  NuovaPassword: { codice: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Home: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  UserProfile: { username: string };
  EditProfile: undefined;
  Chat: { username: string };
  SavedPosts: undefined;
  Messages: undefined;
  MyClass: undefined;
  SmartinaChat: undefined;
};
