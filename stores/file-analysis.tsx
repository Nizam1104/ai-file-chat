import { create } from 'zustand';

interface FileQuery {
  id: string;
  query: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: unknown;
  error?: string;
}

interface FileAnalysisState {
  queries: FileQuery[];
  currentQuery: string;
  currentQueryResult: unknown;
  isProcessing: boolean;
  selectedFileId: string | null;

  // Actions
  addQuery: (query: string) => string;
  setCurrentQuery: (query: string) => void;
  setCurrentQueryResult: (result: unknown) => void;
  clearCurrentQuery: () => void;
  clearCurrentResult: () => void;
  updateQueryStatus: (id: string, status: FileQuery['status'], result?: unknown, error?: string) => void;
  clearQueries: () => void;
  setSelectedFileId: (fileId: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
}

export const useFileAnalysisStore = create<FileAnalysisState>((set) => ({
  queries: [],
  currentQuery: '',
  currentQueryResult: null,
  isProcessing: false,
  selectedFileId: null,

  addQuery: (query: string) => {
    const newQuery: FileQuery = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      status: 'pending',
    };

    set((state) => ({
      queries: [newQuery, ...state.queries],
    }));

    return newQuery.id;
  },

  setCurrentQuery: (query: string) => {
    set({ currentQuery: query });
  },

  setCurrentQueryResult: (result: unknown) => {
    set({ currentQueryResult: result });
  },

  clearCurrentQuery: () => {
    set({ currentQuery: '' });
  },

  clearCurrentResult: () => {
    set({ currentQueryResult: null });
  },

  updateQueryStatus: (id: string, status: FileQuery['status'], result?: unknown, error?: string) => {
    set((state) => ({
      queries: state.queries.map((query) =>
        query.id === id
          ? { ...query, status, result, error }
          : query
      ),
    }));
  },

  clearQueries: () => {
    set({ queries: [] });
  },

  setSelectedFileId: (fileId: string | null) => {
    set({ selectedFileId: fileId });
  },

  setIsProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },
}));
