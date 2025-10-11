"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Send, Paperclip, X, Database, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import { useDatabase } from "@/hooks/useDatabase";
import { useAiChatStore } from "@/stores/ai-chat";
import { saveChatMessage, createChatSession } from "@/actions/client";
import { Timestamp } from "firebase/firestore";

interface ChatInputProps {
  onQueryResults?: (results: Record<string, unknown>[], query: string) => void;
  queryResults?: Record<string, unknown>[];
  currentQuery?: string;
}

export default function ChatInput({ onQueryResults }: ChatInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([]);
  const [tableName, setTableName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>("");
  const [existingTables, setExistingTables] = useState<string[]>([]);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const { createExcelTable, deleteDatabase, getTableList, getTableData, executeQuery, isReady } = useDatabase();

  const {
    currentSessionId,
    addMessage,
    setLoading,
    setError,
    clearChat
  } = useAiChatStore();

  // Check for existing tables when component is ready
  useEffect(() => {
    if (isReady) {
      loadExistingTables();
    }
  }, [isReady]);

  const loadExistingTables = async () => {
    try {
      const tables = await getTableList();
      setExistingTables(tables);
      if (tables.length > 0) {
        setDbStatus(`📊 Found ${tables.length} existing table(s): ${tables.join(', ')}`);
      }
    } catch (error) {
      console.error('Error loading existing tables:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsLoading(true);

      try {
        // Read the Excel file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        setExcelData(jsonData);
        setTableName(sheetName);

        console.log("Excel data loaded:", jsonData.length, "rows");
      } catch (error) {
        console.error("Error reading Excel file:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExcelData([]);
    setTableName("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim() && existingTables.length > 0) {
      // If there's a message and existing tables, generate and execute AI query
      await generateAndExecuteQuery();
    } else if (uploadedFile) {
      // If there's a file but no message, just clear the file
      setUploadedFile(null);
    }
    setMessage("");
  };

  const createDatabaseFromExcel = async () => {
    if (excelData.length === 0) return;

    setIsLoading(true);
    setDbStatus("🗑️ Clearing previous database...");

    try {
      // First, clear any existing database
      await deleteDatabase();
      setDbStatus("📊 Creating new database from Excel file...");
      console.log(tableName, 'table name ::')
      // Then create the new database with Excel data
      const result = await createExcelTable(tableName || 'excel_data', excelData);
      setDbStatus(`✅ Database table "${result.tableName}" created with ${excelData.length} rows and ${result.columns?.length || 0} columns`);
      console.log("Database table created:", result);

      // Refresh the table list after creation
      await loadExistingTables();
    } catch (error) {
      console.error("Error creating database:", error);
      setDbStatus(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndExecuteQuery = async () => {
    if (!message.trim() || existingTables.length === 0) return;

    setIsExecutingQuery(true);
    setDbStatus("🤖 Generating SQL query...");

    // Get or create session
    let sessionId = currentSessionId;
    const userId = 'demo-user'; // Replace with actual user ID from auth

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
        return;
      }
    }

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

        // Save AI query response
        await saveChatMessage(userId, sessionId, "I've generated a SQL query to help with your request.", aiData.sqlQuery, 'ai');

        // Add to local state immediately for better UX
        addMessage({
          id: `ai-${Date.now()}`,
          type: 'ai',
          message: "I've generated a SQL query to help with your request.",
          query: aiData.sqlQuery,
          timestamp: Timestamp.now()
        });

        // Execute the generated query using the existing database
        const executeData = await executeQuery(aiData.sqlQuery);

        if (executeData.success) {
          if (onQueryResults) {
            onQueryResults(executeData.data, aiData.sqlQuery);
          }
          setDbStatus(`✅ Query executed successfully! Found ${executeData.count} results.`);
        } else {
          setDbStatus(`❌ Query execution failed: ${executeData.error}`);
        }
      } else {
        setDbStatus(`❌ Failed to generate SQL: ${aiData.error}`);
      }
    } catch (error) {
      console.error("Error in query generation/execution:", error);
      setDbStatus(`❌ Error: ${error}`);
    } finally {
      setIsExecutingQuery(false);
    }
  };

  
  const startNewChatSession = async () => {
    try {
      const userId = 'demo-user'; // Replace with actual user ID from auth
      const result = await createChatSession(userId, 'New Chat Session');

      if (result.success && result.sessionId) {
        // Clear current state
        clearChat();
        setDbStatus("");

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
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* New Chat Session Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">AI Chat Assistant</h3>
        <Button
          onClick={startNewChatSession}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-xs"
        >
          <Plus className="w-3 h-3" />
          New Chat
        </Button>
      </div>

      {/* Message Input Area */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={existingTables.length > 0
              ? "Ask questions about your data (e.g., 'Show me all records where amount > 1000')..."
              : "Upload an Excel file first to start asking questions..."}
            className="min-h-[100px] w-full resize-none rounded-lg border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
            rows={3}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400">
            {message.length}/500
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={(!message.trim() && !uploadedFile) || (message.trim() && existingTables.length === 0) || isExecutingQuery}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            {isExecutingQuery ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {message.trim() && existingTables.length > 0
                  ? "Ask AI"
                  : message.trim()
                  ? "Upload Database First"
                  : "Send Message"
                }
              </>
            )}
          </Button>

          {/* File Upload Button */}
          <div className="relative">
            <Input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center justify-center px-2 py-2 rounded-lg border cursor-pointer transition-colors ${
                uploadedFile
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-700/50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : uploadedFile ? (
                <Paperclip className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </label>
          </div>
        </div>
      </form>

      {/* File Info & Actions */}
      {uploadedFile && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Paperclip className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300 truncate max-w-xs">
                {uploadedFile.name}
              </span>
              {excelData.length > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  ({excelData.length} rows)
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {excelData.length > 0 && (
            <Button
              onClick={createDatabaseFromExcel}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white disabled:opacity-50"
              size="sm"
            >
              <Database className="w-4 h-4 mr-2" />
              {isLoading ? 'Creating Database...' : `Create Database (${excelData.length} rows)`}
            </Button>
          )}

          {/* Database Status */}
          {dbStatus && (
            <div className={`text-sm p-3 rounded-lg ${
              dbStatus.includes('✅')
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {dbStatus}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Supports Excel (.xlsx, .xls) and CSV files
      </div>
    </div>
  );
}
