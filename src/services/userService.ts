import { api } from './api';
import { User, ProfiloDto, UpdateProfileData } from '../types';

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

  async updateProfile(payload: UpdateProfileData): Promise<ProfiloDto> {
    const { data } = await api.put<ProfiloDto>('/utenti/my-profile', payload);
    return data;
  },

  async updateProfilePhoto(photoUri: string): Promise<ProfiloDto> {
    const filename = photoUri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const formData = new FormData();
    formData.append('foto', { uri: photoUri, name: filename, type: `image/${ext}` } as any);
    const { data } = await api.post<ProfiloDto>('/utenti/my-profile/foto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
