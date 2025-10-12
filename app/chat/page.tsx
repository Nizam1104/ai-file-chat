"use client"
import { useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ChatSideBar from "@/components/chat-ui/ChatSideBar"
import ChatTabsWrapper from "@/components/chat-ui/ChatTabsWrapper"
import { Card, CardContent } from "@/components/ui/card";
import { useAiChatStore } from "@/stores/ai-chat";
import { getChatSession } from "@/actions/client";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const searchParams = useSearchParams();

  const {
    setCurrentSessionId,
    setCurrentSession,
    setLoading,
    setError
  } = useAiChatStore();

  const loadChatSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      // For now, we'll use a placeholder user ID. In a real app, this would come from authentication
      const userId = 'demo-user'; // Replace with actual user ID from auth
      const result = await getChatSession(userId, sessionId);

      if (result.success && result.session) {
        setCurrentSessionId(sessionId);
        setCurrentSession(result.session);
      } else {
        setError(result.error || 'Failed to load chat session');
      }
    } catch (error) {
      setError('Error loading chat session');
      console.error('Error loading chat session:', error);
    } finally {
      setLoading(false);
    }
  }, [setCurrentSessionId, setCurrentSession, setLoading, setError]);

  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    if (sessionId) {
      loadChatSession(sessionId);
    }
  }, [searchParams, loadChatSession]);

  return (
    <div className="flex w-full min-h-screen">
      <div className="flex-1">
        <div className="h-full p-2">
          <Card className="max-w-4xl w-full mx-auto h-full">
            <CardContent className="h-full">
              <ChatTabsWrapper />
            </CardContent>
          </Card>
        </div>
      </div>
      <ChatSideBar />
    </div>
  )
}
