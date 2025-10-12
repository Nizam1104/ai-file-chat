"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";
import { useAIProcessing } from "@/hooks/useAIProcessing";
import { useFileAnalysisStore } from "@/stores/file-analysis";
import { useEffect } from "react";

interface AIAnalysisProps {
  className?: string;
}

export default function AIAnalysis({ className }: AIAnalysisProps) {
  const {
    isExecutingQuery,
    dbStatus,
    startNewChatSession,
    clearResults
  } = useAIProcessing();

  const {
    queries,
    currentQuery,
    currentQueryResult,
    isProcessing
  } = useFileAnalysisStore();

  // Use the store's currentQueryResult for displaying results
  const queryResults = currentQueryResult as Record<string, unknown>[] || [];

  useEffect(() => {
    console.log('qr in ai analysis comp', queryResults)
  }, [queryResults])

  return (
    <div className={className}>
      {/* New Chat Session Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">AI Analysis</h3>
        <Button
          onClick={startNewChatSession}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-xs"
        >
          New Chat
        </Button>
      </div>

      {/* Database Status */}
      {dbStatus && (
        <div className={`text-sm p-3 rounded-lg mb-4 ${
          dbStatus.includes('✅')
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {dbStatus}
        </div>
      )}

      {queryResults.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">📊 Query Results ({queryResults.length} rows)</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearResults}
                  className="text-xs"
                  disabled={isExecutingQuery}
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* {currentQuery && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Generated SQL:</p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 font-mono text-sm">
                    {currentQuery}
                  </div>
                </div>
              )} */}
              <div className="overflow-x-auto max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(queryResults[0]).map((column) => (
                        <TableHead key={column}>
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResults.slice(0, 20).map((row, index) => (
                      <TableRow key={index}>
                        {Object.keys(row).map((column) => (
                          <TableCell key={column}>
                            {row[column]?.toString() || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {queryResults.length > 20 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Showing first 20 of {queryResults.length} results
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          {isExecutingQuery || isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground text-lg">Processing your request...</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-lg">Use the chat interface to ask AI questions about your data</p>
          )}
        </div>
      )}
    </div>
  );
}