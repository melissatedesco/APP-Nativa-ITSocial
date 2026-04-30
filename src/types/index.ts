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

// LoginResponse matches the actual backend response
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
  commenti: unknown[];
  like: unknown[];
  allegati?: AllegatoDto[];
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
  dataNascita?: string;   // formato "YYYY-MM-DD"
  telefono?: string;      // pattern: cifre, +, spazi, trattini, parentesi (7-15 chars)
  indirizzo?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  UserProfile: { username: string };
};
