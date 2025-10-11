"use client"
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Database, RefreshCw } from "lucide-react";
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
  const { getTableData, isReady } = useDatabase();
  const { tables: existingTables, getTables, hasTables } = useTableManager();
  const hasLoadedInitialData = useRef(false);
  
  const loadDatabaseData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);

    try {
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

  useEffect(() => {
    if (isReady && !hasLoadedInitialData.current) {
      hasLoadedInitialData.current = true;
      loadDatabaseData();
    }
  }, [isReady, loadDatabaseData]);

  useEffect(() => {
    if (isActive && isReady && hasLoadedInitialData.current && dbData.length === 0) {
      loadDatabaseData();
    }
  }, [isActive, isReady, dbData.length, loadDatabaseData]);

  return (
    <div className={className}>
      {isDataLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading database data...</p>
          </div>
        </div>
      ) : dataError ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <p className="text-red-500">Error loading database data</p>
            <p className="text-sm text-gray-500">{dataError}</p>
            <Button onClick={loadDatabaseData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
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
                </div>
                <Button
                  onClick={loadDatabaseData}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                </Button>
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