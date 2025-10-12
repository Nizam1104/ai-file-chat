// hooks/useDatabase.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { SimpleWorkerManager } from '../lib/database/simple-worker-manager.js';

export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const workerRef = useRef(null);
  const initPromiseRef = useRef(null);

  // Initialize worker
  const initWorker = useCallback(async () => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = (async () => {
      try {
        if (workerRef.current) {
          workerRef.current.terminate();
        }

        workerRef.current = new SimpleWorkerManager();
        await workerRef.current.initialize();

        setIsReady(true);
        setError(null);
        initPromiseRef.current = null;
      } catch (err) {
        setError(err.message);
        setIsReady(false);
        initPromiseRef.current = null;
        throw err;
      }
    })();

    return initPromiseRef.current;
  }, []);

  // Initialize on mount
  useEffect(() => {
    initWorker().catch((e) => { console.log('e', e)});

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initWorker]);

  // Generic command executor
  const executeCommand = useCallback(async (command, data = {}, timeout = 30000) => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    try {
      return await workerRef.current.sendCommand(command, data, timeout);
    } catch {
      // Try to reconnect on failure
      try {
        await initWorker();
        return await workerRef.current.sendCommand(command, data, timeout);
      } catch (reconnectErr) {
        setError(reconnectErr.message);
        throw reconnectErr;
      }
    }
  }, [initWorker]);

  // Database operations
  const createExcelTable = useCallback(async (tableName, data) => {
    return executeCommand('createExcelTable', { tableName, data });
  }, [executeCommand]);

  const getTableData = useCallback(async (tableName, limit = 10, offset = 0) => {
    return executeCommand('getTableData', { tableName, limit, offset });
  }, [executeCommand]);

  const getTableList = useCallback(async () => {
    const result = await executeCommand('getTableList');
    return result.tables || [];
  }, [executeCommand]);

  const deleteDatabase = useCallback(async () => {
    const result = await executeCommand('deleteDb');
    // Reset state after deletion
    setIsReady(false);
    initPromiseRef.current = null;
    await initWorker();
    return result;
  }, [executeCommand, initWorker]);

  const executeQuery = useCallback(async (sqlQuery) => {
    if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }
    return executeCommand('executeQuery', { query: sqlQuery });
  }, [executeCommand]);

  const getFirstNRows = useCallback(async (n, tableName) => {
    if (n < 0) return [];
    if (!tableName) throw new Error('Table name is required');
    return executeCommand('getFirstNRows', { n, tableName });
  }, [executeCommand]);

  return {
    isReady,
    error,
    createExcelTable,
    getTableData,
    getTableList,
    deleteDatabase,
    executeQuery,
    getFirstNRows,
    retry: () => {
      setError(null);
      return initWorker();
    }
  };
};
