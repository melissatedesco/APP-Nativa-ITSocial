import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { UserProfile, UpdateProfileData } from '../types';
import { userService } from '../services/userService';

// Converts raw Axios/network errors into readable Italian messages for the UI.
function parseProfileError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return new Error('Impossibile raggiungere il server. Controlla la connessione.');
    }
    const status = err.response.status;
    const serverMessage: string | undefined = err.response.data?.message;
    if (status === 403) return new Error('Non hai i permessi per modificare questo profilo.');
    if (status === 404) return new Error('Profilo non trovato.');
    if (status === 409) return new Error(serverMessage ?? 'I dati inseriti sono già in uso.');
    if (status === 413) return new Error("L'immagine selezionata è troppo grande.");
    if (status === 422) return new Error(serverMessage ?? 'Dati non validi. Controlla i campi inseriti.');
    if (serverMessage) return new Error(serverMessage);
    if (status >= 500) return new Error('Errore del server. Riprova più tardi.');
  }
  return new Error('Si è verificato un errore imprevisto.');
}

interface ProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadProfile(userId: string): Promise<void> {
    setIsLoading(true);
    try {
      const fetched = await userService.getProfile(userId);
      setProfile(fetched);
    } catch (err) {
      throw parseProfileError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProfile(data: UpdateProfileData): Promise<void> {
    setIsSaving(true);
    try {
      // Sync: state is replaced only after backend confirms the write.
      const confirmed = await userService.updateProfile(data);
      setProfile(confirmed);
    } catch (err) {
      throw parseProfileError(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, isLoading, isSaving, loadProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within UserProvider');
  return ctx;
}
