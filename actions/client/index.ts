import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/client/firestore';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  query?: string;
  timestamp: Timestamp;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messages: ChatMessage[];
}

export async function saveChatMessage(
  userId: string,
  sessionId: string,
  message: string,
  query?: string,
  type: 'user' | 'ai' = 'user'
) {
  try {
    const messageRef = doc(
      collection(db, 'chat_sessions', userId, 'sessions', sessionId, 'messages')
    );

    const messageData: ChatMessage = {
      id: messageRef.id,
      type,
      message,
      query,
      timestamp: Timestamp.now()
    };

    await setDoc(messageRef, messageData);

    // Update session metadata
    const sessionRef = doc(db, 'chat_sessions', userId, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      await setDoc(sessionRef, {
        updatedAt: Timestamp.now(),
        title: type === 'user' ? message.slice(0, 50) + (message.length > 50 ? '...' : '') : sessionSnap.data().title
      }, { merge: true });
    }

    return { success: true, messageId: messageRef.id };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { success: false, error: error.message };
  }
}

export async function createChatSession(userId: string, title: string) {
  try {
    const sessionRef = doc(collection(db, 'chat_sessions', userId, 'sessions'));
    const sessionId = sessionRef.id;

    const sessionData: Omit<ChatSession, 'id' | 'messages'> = {
      userId,
      title,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(sessionRef, sessionData);

    return { success: true, sessionId };
  } catch (error) {
    console.error('Error creating chat session:', error);
    return { success: false, error: error.message };
  }
}

export async function getChatSession(userId: string, sessionId: string) {
  try {
    const sessionRef = doc(db, 'chat_sessions', userId, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Session not found' };
    }

    const sessionData = sessionSnap.data() as Omit<ChatSession, 'id' | 'messages'>;

    // Get messages for this session
    const messagesQuery = query(
      collection(db, 'chat_sessions', userId, 'sessions', sessionId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const messagesSnap = await getDocs(messagesQuery);
    const messages = messagesSnap.docs.map(doc => doc.data() as ChatMessage);

    return {
      success: true,
      session: {
        id: sessionId,
        ...sessionData,
        messages
      }
    };
  } catch (error) {
    console.error('Error getting chat session:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserChatSessions(userId: string, limit: number = 20) {
  try {
    const sessionsQuery = query(
      collection(db, 'chat_sessions', userId, 'sessions'),
      orderBy('updatedAt', 'desc'),
      where('userId', '==', userId)
    );

    const sessionsSnap = await getDocs(sessionsQuery);
    const sessions = sessionsSnap.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Omit<ChatSession, 'messages'>));

    return { success: true, sessions };
  } catch (error) {
    console.error('Error getting user chat sessions:', error);
    return { success: false, error: error.message };
  }
}