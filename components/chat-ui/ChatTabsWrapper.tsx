"use client";

import { Suspense } from "react";
import ChatTabs from "./ChatTabs";

interface ChatTabsWrapperProps {
  queryResults: Record<string, unknown>[];
  currentQuery: string;
  clearResults: () => void;
}

export default function ChatTabsWrapper({ queryResults, currentQuery, clearResults }: ChatTabsWrapperProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatTabs
        queryResults={queryResults}
        currentQuery={currentQuery}
        clearResults={clearResults}
      />
    </Suspense>
  );
}