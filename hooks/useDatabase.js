// hooks/useDatabase.js
import { useEffect, useRef, useState, useCallback } from 'react';

export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initStatus, setInitStatus] = useState('idle'); // idle, initializing, ready, error
  const workerRef = useRef(null);
  const pendingRequests = useRef(new Map());
  const initPromiseRef = useRef(null);
  const commandQueue = useRef([]);
  const requestIdRef = useRef(0);

  // Generate unique request ID
  const generateRequestId = useCallback(() => {
    return `${Date.now()}-${++requestIdRef.current}`;
  }, []);

  // Initialize worker with proper error handling
  const initializeWorker = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker('/db-worker.js');

        worker.onmessage = (e) => {
          const { id, success, result, error: workerError } = e.data;

          // Find the pending request with this ID
          const pendingRequest = pendingRequests.current.get(id);

          if (pendingRequest) {
            // Remove the request from the pending list
            pendingRequests.current.delete(id);

            if (success) {
              pendingRequest.resolve(result);
            } else {
              pendingRequest.reject(new Error(workerError || 'Unknown error'));
            }
          }
        };

        worker.onerror = (e) => {
          const errorMsg = `Worker error: ${e.message || 'Unknown worker error'}`;
          setError(errorMsg);
          setInitStatus('error');

          // Reject all pending requests
          pendingRequests.current.forEach(({ reject }) => {
            reject(new Error(errorMsg));
          });
          pendingRequests.current.clear();

          reject(new Error(errorMsg));
        };

        // Handle worker termination (this can happen when switching tabs)
        worker.onmessageerror = (e) => {
          // This might indicate the worker was terminated, trigger reconnection
          setInitStatus('idle');
          setError(null);
        };

        // Store the worker reference
        workerRef.current = worker;
        resolve(worker);
      } catch (err) {
        reject(new Error(`Failed to create worker: ${err.message}`));
      }
    });
  }, []);

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase().catch(() => {});

    // Clean up on unmount - only terminate if there are no more components using this hook
    return () => {
      // Don't immediately terminate the worker on unmount
      // Let it persist for potential re-use
      // Worker will be cleaned up when the page is refreshed or after inactivity
    };
  }, []);

  // Send command to worker with queueing and retry logic
  const sendCommandToWorker = useCallback((command, data = {}, timeout = 30000) => {
    return new Promise(async (resolve, reject) => {
      // Check if worker exists and is healthy, if not, trigger reconnection
      if (!workerRef.current) {
        console.log('Worker not available, triggering reconnection...');
        setInitStatus('idle');
        setError(null);

        // Queue the command and start reconnection
        commandQueue.current.push({ command, data, resolve, reject });
        if (initStatus === 'idle') {
          initializeDatabase().catch(() => {});
        }
        return;
      }

      // Ensure database is initialized
      if (initStatus !== 'ready') {
        // Queue the command if not ready
        commandQueue.current.push({ command, data, resolve, reject });

        // Start initialization if not already in progress
        if (initStatus === 'idle') {
          initializeDatabase().catch(() => {});
        }
        return;
      }

      // Generate unique ID for this request
      const id = generateRequestId();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error(`Request timeout: ${command}`));
        }
      }, timeout);

      // Store the resolve and reject functions
      pendingRequests.current.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      // Send the command to the worker
      try {
        workerRef.current.postMessage({ id, command, data });
      } catch (error) {
        clearTimeout(timeoutId);
        pendingRequests.current.delete(id);

        // Worker might be terminated, trigger reconnection
        console.log('Worker postMessage failed, triggering reconnection...', error);
        setInitStatus('idle');
        setError(null);

        // Queue the command for retry
        commandQueue.current.push({ command, data, resolve, reject });
        initializeDatabase().catch(() => {});
      }
    });
  }, [initStatus, generateRequestId]); // Remove initializeDatabase from dependencies

  // Initialize database connection
  const initializeDatabase = useCallback(async () => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    if (workerRef.current && initStatus === 'ready') {
      return Promise.resolve();
    }

    setInitStatus('initializing');
    setError(null);

    initPromiseRef.current = (async () => {
      try {
        // Clean up existing worker if any
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }

        await initializeWorker();

        // Test worker connection with a simple command using direct worker call
        const testResult = await new Promise((resolve, reject) => {
          const id = generateRequestId();
          const timeoutId = setTimeout(() => {
            pendingRequests.current.delete(id);
            reject(new Error('Connection test timeout'));
          }, 5000);

          pendingRequests.current.set(id, {
            resolve: (result) => {
              clearTimeout(timeoutId);
              resolve(result);
            },
            reject: (error) => {
              clearTimeout(timeoutId);
              reject(error);
            }
          });

          try {
            workerRef.current.postMessage({ id, command: 'getTableList', data: {} });
          } catch (error) {
            clearTimeout(timeoutId);
            pendingRequests.current.delete(id);
            reject(error);
          }
        });

        setInitStatus('ready');
        setIsReady(true);
        initPromiseRef.current = null;

        // Process queued commands
        while (commandQueue.current.length > 0) {
          const { command, data, resolve, reject } = commandQueue.current.shift();
          sendCommandToWorker(command, data).then(resolve).catch(reject);
        }

        return testResult;

      } catch (err) {
        setInitStatus('error');
        setError(err.message);
        setIsReady(false);
        initPromiseRef.current = null;

        // Reject all queued commands
        commandQueue.current.forEach(({ reject }) => {
          reject(err);
        });
        commandQueue.current = [];

        throw err;
      }
    })();

    return initPromiseRef.current;
  }, [initializeWorker, initStatus, generateRequestId, sendCommandToWorker]); // Remove sendCommandToWorker from dependencies

  
  // Enhanced database operations with better error handling
  const createExcelTable = useCallback(async (tableName, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendCommandToWorker('createExcelTable', { tableName, data });
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Failed to create Excel table';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [sendCommandToWorker]);

  const getTableData = useCallback(async (tableName, limit = 10, offset = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendCommandToWorker('getTableData', { tableName, limit, offset });
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Failed to get table data';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [sendCommandToWorker]);

  const getTableList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendCommandToWorker('getTableList');
      return result.tables || [];
    } catch (err) {
      const errorMsg = err.message || 'Failed to get table list';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [sendCommandToWorker]);

  const deleteDatabase = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendCommandToWorker('deleteDb');

      // Reset state after successful deletion
      setInitStatus('idle');
      setIsReady(false);
      initPromiseRef.current = null; // Clear the init promise

      // Re-initialize after deletion - call directly to avoid circular dependency
      try {
        await (async () => {
          if (initPromiseRef.current) {
            return initPromiseRef.current;
          }

          setInitStatus('initializing');
          setError(null);

          initPromiseRef.current = (async () => {
            try {
              // Clean up existing worker if any
              if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
              }

              await initializeWorker();

              // Test worker connection with a simple command using direct worker call
              const testResult = await new Promise((resolve, reject) => {
                const id = generateRequestId();
                const timeoutId = setTimeout(() => {
                  pendingRequests.current.delete(id);
                  reject(new Error('Connection test timeout'));
                }, 5000);

                pendingRequests.current.set(id, {
                  resolve: (result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                  },
                  reject: (error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                  }
                });

                try {
                  workerRef.current.postMessage({ id, command: 'getTableList', data: {} });
                } catch (error) {
                  clearTimeout(timeoutId);
                  pendingRequests.current.delete(id);
                  reject(error);
                }
              });

              setInitStatus('ready');
              setIsReady(true);
              initPromiseRef.current = null;

              // Process queued commands
              while (commandQueue.current.length > 0) {
                const { command, data, resolve, reject } = commandQueue.current.shift();
                sendCommandToWorker(command, data).then(resolve).catch(reject);
              }

              return testResult;

            } catch (err) {
              setInitStatus('error');
              setError(err.message);
              setIsReady(false);
              initPromiseRef.current = null;

              // Reject all queued commands
              commandQueue.current.forEach(({ reject }) => {
                reject(err);
              });
              commandQueue.current = [];

              throw err;
            }
          })();

          return initPromiseRef.current;
        })();
      } catch (reinitError) {
        console.error('Failed to reinitialize database after deletion:', reinitError);
      }

      return result;
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete database';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [sendCommandToWorker, initializeWorker, generateRequestId]);

  const executeQuery = useCallback(async (sqlQuery) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate that it's a SELECT query
      if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed');
      }

      const result = await sendCommandToWorker('executeQuery', { query: sqlQuery });
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Failed to execute query';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [sendCommandToWorker]);

  // Public API
  return {
    // Connection status
    isReady,
    isLoading,
    error,
    initStatus,

    // Database operations
    createExcelTable,
    getTableData,
    getTableList,
    deleteDatabase,
    executeQuery,

    // Additional utility methods
    retry: () => {
      setError(null);
      return initializeDatabase();
    },
    forceReinit: () => {
      setInitStatus('idle');
      setError(null);
      initPromiseRef.current = null;
      return initializeDatabase();
    }
  };
};
