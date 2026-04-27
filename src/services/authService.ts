import { api } from './api';
import { LoginResponse, LoginCredentials, RegisterData } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async register(registerData: RegisterData): Promise<void> {
    await api.post('/auth/registrazione', registerData);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
