import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDatabase } from './useDatabase';
import { useTableManager } from '@/stores/database';
import { useAiChatStore } from '@/stores/ai-chat';
import { useFileAnalysisStore } from '@/stores/file-analysis';
import { saveChatMessage, createChatSession } from '@/actions/client';
import { Timestamp } from 'firebase/firestore';

export function useAIProcessing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('');
  const [localQueryResults, setLocalQueryResults] = useState<Record<string, unknown>[]>([]);

  const { getTableData, executeQuery } = useDatabase();
  const { tables: existingTables, hasTables } = useTableManager();
  const {
    currentSessionId,
    addMessage,
    setError,
    clearChat
  } = useAiChatStore();

  const {
    queries,
    currentQuery: storeCurrentQuery,
    currentQueryResult,
    isProcessing,
    addQuery,
    setCurrentQuery: setStoreCurrentQuery,
    setCurrentQueryResult,
    updateQueryStatus,
    clearCurrentQuery,
    clearCurrentResult,
    setIsProcessing
  } = useFileAnalysisStore();

  useEffect(() => {
    console.log('qr', localQueryResults)
  }, [localQueryResults])

  const generateAndExecuteQuery = useCallback(async (message: string) => {
    if (!message.trim() || !hasTables) return;

    setIsExecutingQuery(true);
    setIsProcessing(true);
    setDbStatus("🤖 Generating SQL query...");

    // Add query to file analysis store
    const queryId = addQuery(message);
    updateQueryStatus(queryId, 'processing');

    // Get or create session
    let sessionId = currentSessionId;
    const userId = 'demo-user';

    if (!sessionId) {
      const sessionResult = await createChatSession(userId, message.slice(0, 50) + (message.length > 50 ? '...' : ''));
      if (sessionResult.success && sessionResult.sessionId) {
        sessionId = sessionResult.sessionId;
        // Update URL with new session ID
        const params = new URLSearchParams(searchParams.toString());
        params.set('sessionId', sessionId);
        router.push(`/chat?${params.toString()}`, { scroll: false });
      } else {
        setDbStatus(`❌ Failed to create chat session: ${sessionResult.error || 'Unknown error'}`);
        setIsExecutingQuery(false);
        setIsProcessing(false);
        updateQueryStatus(queryId, 'error', undefined, sessionResult.error || 'Unknown error');
        return;
      }
    }

    // Set current query in store
    setStoreCurrentQuery(message);

    // Save user message
    await saveChatMessage(userId, sessionId, message, undefined, 'user');

    // Add to local state immediately for better UX
    addMessage({
      id: `user-${Date.now()}`,
      type: 'user',
      message,
      timestamp: Timestamp.now()
    });

    try {
      // Get table schema for AI
      const tableName = existingTables[0]; // Use the first available table
      const tableData = await getTableData(tableName, 1, 0); // Get one row to understand schema

      if (!tableData || tableData.data.length === 0) {
        setDbStatus("❌ No data available in table to analyze");
        updateQueryStatus(queryId, 'error', undefined, "No data available in table to analyze");
        return;
      }

      const schema = {
        tableName,
        columns: Object.keys(tableData.data[0]).map(key => ({
          name: key,
          type: typeof tableData.data[0][key] === 'number' ? 'number' : 'string',
          sampleValue: tableData.data[0][key]
        }))
      };

      // Generate SQL query using AI
      setDbStatus("🧠 Analyzing your request...");
      const aiResponse = await fetch('/api/ai-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          tableSchema: schema
        })
      });

      const aiData = await aiResponse.json();

      if (aiData.success) {
        setDbStatus("⚡ Executing query on database...");
        setStoreCurrentQuery(aiData.sqlQuery || '');

        // Save AI query response (only include query if it exists)
        await saveChatMessage(userId, sessionId, "I've generated a SQL query to help with your request.", aiData.sqlQuery || null, 'ai');

        // Add to local state immediately for better UX
        addMessage({
          id: `ai-${Date.now()}`,
          type: 'ai',
          message: "I've generated a SQL query to help with your request.",
          query: aiData.sqlQuery || null,
          timestamp: Timestamp.now()
        });

        // Execute the generated query using the existing database
        const executeData = await executeQuery(aiData.sqlQuery);
        console.log(executeData)

        if (executeData.success) {
          setLocalQueryResults(prev => [...prev, ...executeData.data]);
          setCurrentQueryResult(executeData.data);
          setDbStatus(`✅ Query executed successfully! Found ${executeData.count} results.`);
          updateQueryStatus(queryId, 'completed', executeData.data);
        } else {
          setDbStatus(`❌ Query execution failed: ${executeData.error}`);
          updateQueryStatus(queryId, 'error', undefined, executeData.error);
        }
      } else {
        setDbStatus(`❌ Failed to generate SQL: ${aiData.error}`);
        updateQueryStatus(queryId, 'error', undefined, aiData.error);
      }
    } catch (error) {
      console.error("Error in query generation/execution:", error);
      setDbStatus(`❌ Error: ${error}`);
      updateQueryStatus(queryId, 'error', undefined, String(error));
    } finally {
      setIsExecutingQuery(false);
      setIsProcessing(false);
    }
  }, [hasTables, currentSessionId, existingTables, getTableData, executeQuery, addMessage, router, searchParams, addQuery, updateQueryStatus, setStoreCurrentQuery, setCurrentQueryResult, setIsProcessing]);

  const startNewChatSession = useCallback(async () => {
    try {
      const userId = 'demo-user'; // Replace with actual user ID from auth
      const result = await createChatSession(userId, 'New Chat Session');

      if (result.success && result.sessionId) {
        // Clear current state
        clearChat();
        clearCurrentQuery();
        clearCurrentResult();
        setDbStatus("");
        setLocalQueryResults([]);

        // Update URL with new session ID
        const params = new URLSearchParams();
        params.set('sessionId', result.sessionId);
        router.push(`/chat?${params.toString()}`, { scroll: false });
      } else {
        setError('Failed to create new chat session');
      }
    } catch (error) {
      setError('Error creating new chat session');
      console.error('Error creating new chat session:', error);
    }
  }, [clearChat, clearCurrentQuery, clearCurrentResult, setError, router]);

  const clearResults = useCallback(() => {
    clearCurrentQuery();
    clearCurrentResult();
    setLocalQueryResults([]);
    setDbStatus("");
  }, [clearCurrentQuery, clearCurrentResult]);

  return {
    isExecutingQuery,
    dbStatus,
    queryResults: localQueryResults,
    currentQuery: storeCurrentQuery,
    generateAndExecuteQuery,
    startNewChatSession,
    clearResults,
    hasTables
  };
}