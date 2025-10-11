import { useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { useTableManager, useDatabaseStore } from '@/stores/database';

export const useDatabaseWithStore = () => {
  const { isReady, createExcelTable, getTableData, deleteDatabase, executeQuery, getTableList, isLoading: dbLoading, error: dbError } = useDatabase();
  const {
    tables,
    isLoading: tablesLoading,
    error: tablesError,
    getTables,
    refreshTables,
    setTableListFetcher,
    hasTables
  } = useTableManager();

  // Initialize the table list fetcher when the database is ready
  useEffect(() => {
    if (isReady && getTableList) {
      setTableListFetcher(getTableList);
    }
  }, [isReady, getTableList, setTableListFetcher]);

  // Enhanced table operations that automatically refresh the store
  const createExcelTableWithRefresh = async (tableName: string, data: unknown[]) => {
    try {
      const result = await createExcelTable(tableName, data);
      // Refresh the table list after creating a new table
      await refreshTables();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deleteDatabaseWithRefresh = async () => {
    try {
      const result = await deleteDatabase();
      // Clear tables from store after deletion
      useDatabaseStore.getState().clearTables();
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Initialize tables when database is ready
  useEffect(() => {
    if (isReady && !tablesLoading && tables.length === 0) {
      getTables();
    }
  }, [isReady, tablesLoading, tables.length, getTables]);

  return {
    // Original database functionality
    isReady,
    isLoading: dbLoading,
    error: dbError,
    createExcelTable: createExcelTableWithRefresh,
    getTableData,
    deleteDatabase: deleteDatabaseWithRefresh,
    executeQuery,
    getTableList,

    // Enhanced table management from store
    tables,
    tablesLoading,
    tablesError,
    getTables,
    refreshTables,
    hasTables
  };
};