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
      // Basic validation (ensure it's an array)
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
  sendMessage: (content: string, role?: 'user' | 'assistant', initialContent?: string) => void;
  clearMessages: () => void; // Clears current session messages
  chatId: string; // Session-specific ID (might be less relevant now)
  useTestWebhook: boolean;
  toggleWebhook: () => void;
  lastSentPayload: Record<string, any> | null;
  clearLastSentPayload: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// --- Provider Component ---
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string>(uuidv4()); // Session-specific ID
  const [mainThreadId, setMainThreadId] = useState<string | null>(null);
  const [threadLoadingError, setThreadLoadingError] = useState<string | null>(null);
  const [useTestWebhook, setUseTestWebhook] = useState(false);
  const [lastSentPayload, setLastSentPayload] = useState<Record<string, any> | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false); // Track initial load

  // --- Thread ID Management ---
  const fetchAndSetMainThreadId = useCallback(async (userId: string) => {
    setThreadLoadingError(null);
    setMainThreadId(null);
    console.log(`Fetching main thread ID for user: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('user_id', userId)
        .eq('title', 'Main Chat')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(`Main Chat thread not found for user ${userId}.`);
          setThreadLoadingError('Could not find your main chat thread.');
        } else {
          console.error('Error fetching main thread ID:', error);
          setThreadLoadingError('Failed to load chat thread information.');
        }
        setMainThreadId(null);
      } else if (data) {
        console.log(`Found main thread ID: ${data.id}`);
        setMainThreadId(data.id);
      } else {
         console.warn(`No data returned for Main Chat thread for user ${userId}.`);
         setThreadLoadingError('Could not find your main chat thread information.');
         setMainThreadId(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching main thread ID:', err);
      setThreadLoadingError('An unexpected error occurred while loading chat information.');
      setMainThreadId(null);
    }
  }, []);

  // Effect: Fetch thread ID when user logs in
  useEffect(() => {
    if (user?.id) {
      fetchAndSetMainThreadId(user.id);
    } else {
      setMainThreadId(null);
      setThreadLoadingError(null);
    }
  }, [user?.id, fetchAndSetMainThreadId]); // Depend only on user.id

  // Effect: Load messages from storage on initial mount or user change
  useEffect(() => {
    console.log("Auth state changed, attempting to load messages for user:", user?.id);
    if (user?.id) {
      const loadedMessages = loadMessagesFromStorage(user.id);
      console.log(`Loaded ${loadedMessages.length} messages from sessionStorage.`);
      setMessages(loadedMessages);
    } else {
      // If no user, ensure messages are cleared (e.g., after logout)
      setMessages([]);
    }
    setIsInitialLoadComplete(true); // Mark initial load as complete
  }, [user?.id]); // Depend only on user.id

  // Effect: Save messages to storage when they change
  useEffect(() => {
    // Only save after initial load and if user is logged in
    if (isInitialLoadComplete && user?.id) {
      console.log(`Saving ${messages.length} messages to sessionStorage.`);
      saveMessagesToStorage(user.id, messages);
    }
  }, [messages, user?.id, isInitialLoadComplete]); // Depend on messages, user.id, and load status

  // Effect: Reset non-persistent state when webhook type changes
  // (Messages are now handled by persistence logic)
  useEffect(() => {
    console.log('Webhook type changed. Resetting session ID and payload.');
    setChatId(uuidv4()); // Generate a new chat ID for the new session/config
    setLastSentPayload(null); // Clear last payload on reset
  }, [useTestWebhook]); // Only depends on webhook toggle

  // --- Webhook & Payload ---
  const toggleWebhook = useCallback(() => {
    setUseTestWebhook(prev => !prev);
  }, []);

  const clearLastSentPayload = useCallback(() => {
    setLastSentPayload(null);
  }, []);

  // --- Core Send/Receive Logic ---
  const sendToWebhook = async (message: string): Promise<string> => {
    if (!user?.id) return "Please log in to send messages.";
    if (threadLoadingError) return threadLoadingError;
    if (!mainThreadId) return "Chat thread information is not available. Please wait or try refreshing.";

    const payload = { user_id: user.id, thread_id: mainThreadId, message: message };
    setLastSentPayload(payload);

    try {
      const webhookUrl = useTestWebhook ? TEST_WEBHOOK_URL : PRODUCTION_WEBHOOK_URL;
      console.log(`Sending to ${useTestWebhook ? 'TEST' : 'PRODUCTION'} webhook:`, payload);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const responseText = await response.text();
      console.log('Raw webhook response:', responseText);

      // Basic response parsing
      if (!responseText || responseText.trim() === '') return "I received your message, but I'm not sure how to respond.";
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(responseText);
          if (typeof jsonData === 'string') return jsonData;
          if (typeof jsonData === 'object') {
            return jsonData.output || jsonData.response || jsonData.message || jsonData.text || JSON.stringify(jsonData);
          }
        } catch (e) { console.log('Failed to parse JSON, using raw text'); }
      }
      return responseText;
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      return "Sorry, I couldn't connect to the assistant right now. Please try again later.";
    }
  };

  const sendMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user', initialContent?: string) => {
    const messageContent = initialContent || content;
    if (!messageContent) return; // Don't send empty messages

    // Add user message immediately
    if (role === 'user' && !loading) {
       const newMessage: Message = {
         id: uuidv4(),
         content: messageContent,
         role,
         timestamp: new Date().toISOString()
       };
       // Use functional update to ensure we have the latest messages state
       setMessages(prev => [...prev, newMessage]);

       // Check for auth/thread issues *before* calling webhook
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

       // Proceed to call webhook
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
       // Directly add assistant messages (e.g., initial welcome)
       const newMessage: Message = {
         id: uuidv4(),
         content: messageContent,
         role,
         timestamp: new Date().toISOString()
       };
       setMessages(prev => [...prev, newMessage]);
    }
  }, [loading, user?.id, mainThreadId, threadLoadingError, useTestWebhook, fetchAndSetMainThreadId]); // Refined dependencies

  // --- Clear Messages ---
  const clearMessages = useCallback(() => {
    // Clear state
    setMessages([]);
    // Clear storage for the current user
    clearMessagesFromStorage(user?.id);
    // Reset session-specific non-persistent state
    setChatId(uuidv4());
    setLastSentPayload(null);
  }, [user?.id]); // Depend on user.id to clear correct storage key

  // --- Context Value ---
  const value = {
    messages,
    loading,
    sendMessage,
    clearMessages,
    chatId,
    useTestWebhook,
    toggleWebhook,
    lastSentPayload,
    clearLastSentPayload
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// --- Hook ---
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
