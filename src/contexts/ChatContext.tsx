import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase'; // Import supabase client

interface ChatContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, role?: 'user' | 'assistant', initialContent?: string) => void;
  clearMessages: () => void;
  chatId: string; // Keep chatId for potential future use or logging, but thread_id is primary now
  useTestWebhook: boolean;
  toggleWebhook: () => void;
  lastSentPayload: Record<string, any> | null;
  clearLastSentPayload: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Webhook URLs
const PRODUCTION_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook/companira-chat';
const TEST_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook-test/companira-chat';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string>(uuidv4()); // Session-specific ID
  const [mainThreadId, setMainThreadId] = useState<string | null>(null); // State for the user's main chat thread ID
  const [threadLoadingError, setThreadLoadingError] = useState<string | null>(null); // State for thread loading errors
  const [useTestWebhook, setUseTestWebhook] = useState(false);
  const [lastSentPayload, setLastSentPayload] = useState<Record<string, any> | null>(null);
  const { user } = useAuth();

  // Function to fetch the main chat thread ID for the current user
  const fetchAndSetMainThreadId = useCallback(async (userId: string) => {
    setThreadLoadingError(null); // Reset error on fetch attempt
    setMainThreadId(null); // Reset thread ID before fetching
    console.log(`Fetching main thread ID for user: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('user_id', userId)
        .eq('title', 'Main Chat') // Assuming the main chat is always titled 'Main Chat'
        .single(); // Expect only one main chat thread per user

      if (error) {
        if (error.code === 'PGRST116') { // PostgREST error code for "Resource not found"
          console.warn(`Main Chat thread not found for user ${userId}. It might need to be created.`);
          setThreadLoadingError('Could not find your main chat thread. Please ensure it exists or contact support.');
        } else {
          console.error('Error fetching main thread ID:', error);
          setThreadLoadingError('Failed to load chat thread information. Please try again later.');
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
  }, []); // No dependencies needed as it uses passed userId

  // Effect to fetch thread ID when user logs in or changes
  useEffect(() => {
    if (user?.id) {
      fetchAndSetMainThreadId(user.id);
    } else {
      // Clear thread ID if user logs out
      setMainThreadId(null);
      setThreadLoadingError(null); // Clear error on logout
    }
  }, [user, fetchAndSetMainThreadId]); // Depend on user and the fetch function

  // Effect to reset chat when user changes or webhook type changes
  useEffect(() => {
    console.log('User or webhook type changed. Resetting chat messages.');
    setMessages([]); // Clear messages
    setChatId(uuidv4()); // Generate a new chat ID for the new session
    setLastSentPayload(null); // Clear last payload on reset
    // MainThreadId is handled by the user effect above
  }, [user, useTestWebhook]); // Depend on user and useTestWebhook

  const toggleWebhook = useCallback(() => {
    setUseTestWebhook(prev => !prev);
    // Resetting chat messages is now handled by the useEffect above
  }, []);

  const clearLastSentPayload = useCallback(() => {
    setLastSentPayload(null);
  }, []);

  // Function to send message to n8n webhook and get response
  const sendToWebhook = async (message: string): Promise<string> => {
    // 1. Check for user authentication
    if (!user?.id) {
      return "Please log in to send messages.";
    }

    // 2. Check if thread ID is loaded (and handle loading errors)
    if (threadLoadingError) {
      return threadLoadingError; // Return the specific error message
    }
    if (!mainThreadId) {
      // This case might happen briefly during loading or if fetch failed silently
      return "Chat thread information is not available. Please wait or try refreshing.";
    }

    // 3. Construct the payload
    const payload = {
      user_id: user.id,
      thread_id: mainThreadId, // Use the fetched main thread ID
      message: message
    };

    // Store the payload before sending
    setLastSentPayload(payload);

    // 4. Send the request
    try {
      const webhookUrl = useTestWebhook ? TEST_WEBHOOK_URL : PRODUCTION_WEBHOOK_URL;
      console.log(`Sending to ${useTestWebhook ? 'TEST' : 'PRODUCTION'} webhook:`, payload);
      console.log('Webhook URL:', webhookUrl);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Raw webhook response:', responseText);

      // Basic response parsing (keep as is for now)
      if (!responseText || responseText.trim() === '') {
        return "I received your message, but I'm not sure how to respond.";
      }
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(responseText);
          if (typeof jsonData === 'string') return jsonData;
          if (typeof jsonData === 'object') {
            if (jsonData.output) return jsonData.output;
            if (jsonData.response) return jsonData.response;
            if (jsonData.message) return jsonData.message;
            if (jsonData.text) return jsonData.text;
            return JSON.stringify(jsonData);
          }
        } catch (e) {
          console.log('Failed to parse JSON, using raw text');
        }
      }
      return responseText;
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      return "Sorry, I couldn't connect to the assistant right now. Please try again later.";
    }
  };

  const sendMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user', initialContent?: string) => {
    const messageContent = initialContent || content;

    // Add user message immediately
    if (role === 'user' && messageContent && !loading) {
       const newMessage: Message = {
         id: uuidv4(),
         content: messageContent,
         role,
         timestamp: new Date().toISOString()
       };
       setMessages(prev => [...prev, newMessage]);

       // Check for thread ID issues *before* setting loading and calling webhook
       if (!user) {
         const errorMsg: Message = { id: uuidv4(), content: "Please log in to send messages.", role: 'assistant', timestamp: new Date().toISOString() };
         setMessages(prev => [...prev, errorMsg]);
         return; // Stop processing
       }
       if (threadLoadingError) {
         const errorMsg: Message = { id: uuidv4(), content: threadLoadingError, role: 'assistant', timestamp: new Date().toISOString() };
         setMessages(prev => [...prev, errorMsg]);
         return; // Stop processing
       }
       if (!mainThreadId) {
         const errorMsg: Message = { id: uuidv4(), content: "Chat thread information is not available. Please wait or try refreshing.", role: 'assistant', timestamp: new Date().toISOString() };
         setMessages(prev => [...prev, errorMsg]);
         return; // Stop processing
       }

       // If checks pass, proceed to call webhook
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
         // This catch might be redundant if sendToWebhook always returns a string,
         // but keep for safety.
         console.error('Error getting response from webhook:', error);
         const errorMessage: Message = {
           id: uuidv4(),
           content: "Oops! Something went wrong processing the response. Please try again.",
           role: 'assistant',
           timestamp: new Date().toISOString()
         };
         setMessages(prev => [...prev, errorMessage]);
       } finally {
         setLoading(false);
       }
    } else if (role === 'assistant' && messageContent) {
       // Directly add assistant messages (e.g., initial welcome)
       const newMessage: Message = {
         id: uuidv4(),
         content: messageContent,
         role,
         timestamp: new Date().toISOString()
       };
       setMessages(prev => [...prev, newMessage]);
    }
  }, [loading, user, mainThreadId, threadLoadingError, useTestWebhook, fetchAndSetMainThreadId]); // Added dependencies

  const clearMessages = useCallback(() => {
    setMessages([]);
    setChatId(uuidv4()); // Reset session ID
    setLastSentPayload(null); // Clear payload
    // Do not clear mainThreadId here, it's tied to the user session
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      loading,
      sendMessage,
      clearMessages,
      chatId,
      useTestWebhook,
      toggleWebhook,
      lastSentPayload,
      clearLastSentPayload
    }}>
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
