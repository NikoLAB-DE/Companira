import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Info } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

const ChatContainer: React.FC = () => {
  const {
    messages,
    loading,
    sendMessage,
    chatId,
    useTestWebhook,
    toggleWebhook,
    lastSentPayload,
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && !loading) {
      const timer = setTimeout(() => {
        if (messages.length === 0) {
           const welcomeText = `Hi there! I'm Companira, your psychological assistant. How are you feeling today? You can share anything that's on your mind, ask for advice, or just chat about your day.`;
           sendMessage('', 'assistant', welcomeText);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loading]);

  const userNickname = user?.nickname || 'User';
  const userInitial = userNickname?.charAt(0).toUpperCase() || 'U';

  const handleShowPayload = () => {
    if (lastSentPayload) {
      alert(`Last Sent Payload:\n\n${JSON.stringify(lastSentPayload, null, 2)}`);
    } else {
      alert('No message payload has been sent yet in this session.');
    }
  };

  return (
    // Ensure the container takes full height and uses flex column layout
    <div className="flex flex-col h-full bg-background"> {/* Added bg-background here */}

      {/* Header Section (Webhook Toggle & Payload Button) */}
      <div className="flex-shrink-0 border-b p-2 bg-background flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="webhook-toggle"
            checked={useTestWebhook}
            onCheckedChange={toggleWebhook}
          />
          <Label htmlFor="webhook-toggle" className="text-sm text-foreground/80">
            {useTestWebhook ? 'Using Test Webhook' : 'Using Production Webhook'}
          </Label>
        </div>
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

      {/* Message List Area (Takes up remaining space and scrolls) */}
      <div className="flex-grow overflow-y-auto p-4 bg-muted/20"> {/* Use themed background */}
        {messages.length === 0 && !loading ? (
           <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
             <p className="text-center">Start the conversation by typing below.</p>
           </div>
        ) : messages.length === 0 && loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-center">Initializing your conversation...</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              userInitial={userInitial}
            />
          ))
        )}

        {loading && messages.length > 0 && (
          <div className="flex items-center space-x-2 text-muted-foreground my-4 pl-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Companira is thinking...</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area (Fixed at the bottom, doesn't grow) */}
      <div className="flex-shrink-0 p-2 border-t bg-background"> {/* Added padding and border */}
        <ChatInput />
      </div>
    </div>
  );
};

export default ChatContainer;
