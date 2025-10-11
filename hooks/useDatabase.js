// hooks/useDatabase.js
import { useEffect, useRef, useState } from 'react';

export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const pendingRequests = useRef(new Map());

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker('/db-worker.js');
    
    // Listen for messages from the worker
    workerRef.current.onmessage = (e) => {
      const { id, success, result, error } = e.data;
      
      // Find the pending request with this ID
      const pendingRequest = pendingRequests.current.get(id);

      if (pendingRequest) {
        // Remove the request from the pending list
        pendingRequests.current.delete(id);
        
        if (success) {
          pendingRequest.resolve(result);
        } else {
          pendingRequest.reject(new Error(error));
        }
      }
    };
    
    // Handle worker errors
    workerRef.current.onerror = (e) => {
      console.error('Worker error:', e);
      setError('Worker error: ' + e.message);
    };
    
    setIsReady(true);
    
    // Clean up the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Function to send a command to the worker
  const sendCommand = (command, data) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }
      
      // Generate a unique ID for this request
      const id = Date.now().toString() + Math.random().toString(36).substring(2);
      
      // Store the resolve and reject functions
      pendingRequests.current.set(id, { resolve, reject });
      
      // Send the command to the worker
      workerRef.current.postMessage({ id, command, data });
      
      // Set a timeout to reject the promise if it takes too long
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Request timed out'));
        }
      }, 10000); // 10 second timeout
    });
  };

  // Database operations
  const createExcelTable = async (tableName, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendCommand('createExcelTable', { tableName, data });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getTableData = async (tableName, limit = 10, offset = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendCommand('getTableData', { tableName, limit, offset });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getTableList = async () => {
    setIsLoading(true);
    setError(null);
    console.log('get tables list called a::')
    try {
      const result = await sendCommand('getTableList');
      return result.tables || [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDatabase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('delete db before calls')
      const result = await sendCommand('deleteDb');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async (sqlQuery) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate that it's a SELECT query
      if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed');
      }

      const result = await sendCommand('executeQuery', { query: sqlQuery });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isReady,
    isLoading,
    error,
    createExcelTable,
    getTableData,
    getTableList,
    deleteDatabase,
    executeQuery
  };
};
