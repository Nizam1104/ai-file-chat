"use client";

import { useEffect, useRef } from "react";
import { useAiChatStore } from "@/stores/ai-chat";
import { Card, CardContent } from "@/components/ui/card";

export default function ChatMessages() {
  const { messages, isLoading } = useAiChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm p-4">
        <p>No messages yet. Start a conversation by asking a question about your data!</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ scrollBehavior: 'smooth' }}
    >
      {messages.map((message) => (
        <Card key={message.id} className={`${
          message.type === 'user'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ml-auto max-w-[80%]'
            : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 mr-auto max-w-[80%]'
        }`}>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white'
              }`}>
                {message.type === 'user' ? 'U' : 'AI'}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${
                  message.type === 'user'
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {message.message}
                </p>
                {message.query && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                    SQL: {message.query}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {message.timestamp.toDate().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {isLoading && (
        <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 mr-auto max-w-[80%]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs font-semibold">
                AI
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}