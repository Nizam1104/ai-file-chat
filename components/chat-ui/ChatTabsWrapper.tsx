"use client";

import { Suspense } from "react";
import ChatTabs from "./ChatTabs";

export default function ChatTabsWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatTabs />
    </Suspense>
  );
}