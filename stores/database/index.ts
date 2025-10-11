import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DatabaseState {
  // Table list state
  tables: string[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setTables: (tables: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTables: () => void;
  refreshTables: () => Promise<void>;
  setTableListFetcher: (fetcher: () => Promise<string[]>) => void;

  // Cache management
  isCacheValid: (maxAge?: number) => boolean;
  invalidateCache: () => void;
}

interface DatabaseStore extends DatabaseState {
  _tableListFetcher: (() => Promise<string[]>) | null;
}

export const useDatabaseStore = create<DatabaseStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      tables: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      _tableListFetcher: null,

      // Actions
      setTables: (tables) => {
        set({
          tables,
          lastFetched: Date.now(),
          error: null
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      clearTables: () => {
        set({
          tables: [],
          lastFetched: null,
          error: null
        });
      },

      setTableListFetcher: (fetcher) => {
        set({ _tableListFetcher: fetcher });
      },

      refreshTables: async () => {
        const { _tableListFetcher, setTables, setLoading, setError } = get();

        if (!_tableListFetcher) {
          setError('Table list fetcher not initialized');
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const tables = await _tableListFetcher();
          setTables(tables);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch tables');
        } finally {
          setLoading(false);
        }
      },

      isCacheValid: (maxAge = 30000) => { // 30 seconds default cache
        const { lastFetched } = get();
        if (!lastFetched) return false;
        return Date.now() - lastFetched < maxAge;
      },

      invalidateCache: () => {
        set({ lastFetched: null });
      }
    }),
    {
      name: 'database-store'
    }
  )
);

// Selector hooks for better performance
export const useTables = () => useDatabaseStore((state) => state.tables);
export const useTablesLoading = () => useDatabaseStore((state) => state.isLoading);
export const useTablesError = () => useDatabaseStore((state) => state.error);
export const useTablesCount = () => useDatabaseStore((state) => state.tables.length);

// Composed hook for table management
export const useTableManager = () => {
  const tables = useTables();
  const isLoading = useTablesLoading();
  const error = useTablesError();
  const isCacheValid = useDatabaseStore((state) => state.isCacheValid);
  const refreshTables = useDatabaseStore((state) => state.refreshTables);
  const setTableListFetcher = useDatabaseStore((state) => state.setTableListFetcher);

  const getTables = async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid()) {
      return tables;
    }

    await refreshTables();
    return useDatabaseStore.getState().tables;
  };

  return {
    tables,
    isLoading,
    error,
    getTables,
    refreshTables,
    setTableListFetcher,
    hasTables: tables.length > 0
  };
};