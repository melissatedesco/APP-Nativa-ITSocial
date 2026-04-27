import { api } from './api';
import { User, ProfiloDto } from '../types';

export const userService = {
  async getMyProfile(): Promise<User> {
    const { data } = await api.get<User>('/utenti/my-profile');
    return data;
  },

  async getProfileByUsername(username: string): Promise<ProfiloDto> {
    const { data } = await api.get<ProfiloDto>(`/utenti/profilo/${username}`);
    return data;
  },

  async searchUsers(query: string): Promise<ProfiloDto[]> {
    const { data } = await api.get<ProfiloDto[]>('/utenti/search', { params: { q: query } });
    return data;
  },

  async followUser(username: string): Promise<void> {
    await api.post(`/segui/${username}`);
  },

  async unfollowUser(username: string): Promise<void> {
    await api.delete(`/segui/${username}`);
  },
};
