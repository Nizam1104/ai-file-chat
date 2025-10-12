import { create } from 'zustand';
import { ChatMessage, ChatSession } from '@/actions/client';

interface AiChatState {
  // Current session state
  currentSessionId: string | null;
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentSessionId: (sessionId: string | null) => void;
  setCurrentSession: (session: ChatSession | null) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  // Initial state
  currentSessionId: null,
  currentSession: null,
  messages: [],
  isLoading: false,
  error: null,

  // Actions
  setCurrentSessionId: (sessionId) => {
    set({ currentSessionId: sessionId });
  },

  setCurrentSession: (session) => {
    set({
      currentSession: session,
      messages: session?.messages || [],
      error: null
    });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  clearChat: () => {
    set({
      currentSessionId: null,
      currentSession: null,
      messages: [],
      error: null
    });
  }
}));