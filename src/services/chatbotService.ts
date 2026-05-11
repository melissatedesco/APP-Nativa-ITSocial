import axios from 'axios';
import { CHAT_BASE_URL } from '../config';

export interface ChatBotRequest {
  user_id: string;
  message: string;
}

export interface ChatBotResponse {
  smartina: string;
}

const chatApi = axios.create({
  baseURL: CHAT_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const chatbotService = {
  async sendMessage(userId: string, message: string): Promise<ChatBotResponse> {
    const { data } = await chatApi.post<ChatBotResponse>('', { user_id: userId, message });
    return data;
  },
};
