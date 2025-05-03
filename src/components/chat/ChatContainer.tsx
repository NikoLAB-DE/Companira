import React, { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { Loader2, Info, AlertCircle } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';

// Removed initialTopicPath prop interface

const ChatContainer: React.FC = () => { // Removed prop from component signature
  const {
    messages,
    loading,
    sendMessage,
    useTestWebhook,
    toggleWebhook,
    lastSentPayload,
    threadLoadingError
  } = useChat();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New state for thread IDs and loading (for admin debug)
  const [threadIds, setThreadIds] = useState<string[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial greeting message if chat is empty and not loading
  useEffect(() => {
    // Only send greeting if there are no messages AND we are not currently loading messages from DB
    // AND there is no thread loading error.
    if (messages.length === 0 && !loading && !threadLoadingError) {
      // Use a small timeout to ensure the component is fully rendered
      const timer = setTimeout(() => {
        // Double check messages length after timeout
        if (messages.length === 0) {
           const welcomeText = `Hi there! Enjoy our journey.`;
           // Use initialContent to send the greeting without needing user input
           sendMessage('', 'assistant', welcomeText); // Removed silentInject
        }
      }, 500); // Adjust delay as needed

      return () => clearTimeout(timer); // Cleanup timer on unmount or re-run
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loading, threadLoadingError]); // Depend on messages.length, loading, and threadLoadingError

  const userNickname = user?.nickname || 'User';
  const userInitial = userNickname?.charAt(0).toUpperCase() || 'U';

  const handleShowPayload = () => {
    if (lastSentPayload) {
      alert(`Last Sent Payload:\n\n${JSON.stringify(lastSentPayload, null, 2)}`);
    } else {
      alert('No message payload has been sent yet in this session.');
    }
  };

  // New function to fetch thread IDs (for admin debug)
  const fetchThreadIds = async () => {
    if (!user?.id) {
      alert('User not logged in.');
      return;
    }
    setLoadingThreads(true);
    try {
      // Fetch all threads for the user
      const { data, error } = await supabase
        .from('chat_threads')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        alert(`Error fetching thread IDs: ${error.message}`);
      } else if (data && data.length > 0) {
        const idsWithTitles = data.map(thread => `${thread.title} (${thread.id})`);
        setThreadIds(idsWithTitles);
        alert(`Thread IDs for ${user.nickname || user.email}:\n\n${idsWithTitles.join('\n')}`);
      } else {
        alert('No threads found for this user.');
      }
    } catch (err: any) {
      alert(`Unexpected error: ${err.message || err}`);
    } finally {
      setLoadingThreads(false);
    }
  };


  return (
    <div className="flex flex-col h-full bg-background">

      {/* Header Section - Conditionally render based on isAdmin */}
      {isAdmin && user && ( // Only show for logged-in admins
        <div className="flex-shrink-0 border-b p-2 bg-background flex items-center justify-between space-x-4">
          {/* Left side: Webhook Toggle and new Thread IDs Button */}
          <div className="flex items-center space-x-2">
            <Switch
              id="webhook-toggle"
              checked={useTestWebhook}
              onCheckedChange={toggleWebhook}
            />
            <Label htmlFor="webhook-toggle" className="text-sm text-foreground/80">
              {useTestWebhook ? 'Using Test Webhook' : 'Using Production Webhook'}
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchThreadIds}
              disabled={loadingThreads}
              title="Show all Thread IDs for current user"
            >
              {loadingThreads ? 'Loading...' : 'Show Thread IDs'}
            </Button>
          </div>
          {/* Right side: Show Payload Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowPayload}
            disabled={!lastSentPayload}
            title="Show JSON payload of the last sent message"
          >
            <Info className="h-4 w-4 mr-1" />
            Show Last Payload
          </Button>
        </div>
      )}

      {/* Message List Area */}
      <div className="flex-grow overflow-y-auto p-4 bg-muted/20">
        {/* --- Loading State (Initial Fetch) --- */}
        {loading && messages.length === 0 && !threadLoadingError ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-center">Loading conversation...</p>
          </div>
        ) : null}

        {/* --- Thread Loading Error State --- */}
        {!loading && messages.length === 0 && threadLoadingError && (
           <div className="flex flex-col items-center justify-center h-full text-center text-destructive bg-destructive/10 p-4 rounded-md border border-destructive">
             <AlertCircle className="h-8 w-8 mb-4" />
             <p className="font-semibold mb-2">Chat Unavailable</p>
             <p className="text-sm">{threadLoadingError}</p>
             {/* Optionally add a retry button if the error is potentially transient */}
           </div>
        )}

        {/* --- Empty Chat State (After Loading, No Messages, No Error) --- */}
        {!loading && messages.length === 0 && !threadLoadingError ? (
           <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
             <p className="text-center">Start your conversation below!</p>
           </div>
        ) : null}

        {/* --- Display Messages --- */}
        {messages.length > 0 && (
          messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              userInitial={userInitial}
              isLastMessage={index === messages.length - 1}
            />
          ))
        )}

        {/* --- Loading State (Sending Message) --- */}
        {loading && messages.length > 0 && (
          <div className="flex items-center space-x-2 text-muted-foreground my-4 pl-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Companira is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="flex-shrink-0 p-2 border-t bg-background">
        {/* Removed initialTopicPath prop */}
        <ChatInput />
      </div>
    </div>
  );
};

export default ChatContainer;
