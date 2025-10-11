"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AIAnalysisProps {
  queryResults: Record<string, unknown>[];
  currentQuery: string;
  clearResults: () => void;
  className?: string;
}

export default function AIAnalysis({ queryResults, currentQuery, clearResults, className }: AIAnalysisProps) {
  return (
    <div className={className}>
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
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentQuery && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Generated SQL:</p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 font-mono text-sm">
                    {currentQuery}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      {Object.keys(queryResults[0]).map((column) => (
                        <th
                          key={column}
                          className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.slice(0, 20).map((row, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}
                      >
                        {Object.keys(row).map((column) => (
                          <td
                            key={column}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                          >
                            {row[column]?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
          <p className="text-muted-foreground text-lg">Use the chat interface on the right to ask AI questions about your data</p>
        </div>
      )}
    </div>
  );
}