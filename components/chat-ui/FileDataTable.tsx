"use client"
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Database, RefreshCw, AlertCircle } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { useTableManager } from "@/stores/database";

interface FileDataTableProps {
  className?: string;
  isActive?: boolean;
}

export default function FileDataTable({ className, isActive = true }: FileDataTableProps) {
  const [dbData, setDbData] = useState<Record<string, unknown>[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const {
    getTableData,
    isReady,
    isLoading: dbLoading,
    error: dbError,
    initStatus,
    retry,
    forceReinit
  } = useDatabase();
  const { tables: existingTables, getTables, hasTables, isLoading: tablesLoading } = useTableManager();
  const hasLoadedInitialData = useRef(false);

  const loadDatabaseData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
      // First ensure we have the latest table list
      const tables = await getTables();

      if (tables.length > 0) {
        // Get data from the first available table
        const tableName = tables[0];
        const result = await getTableData(tableName, 5, 0); // Get top 5 rows

        if (result && result.data) {
          setDbData(result.data);
        } else {
          setDbData([]);
        }
      } else {
        setDbData([]);
      }
    } catch (error) {
      console.error('Error loading database data:', error);
      setDataError(error instanceof Error ? error.message : 'Failed to load database data');
      setDbData([]);
    } finally {
      setIsDataLoading(false);
    }
  }, [getTables, getTableData]);

  // Auto-initialize and load data when database becomes ready
  useEffect(() => {
    if (isReady && !hasLoadedInitialData.current) {
      hasLoadedInitialData.current = true;
      loadDatabaseData();
    }
  }, [isReady, loadDatabaseData]);

  // Reload data when component becomes active and no data exists
  useEffect(() => {
    if (isActive && isReady && hasLoadedInitialData.current && dbData.length === 0 && !dataError) {
      loadDatabaseData();
    }
  }, [isActive, isReady, dbData.length, dataError, loadDatabaseData]);

  // Calculate overall loading state
  const isLoading = dbLoading || tablesLoading || isDataLoading;

  return (
    <div className={className}>
      {initStatus === 'initializing' || isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">
              {initStatus === 'initializing' ? 'Initializing database...' : 'Loading data...'}
            </p>
          </div>
        </div>
      ) : initStatus === 'error' || dataError || dbError ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3 max-w-md mx-auto px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <div>
              <p className="text-red-500 font-medium">Database Error</p>
              <p className="text-sm text-gray-600 mt-1">
                {dataError || dbError || 'Unknown database error occurred'}
              </p>
              {initStatus === 'error' && (
                <p className="text-xs text-gray-500 mt-2">
                  Status: Database initialization failed
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadDatabaseData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Data
              </Button>
              {initStatus === 'error' && (
                <Button onClick={retry} variant="outline" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Retry Connection
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : dbData.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">📊 Database Data</CardTitle>
                  {existingTables.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({existingTables[0]})
                    </span>
                  )}
                  {/* Connection status indicator */}
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      initStatus === 'ready' ? 'bg-green-500' :
                      initStatus === 'initializing' ? 'bg-yellow-500 animate-pulse' :
                      'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-500">
                      {initStatus === 'ready' ? 'Connected' :
                       initStatus === 'initializing' ? 'Connecting...' :
                       'Disconnected'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={loadDatabaseData}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    title="Refresh data"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                  </Button>
                  {initStatus !== 'ready' && (
                    <Button
                      onClick={forceReinit}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-orange-500"
                      title="Reconnect database"
                    >
                      <Database className="w-4 h-4 mr-1" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(dbData[0]).map((column) => (
                      <TableHead key={column}>
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.keys(row).map((column) => (
                        <TableCell key={column}>
                          {row[column]?.toString() || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Showing top {dbData.length} rows from database
                </TableCaption>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : !hasTables ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <Database className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-muted-foreground text-lg">No database available</p>
            <p className="text-sm text-gray-500">Upload an Excel file to create a database</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-lg">No data available in database</p>
        </div>
      )}
    </div>
  );
}