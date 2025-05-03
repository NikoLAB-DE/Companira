import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { supabase, fetchThreadIdByTitle } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// --- Constants ---
const PRODUCTION_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook/test';
const TEST_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook-test/test';

// --- Context Definition ---
interface ChatContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, role?: 'user' | 'assistant', initialContent?: string, isSystemPrompt?: boolean) => void; // Added isSystemPrompt
  clearMessages: () => void;
  chatId: string; // Unique ID for the current chat session instance (still useful for UI session)
  useTestWebhook: boolean;
  toggleWebhook: () => void;
  lastSentPayload: Record<string, any> | null; // For debugging
  clearLastSentPayload: () => void; // For debugging
  threadLoadingError: string | null; // Expose thread loading errors
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// --- Provider Component ---
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string>(uuidv4()); // Initialize chatId for UI session
  const [mainThreadId, setMainThreadId] = useState<string | null>(null);
  const [threadLoadingError, setThreadLoadingError] = useState<string | null>(null);
  const [useTestWebhook, setUseTestWebhook] = useState(false); // Default to production webhook
  const [lastSentPayload, setLastSentPayload] = useState<Record<string, any> | null>(null); // For debugging
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null); // Ref for the real-time channel

  // --- Fetch Main Thread ID ---
  const fetchAndSetMainThreadId = useCallback(async (userId: string) => {
    setThreadLoadingError(null); // Clear previous errors
    setMainThreadId(null); // Reset while fetching
    try {
      const id = await fetchThreadIdByTitle(userId, 'Main Chat');
      if (id) {
        setMainThreadId(id);
      } else {
        setThreadLoadingError('Could not find your main chat thread. It might need to be created or there was an issue during signup.');
        setMainThreadId(null);
      }
    } catch (err: any) {
      console.error('[ChatContext] Unexpected JS error fetching main thread ID:', err);
      setThreadLoadingError(`An unexpected error occurred while loading chat information: ${err.message || 'Unknown error'}`);
      setMainThreadId(null);
    }
  }, []);

  // --- Fetch Messages for the Current Day ---
  const fetchDailyMessages = useCallback(async (userId: string, threadId: string) => {
    setLoading(true); // Set loading true while fetching messages
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today in local time
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

      // Convert local dates to ISO strings for Supabase query
      const todayISO = today.toISOString();
      const tomorrowISO = tomorrow.toISOString();

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, message, created_at, is_system_prompt') // Select the new column
        .eq('user_id', userId)
        .eq('thread_id', threadId)
        .eq('is_system_prompt', false) // *** Filter out system prompts ***
        .gte('created_at', todayISO) // Greater than or equal to start of today
        .lt('created_at', tomorrowISO) // Less than start of tomorrow
        .order('created_at', { ascending: true }); // Oldest first

      if (error) {
        console.error('[ChatContext] Supabase error fetching daily messages:', error);
        setMessages([]);
      } else if (data) {
        const fetchedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          content: msg.message, // Map 'message' from DB to 'content' in state
          role: msg.role as 'user' | 'assistant', // Cast role
          timestamp: msg.created_at,
          isSystemPrompt: msg.is_system_prompt, // Include the new field
        }));
        setMessages(fetchedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('[ChatContext] Unexpected JS error fetching daily messages:', err);
      setMessages([]);
    } finally {
      setLoading(false); // Set loading false after fetch completes
    }
  }, []);

  // --- Effect: Fetch Thread ID and Messages when User Changes ---
  useEffect(() => {
    if (user?.id) {
      fetchAndSetMainThreadId(user.id);
    } else {
      // Clear thread info and messages if user logs out
      setMainThreadId(null);
      setThreadLoadingError(null);
      setMessages([]);
    }
  }, [user?.id, fetchAndSetMainThreadId]); // Re-run if user ID changes

  // --- Effect: Fetch Messages when Main Thread ID becomes available ---
  useEffect(() => {
    if (user?.id && mainThreadId) {
      fetchDailyMessages(user.id, mainThreadId);
    } else if (user?.id && mainThreadId === null && !threadLoadingError) {
       // User is logged in, but thread ID is null and no loading error yet.
    }
  }, [user?.id, mainThreadId, threadLoadingError, fetchDailyMessages]); // Re-run when user ID or mainThreadId changes

  // --- Effect: Set up Real-time Subscription ---
  useEffect(() => {
    if (!user?.id || !mainThreadId) {
      // Clean up existing subscription if user logs out or threadId is missing
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    // Clean up previous subscription before creating a new one
    if (realtimeChannelRef.current) {
       supabase.removeChannel(realtimeChannelRef.current);
       realtimeChannelRef.current = null;
    }

    const channel = supabase
      .channel(`chat-messages-${mainThreadId}`) // Unique channel name per thread
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only listen for new messages
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${mainThreadId}`, // Filter by the current main thread
        },
        (payload) => {
          const newMessage = payload.new as any; // Use 'any' temporarily for flexible access
          const messageContent = newMessage.content || newMessage.message; // Handle both 'content' and 'message' from real-time payload

          // *** Filter out system prompts from real-time updates ***
          if (newMessage.is_system_prompt) {
             console.log('[ChatContext] Received system prompt via real-time, skipping display.');
             return;
          }

          if (!messageContent) {
             console.warn('[ChatContext] Real-time payload missing content/message field:', payload.new);
             return; // Skip if no content field found
          }

          const formattedMessage: Message = {
             id: newMessage.id,
             content: messageContent,
             role: newMessage.role as 'user' | 'assistant',
             timestamp: newMessage.created_at,
             isSystemPrompt: newMessage.is_system_prompt, // Include the new field
          };

          // Add the new message to the state if it's not already there (basic deduplication)
          setMessages(prevMessages => {
             if (!prevMessages.some(msg => msg.id === formattedMessage.id)) {
                return [...prevMessages, formattedMessage].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Keep sorted
             }
             return prevMessages; // Return previous state if duplicate
          });
        }
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
           // Subscription active
         } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
           console.error(`[ChatContext] Real-time subscription error for thread ${mainThreadId}: ${status}`, err);
         } else if (status === 'CLOSED') {
            // Subscription closed
         }
      });

    realtimeChannelRef.current = channel; // Store the channel reference

    // Cleanup function for the subscription effect
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [user?.id, mainThreadId]); // Re-run when user ID or mainThreadId changes

  // --- Effect: Reset Chat ID on Webhook Toggle ---
  useEffect(() => {
    setChatId(uuidv4()); // Generate a new unique ID for this chat session instance
    setLastSentPayload(null); // Clear debug payload
  }, [useTestWebhook]);

  // --- Toggle Webhook Mode ---
  const toggleWebhook = useCallback(() => {
    setUseTestWebhook(prev => !prev);
  }, []);

  // --- Clear Debug Payload ---
  const clearLastSentPayload = useCallback(() => {
    setLastSentPayload(null);
  }, []);

  // --- Core Webhook Sending Logic ---
  const sendToWebhook = async (message: string): Promise<string> => {
    // --- Start Pre-checks ---
    if (!user?.id) {
      console.warn('[ChatContext:sendToWebhook] Aborting: No user ID.');
      return "Error: You must be logged in to send messages.";
    }
    if (threadLoadingError) {
      console.warn(`[ChatContext:sendToWebhook] Aborting: Thread loading error exists: ${threadLoadingError}`);
      return `Error: ${threadLoadingError}`;
    }
    let currentMainThreadId = mainThreadId;
    if (!currentMainThreadId) {
      console.warn('[ChatContext:sendToWebhook] mainThreadId is null. Attempting refetch...');
      await fetchAndSetMainThreadId(user.id);
      currentMainThreadId = mainThreadId;
      if (!currentMainThreadId) {
          console.warn('[ChatContext:sendToWebhook] Aborting: mainThreadId still null after refetch.');
          return `Error: ${threadLoadingError || "Chat thread information is not available. Please wait or try refreshing."}`;
      }
    }
    // --- End Pre-checks ---

    const payload = { user_id: user.id, thread_id: currentMainThreadId, message };
    setLastSentPayload(payload); // Store for debugging

    const webhookUrl = useTestWebhook ? TEST_WEBHOOK_URL : PRODUCTION_WEBHOOK_URL;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText = `Server responded with status ${response.status}.`;
        try {
          const body = await response.text();
          console.error(`[ChatContext:sendToWebhook] Webhook HTTP error! Status: ${response.status}, Body: ${body}`);
          if (response.status === 500) errorText = "An internal server error occurred on the assistant's side.";
          else if (response.status === 400) errorText = "There was an issue with the request sent to the assistant.";
          else if (response.status === 403) errorText = "You are not authorized to access the assistant.";
        } catch (e) {
          console.error('[ChatContext:sendToWebhook] Could not read error response body:', e);
        }
        return `Failed to send message. ${errorText} Please try again later.`;
      }

      const responseText = await response.text();

      if (!responseText || responseText.trim() === '') {
        console.warn('[ChatContext:sendToWebhook] Webhook returned empty response.');
        return "I received your message, but the assistant didn't provide a response this time.";
      }

      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(responseText);
          const content = jsonData.output || jsonData.response || jsonData.message || jsonData.text || jsonData.content;
          if (typeof content === 'string') {
            return content;
          } else {
            console.warn('[ChatContext:sendToWebhook] Parsed JSON response, but could not find standard content field. Returning stringified JSON.');
            return JSON.stringify(jsonData);
          }
        } catch (e) {
          console.warn('[ChatContext:sendToWebhook] Response looked like JSON but failed to parse. Returning raw text.', e);
          return responseText;
        }
      }

      return responseText;

    } catch (error: any) {
      console.error('[ChatContext:sendToWebhook] Error during fetch operation:', error);
      if (error instanceof TypeError) {
         if (error.message.includes('Failed to fetch')) {
            return "Sorry, I couldn't connect to the assistant. Please check your network connection or try again later.";
         }
         if (error.message.includes('CORS')) {
            return "A configuration issue (CORS) is preventing communication with the assistant. Please contact support.";
         }
      }
      return `Sorry, an unexpected error occurred while sending your message (${error.message || 'Unknown fetch error'}). Please try again later.`;
    }
  };


  // --- Send Message (User Interaction) ---
  const sendMessage = useCallback(async (
    content: string,
    role: 'user' | 'assistant' = 'user',
    initialContent?: string, // Optional initial content (e.g., from button click)
    isSystemPrompt: boolean = false // Added new parameter with default false
  ) => {
    const messageContent = initialContent || content; // Use initialContent if provided, else use content
    if (!messageContent || messageContent.trim() === '') {
      console.warn('[ChatContext:sendMessage] Called with empty content.');
      return; // Prevent sending empty messages
    }

    // --- Handle User Messages ---
    if (role === 'user' && !loading) {
      // Add user message to UI immediately ONLY if it's NOT a system prompt
      if (!isSystemPrompt) {
        const newUserMessage: Message = {
          id: uuidv4(), // Use UUID for optimistic UI update
          content: messageContent, // Use the final content to display
          role: 'user',
          timestamp: new Date().toISOString(), // Use current time for optimistic UI
          isSystemPrompt: isSystemPrompt, // Include the flag
        };
        setMessages(prev => [...prev, newUserMessage]);
      }


      // Save user message to Supabase
      if (user?.id && mainThreadId) {
        try {
          const { error } = await supabase
            .from('chat_messages')
            .insert({
              id: uuidv4(), // Generate a new UUID for the DB entry
              thread_id: mainThreadId,
              user_id: user.id,
              content: messageContent, // Save the actual content
              role: 'user', // Always save as 'user' role from the user's perspective
              created_at: new Date().toISOString(),
              is_system_prompt: isSystemPrompt, // *** Save the flag to DB ***
            })
            .select() // Select the inserted data to confirm
            .single();

          if (error) {
            console.error('[ChatContext:sendMessage] Supabase error saving user message:', error);
          }
        } catch (dbErr) {
          console.error('[ChatContext:sendMessage] Unexpected error saving user message to Supabase:', dbErr);
        }
      } else {
         console.warn('[ChatContext:sendMessage] Skipping saving user message to Supabase: user or mainThreadId missing.');
      }

      // Set loading true only if it's a user-initiated message (not a silent system prompt)
      // This ensures the loading indicator shows for the webhook call.
      if (!isSystemPrompt) {
         setLoading(true);
      }


      try {
        // Call the webhook logic with the actual message content
        const responseContent = await sendToWebhook(messageContent);

        // Create the assistant's response message
        const aiMessage: Message = {
          id: uuidv4(), // Use UUID for the assistant message
          content: responseContent,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          isSystemPrompt: false, // Assistant responses are never system prompts
        };

        // Add the assistant's response message to UI
        // Note: Real-time subscription will also add this if it's saved to DB,
        // but adding it optimistically here provides a faster UI update.
        // Deduplication in the real-time handler prevents duplicates.
        setMessages(prev => [...prev, aiMessage]);

        // Save assistant message to Supabase
        if (user?.id && mainThreadId) {
           try {
             const { error } = await supabase
               .from('chat_messages')
               .insert({
                 id: aiMessage.id,
                 thread_id: mainThreadId,
                 user_id: user.id, // Associate assistant message with the user who received it
                 content: aiMessage.content,
                 role: aiMessage.role,
                 created_at: aiMessage.timestamp,
                 is_system_prompt: false, // Assistant responses are never system prompts
               })
               .select()
               .single();

             if (error) {
               console.error('[ChatContext:sendMessage] Supabase error saving assistant message:', error);
             }
           } catch (dbErr) {
             console.error('[ChatContext:sendMessage] Unexpected error saving assistant message to Supabase:', dbErr);
           }
        } else {
           console.warn('[ChatContext:sendMessage] Skipping saving assistant message to Supabase: user or mainThreadId missing.');
        }

      } catch (error) {
        console.error('[ChatContext:sendMessage] Unexpected error during sendMessage flow after sendToWebhook:', error);
        const errorMessage: Message = {
          id: uuidv4(),
          content: "Oops! Something unexpected went wrong while processing the response.",
          role: 'assistant',
          timestamp: new Date().toISOString(),
          isSystemPrompt: false, // Error messages are not system prompts
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        // Set loading false only if it was set to true (i.e., not a silent system prompt)
        if (!isSystemPrompt) {
           setLoading(false); // Ensure loading is always set to false
        }
      }
    }
    // --- Handle Direct Assistant Messages (e.g., initial greeting) ---
    else if (role === 'assistant') {
      const newAssistantMessage: Message = {
        id: uuidv4(),
        content: messageContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isSystemPrompt: false, // Direct assistant messages are not system prompts
      };
      setMessages(prev => [...prev, newAssistantMessage]);
      // Note: Direct assistant messages added this way are NOT saved to the DB.
      // If you need them saved, you'd add similar Supabase insert logic here,
      // ensuring is_system_prompt is false.
    }
  }, [loading, user?.id, mainThreadId, threadLoadingError, useTestWebhook, fetchAndSetMainThreadId, sendToWebhook]);


  // --- Clear Messages ---
  const clearMessages = useCallback(() => {
    // Note: This currently only clears the *local* message state.
    // It does NOT delete messages from the database.
    setMessages([]); // Clear state
    setChatId(uuidv4()); // Reset chat session ID
    setLastSentPayload(null); // Clear debug payload
  }, [user?.id]); // Dependency on user?.id

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
    clearLastSentPayload,
    threadLoadingError // Expose error state
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
    throw new Error('useChat mustbe used within a ChatProvider');
  }
  return context;
};
