export interface PageResponse<T> {
  contenuto: T[];
  numeroPagina: number;
  dimensionePagina: number;
  totaleElementi: number;
  totalePagine: number;
  ultima: boolean;
}

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
export interface AnnuncioAllegatoDto {
  nome: string;
  url: string;
  tipo: string;
}

export interface AnnuncioDto {
  id: number;
  classeId: number;
  autoreUsername: string;
  autoreNome: string;
  titolo: string;
  contenuto: string;
  allegati: AnnuncioAllegatoDto[];
  numeroCommenti: number;
  createdAt: string;
}

export interface CommentoAnnuncioDto {
  id: number;
  annuncioId: number;
  autoreUsername: string;
  autoreNome: string;
  testo: string;
  createdAt: string;
}

export interface MaterialeClasseDto {
  id: number;
  classeId: number;
  caricatoDaUsername: string;
  nome: string;
  url: string;
  tipo: string;
  dataCaricamento: string;
}

export interface CompitoDto {
  id: number;
  classeId: number;
  titolo: string;
  descrizione?: string;
  scadenza?: string;
  puntiMax?: number;
  createdAt: string;
}

export interface ClasseCorsoDto {
  id: number;
  nome: string;
  descrizione?: string;
  codiceInvito?: string;
  tipo?: string;
  professoreUsername?: string;
  professoreNome?: string;
  numeroStudenti: number;
  istitutoId?: number;
  istitutoNome?: string;
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

export interface IstitutoDto {
  id: number;
  nome: string;
  descrizione?: string;
  citta?: string;
  url?: string;
  numeroClassi: number;
  createdAt?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface PermessoAdminDto {
  id: number;
  nome: string;
  alias: string;
  gruppo?: GruppoDto;
}

export interface RuoloPermessoDto {
  id: number;
  permesso?: PermessoAdminDto;
  alias?: string;
}

export interface RuoloAdminDto {
  id: number;
  nome: string;
  alias: string;
  ruoloPermessi?: RuoloPermessoDto[];
}

export interface ProfessoreDto {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  username: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerificaCodice: undefined;
  NuovaPassword: { codice: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Home: undefined;
  Messaggi: undefined;
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
  AdminPanel: undefined;
  UserList: { title: string; username: string; type: 'seguaci' | 'seguiti' };
  PostList: { title: string; username: string; type: 'posts' | 'liked' };
  AdminUtenti: undefined;
  AdminRuoli: undefined;
  AdminPermessi: undefined;
  AdminIstituti: undefined;
  AdminClasseCorso: undefined;
  AdminRuoloDetail: { ruoloId: number; ruoloNome: string };
  AdminDocenti: undefined;
  PostDetail: { postId: number; initialLiked?: boolean; initialSaved?: boolean };
  Settings: undefined;
};
