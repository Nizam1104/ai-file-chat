"use client";

import { useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useTableManager } from '@/stores/database';

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export default function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { isReady, getTableList } = useDatabase();
  const { setTableListFetcher, getTables } = useTableManager();

  // Initialize the table list fetcher when database is ready
  useEffect(() => {
    if (isReady && getTableList) {
      setTableListFetcher(getTableList);
    }
  }, [isReady, getTableList, setTableListFetcher]);

  // Auto-load tables when database is ready
  useEffect(() => {
    if (isReady) {
      getTables();
    }
  }, [isReady, getTables]);

  return <>{children}</>;
}