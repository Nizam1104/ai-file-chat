"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Send, Paperclip, X, Database, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import { useDatabase } from "@/hooks/useDatabase";
import { useTableManager } from "@/stores/database";
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
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const { createExcelTable, deleteDatabase, getTableData, executeQuery, isReady } = useDatabase();
  const { tables: existingTables, getTables, refreshTables, hasTables } = useTableManager();

  const {
    currentSessionId,
    addMessage,
    setError,
    clearChat
  } = useAiChatStore();

  const loadExistingTables = useCallback(async () => {
    try {
      const tables = await getTables();
      if (tables.length > 0) {
        setDbStatus(`📊 Found ${tables.length} existing table(s): ${tables.join(', ')}`);
      }
    } catch (error) {
      console.error('Error loading existing tables:', error);
    }
  }, [getTables]);

  // Check for existing tables when component is ready
  useEffect(() => {
    if (isReady) {
      loadExistingTables();
    }
  }, [isReady, loadExistingTables]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsLoading(true);

      try {
        // Read the Excel file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // Initialize an array to hold combined data from all sheets
        const combinedJsonData: Record<string, unknown>[] = [];

        // Get all sheets data
        const sheetsData: Record<string, Record<string, unknown>[]> = {};
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          sheetsData[sheetName] = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
        });

        if (workbook.SheetNames.length > 0) {
          // Find the sheet with the most rows to use as the base
          const maxRowsSheet = workbook.SheetNames.reduce((maxSheet, currentSheet) =>
            sheetsData[currentSheet].length > sheetsData[maxSheet].length ? currentSheet : maxSheet
          );

          const maxRows = sheetsData[maxRowsSheet].length;

          // Create horizontal merge by combining columns from all sheets
          for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
            const combinedRow: Record<string, unknown> = {};

            // Add columns from each sheet for this row
            workbook.SheetNames.forEach((sheetName) => {
              const sheetData = sheetsData[sheetName];
              const row = sheetData[rowIndex];

              if (row) {
                // Add prefix to column names to avoid conflicts
                Object.keys(row).forEach(colName => {
                  const prefixedColName = sheetName === workbook.SheetNames[0]
                    ? colName // First sheet columns keep original names
                    : `${sheetName}_${colName}`; // Other sheets get prefixed column names
                  combinedRow[prefixedColName] = row[colName];
                });
              } else {
                // If this sheet doesn't have this row, add empty values for its columns
                if (sheetData.length > 0) {
                  Object.keys(sheetData[0]).forEach(colName => {
                    const prefixedColName = sheetName === workbook.SheetNames[0]
                      ? colName
                      : `${sheetName}_${colName}`;
                    combinedRow[prefixedColName] = '';
                  });
                }
              }
            });

            combinedJsonData.push(combinedRow);
          }
        }

        // Create a new workbook with a single worksheet containing the combined data
        const newWorkbook = XLSX.utils.book_new();
        const newWorksheet = XLSX.utils.json_to_sheet(combinedJsonData);
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Combined_Data");

        // Convert the new workbook to a blob and create a new File object
        const newWorkbookBuffer = XLSX.write(newWorkbook, { type: "array", bookType: "xlsx" });
        const newBlob = new Blob([newWorkbookBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const newFileName = `${file.name.replace(/\.[^/.]+$/, "")}_combined.xlsx`;
        const newFile = new File([newBlob], newFileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        // Update the uploaded file to be the new combined file
        setUploadedFile(newFile);

        // Set the combined data and generate a descriptive table name
        setExcelData(combinedJsonData);

        // Generate a more descriptive table name based on the file name
        const baseTableName = newFileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        setTableName(baseTableName || 'combined_data');

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
    if (message.trim() && hasTables) {
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

      // Then create the new database with combined Excel data
      const result = await createExcelTable(tableName || 'combined_data', excelData);

      // Get unique sheets count from the data (if _source_sheet exists)
      const uniqueSheets = new Set(excelData.map(row => row._source_sheet)).size;
      const sheetInfo = uniqueSheets > 1 ? ` from ${uniqueSheets} worksheets` : '';

      setDbStatus(`✅ Database table "${result.tableName}" created with ${excelData.length} combined rows${sheetInfo} and ${result.columns?.length || 0} columns`);

      // Refresh the table list after creation
      await refreshTables();
    } catch (error) {
      console.error("Error creating database:", error);
      setDbStatus(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndExecuteQuery = async () => {
    if (!message.trim() || !hasTables) return;

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
            placeholder={hasTables
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
            disabled={(!message.trim() && !uploadedFile) || (message.trim() && !hasTables) || isExecutingQuery}
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
                {message.trim() && hasTables
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
                  ({excelData.length} combined rows)
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
              {isLoading ? 'Creating Database...' : `Create Combined Database (${excelData.length} rows)`}
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
