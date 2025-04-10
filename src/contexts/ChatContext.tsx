import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// --- Constants ---
const PRODUCTION_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook/companira-chat';
const TEST_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook-test/companira-chat';
const SESSION_STORAGE_KEY_PREFIX = 'companira-chat-history-';

// --- Helper Functions ---
const getStorageKey = (userId: string | undefined): string | null => {
  return userId ? `${SESSION_STORAGE_KEY_PREFIX}${userId}` : null;
};

const loadMessagesFromStorage = (userId: string | undefined): Message[] => {
  const key = getStorageKey(userId);
  if (!key) return [];
  try {
    const storedMessages = sessionStorage.getItem(key);
    if (storedMessages) {
      const parsedMessages: Message[] = JSON.parse(storedMessages);
      return Array.isArray(parsedMessages) ? parsedMessages : [];
    }
  } catch (error) {
    console.error('Error loading messages from sessionStorage:', error);
  }
  return [];
};

const saveMessagesToStorage = (userId: string | undefined, messages: Message[]) => {
  const key = getStorageKey(userId);
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages to sessionStorage:', error);
  }
};

const clearMessagesFromStorage = (userId: string | undefined) => {
  const key = getStorageKey(userId);
  if (key) {
    try {
      sessionStorage.removeItem(key);
      console.log(`Cleared chat history from sessionStorage for key: ${key}`);
    } catch (error) {
      console.error('Error clearing messages from sessionStorage:', error);
    }
  }
};

// --- Context Definition ---
interface ChatContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, role?: 'user' | 'assistant', initialContent?: string, silentInject?: boolean) => void;
  clearMessages: () => void;
  chatId: string;
  useTestWebhook: boolean;
  toggleWebhook: () => void;
  lastSentPayload: Record<string, any> | null;
  clearLastSentPayload: () => void;
  sendSilentMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// --- Provider Component ---
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string>(uuidv4());
  const [mainThreadId, setMainThreadId] = useState<string | null>(null);
  const [threadLoadingError, setThreadLoadingError] = useState<string | null>(null);
  const [useTestWebhook, setUseTestWebhook] = useState(false);
  const [lastSentPayload, setLastSentPayload] = useState<Record<string, any> | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const fetchAndSetMainThreadId = useCallback(async (userId: string) => {
    setThreadLoadingError(null);
    setMainThreadId(null);
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('user_id', userId)
        .eq('title', 'Main Chat')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setThreadLoadingError('Could not find your main chat thread.');
        } else {
          setThreadLoadingError('Failed to load chat thread information.');
        }
        setMainThreadId(null);
      } else if (data) {
        setMainThreadId(data.id);
      } else {
        setThreadLoadingError('Could not find your main chat thread information.');
        setMainThreadId(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching main thread ID:', err);
      setThreadLoadingError('An unexpected error occurred while loading chat information.');
      setMainThreadId(null);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchAndSetMainThreadId(user.id);
    } else {
      setMainThreadId(null);
      setThreadLoadingError(null);
    }
  }, [user?.id, fetchAndSetMainThreadId]);

  useEffect(() => {
    if (user?.id) {
      const loadedMessages = loadMessagesFromStorage(user.id);
      setMessages(loadedMessages);
    } else {
      setMessages([]);
    }
    setIsInitialLoadComplete(true);
  }, [user?.id]);

  useEffect(() => {
    if (isInitialLoadComplete && user?.id) {
      saveMessagesToStorage(user.id, messages);
    }
  }, [messages, user?.id, isInitialLoadComplete]);

  useEffect(() => {
    setChatId(uuidv4());
    setLastSentPayload(null);
  }, [useTestWebhook]);

  const toggleWebhook = useCallback(() => {
    setUseTestWebhook(prev => !prev);
  }, []);

  const clearLastSentPayload = useCallback(() => {
    setLastSentPayload(null);
  }, []);

  const sendToWebhook = async (message: string): Promise<string> => {
    if (!user?.id) return "Please log in to send messages.";
    if (threadLoadingError) return threadLoadingError;
    if (!mainThreadId) return "Chat thread information is not available. Please wait or try refreshing.";

    const payload = { user_id: user.id, thread_id: mainThreadId, message };
    setLastSentPayload(payload);

    try {
      const webhookUrl = useTestWebhook ? TEST_WEBHOOK_URL : PRODUCTION_WEBHOOK_URL;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const responseText = await response.text();

      if (!responseText || responseText.trim() === '') return "I received your message, but I'm not sure how to respond.";
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(responseText);
          if (typeof jsonData === 'string') return jsonData;
          if (typeof jsonData === 'object') {
            return jsonData.output || jsonData.response || jsonData.message || jsonData.text || JSON.stringify(jsonData);
          }
        } catch (e) {}
      }
      return responseText;
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      return "Sorry, I couldn't connect to the assistant right now. Please try again later.";
    }
  };

  const sendMessage = useCallback(async (
    content: string,
    role: 'user' | 'assistant' = 'user',
    initialContent?: string,
    silentInject: boolean = false
  ) => {
    const messageContent = initialContent || content;
    if (!messageContent) return;

    if (role === 'user' && !loading) {
      if (!silentInject) {
        const newMessage: Message = {
          id: uuidv4(),
          content: messageContent,
          role,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
      }

      if (!user?.id) {
        const errorMsg: Message = { id: uuidv4(), content: "Please log in to send messages.", role: 'assistant', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }
      if (threadLoadingError) {
        const errorMsg: Message = { id: uuidv4(), content: threadLoadingError, role: 'assistant', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }
      if (!mainThreadId) {
        const errorMsg: Message = { id: uuidv4(), content: "Chat thread information is not available. Please wait or try refreshing.", role: 'assistant', timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      setLoading(true);
      try {
        const responseContent = await sendToWebhook(messageContent);
        const aiMessage: Message = {
          id: uuidv4(),
          content: responseContent,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error processing webhook response:', error);
        const errorMessage: Message = {
          id: uuidv4(),
          content: "Oops! Something went wrong processing the response.",
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    } else if (role === 'assistant') {
      const newMessage: Message = {
        id: uuidv4(),
        content: messageContent,
        role,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
    }
  }, [loading, user?.id, mainThreadId, threadLoadingError, useTestWebhook, fetchAndSetMainThreadId]);

  const sendSilentMessage = useCallback(async (content: string) => {
    if (!content) return;
    if (!user?.id || !mainThreadId || threadLoadingError) return;
    try {
      await sendToWebhook(content);
    } catch (error) {
      console.error('Error sending silent message:', error);
    }
  }, [user?.id, mainThreadId, threadLoadingError, useTestWebhook]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    clearMessagesFromStorage(user?.id);
    setChatId(uuidv4());
    setLastSentPayload(null);
  }, [user?.id]);

  const value = {
    messages,
    loading,
    sendMessage,
    clearMessages,
    chatId,
    useTestWebhook,
    toggleWebhook,
    lastSentPayload,
    clearLastSentPayload,
    sendSilentMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
