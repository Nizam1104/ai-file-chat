"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Database, Trash2, Table } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { useTableManager, useDatabaseStore } from "@/stores/database";

interface SettingsDialogProps {
  children: React.ReactNode;
}

export default function SettingsDialog({ children }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isReady, deleteDatabase } = useDatabase();
  const { tables: existingTables, getTables } = useTableManager();

  const loadExistingTables = async () => {
    if (!isReady) return;

    try {
      await getTables();
    } catch (error) {
      console.error('Error loading existing tables:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadExistingTables();
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm("Are you sure you want to clear all database tables? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteDatabase();
      // Clear tables from store after deletion
      useDatabaseStore.getState().clearTables();
      alert("Database cleared successfully!");
    } catch (error) {
      console.error('Error clearing database:', error);
      alert("Failed to clear database. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-6 h-6" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="data-tables" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="data-tables" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Data Tables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data-tables" className="flex-1 overflow-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Tables
                  </CardTitle>
                  <CardDescription>
                    Manage your uploaded data tables. Tables are automatically saved and persist between sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Processing...</span>
                    </div>
                  ) : existingTables.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Available Tables ({existingTables.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {existingTables.map((table) => (
                            <div
                              key={table}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-sm"
                            >
                              <Database className="w-3 h-3 text-muted-foreground" />
                              {table}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-4">
                              Tables are automatically saved and will persist after browser refresh.
                              Use the button below to clear all data if needed.
                            </p>
                            <Button
                              onClick={handleClearDatabase}
                              disabled={isLoading}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Clear All Tables
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No data tables found</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload an Excel file to create your first data table
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}