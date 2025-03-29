import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

interface ChatContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, role?: 'user' | 'assistant', initialContent?: string) => void;
  clearMessages: () => void;
  chatId: string;
  useTestWebhook: boolean;
  toggleWebhook: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Webhook URLs
const PRODUCTION_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook/companira-chat';
const TEST_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook-test/companira-chat';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string>(uuidv4()); // Generate a unique chat ID
  const [useTestWebhook, setUseTestWebhook] = useState(false);
  const { user } = useAuth();

  // Effect to reset chat when user changes or webhook type changes
  useEffect(() => {
    console.log('User or webhook type changed. Resetting chat.');
    setMessages([]); // Clear messages
    setChatId(uuidv4()); // Generate a new chat ID for the new session/user
    // Optionally add a new welcome message for the new user/session
    // Note: The welcome message logic is currently in ChatContainer,
    // which might re-trigger it automatically when messages become empty.
  }, [user, useTestWebhook]); // Depend on user and useTestWebhook

  const toggleWebhook = useCallback(() => {
    setUseTestWebhook(prev => !prev);
    // Resetting chat is now handled by the useEffect above
  }, []);

  // Function to send message to n8n webhook and get response
  const sendToWebhook = async (message: string): Promise<string> => {
    try {
      const webhookUrl = useTestWebhook ? TEST_WEBHOOK_URL : PRODUCTION_WEBHOOK_URL;

      const payload = {
        user_id: user?.id || 'anonymous', // Ensure current user's ID is sent
        chat_id: chatId,
        message: message
      };

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
      // Return a user-friendly error message instead of throwing
      return "Sorry, I couldn't connect to the assistant right now. Please try again later.";
    }
  };

  const sendMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user', initialContent?: string) => {
    const messageContent = initialContent || content;

    // Only proceed if content exists (for user messages) or if it's an assistant message, and not currently loading
    if ((messageContent || role === 'assistant') && !loading) {
      const newMessage: Message = {
        id: uuidv4(),
        content: messageContent,
        role,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);

      // If it's a user message, send to webhook and get response
      if (role === 'user' && messageContent) {
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
          // Error handling is now inside sendToWebhook, but keep this as a fallback
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
      }
    }
  }, [loading, user, chatId, useTestWebhook]); // Dependencies for sendMessage

  const clearMessages = useCallback(() => {
    setMessages([]);
    setChatId(uuidv4()); // Also reset chat ID on manual clear
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      loading,
      sendMessage,
      clearMessages,
      chatId,
      useTestWebhook,
      toggleWebhook
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
