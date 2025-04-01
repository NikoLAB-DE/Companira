import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { Loader2, Info } from 'lucide-react'; // Import Info icon
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button'; // Import Button

const ChatContainer: React.FC = () => {
  const {
    messages,
    loading,
    sendMessage,
    chatId,
    useTestWebhook,
    toggleWebhook,
    lastSentPayload, // Get payload state
    // clearLastSentPayload // Get clear function (optional for now)
  } = useChat();
  const { user } = useAuth(); // Get user data from AuthContext
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0 && !loading) { // Ensure welcome message isn't added while loading initial state
      const timer = setTimeout(() => {
        // Check again inside timeout in case state changed rapidly
        if (messages.length === 0) {
           // Updated welcome message - removed Chat ID
           const welcomeText = `Hi there! I'm Companira, your psychological assistant. How are you feeling today? You can share anything that's on your mind, ask for advice, or just chat about your day.`;
           sendMessage('', 'assistant', welcomeText);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loading]); // Add loading dependency

  // Extract user nickname or default to 'U'
  const userNickname = user?.nickname || 'User'; // Use nickname from AuthContext user state
  const userInitial = userNickname?.charAt(0).toUpperCase() || 'U';

  // Function to show the last sent payload
  const handleShowPayload = () => {
    if (lastSentPayload) {
      alert(`Last Sent Payload:\n\n${JSON.stringify(lastSentPayload, null, 2)}`);
    } else {
      alert('No message payload has been sent yet in this session.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-2 bg-background flex items-center justify-between space-x-4"> {/* Use bg-background */}
        {/* Left side: Webhook Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="webhook-toggle"
            checked={useTestWebhook}
            onCheckedChange={toggleWebhook}
          />
          <Label htmlFor="webhook-toggle" className="text-sm text-foreground/80"> {/* Use themed text color */}
            {useTestWebhook ? 'Using Test Webhook' : 'Using Production Webhook'}
          </Label>
        </div>

        {/* Right side: Show Payload Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowPayload}
          disabled={!lastSentPayload} // Disable if no payload exists
          title="Show JSON payload of the last sent message"
        >
          <Info className="h-4 w-4 mr-1" />
          Show Last Payload
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-muted/20"> {/* Use themed background */}
        {messages.length === 0 && !loading ? ( // Show welcome prompt state only if not loading
           <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
             <p className="text-center">Start the conversation by typing below.</p>
           </div>
        ) : messages.length === 0 && loading ? ( // Show loading state when messages are empty AND loading
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" /> {/* Use primary color */}
            <p className="text-center">Initializing your conversation...</p>
            {/* Removed Chat ID */}
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              userInitial={userInitial} // Pass user initial
            />
          ))
        )}

        {loading && messages.length > 0 && ( // Only show thinking indicator if messages exist
          <div className="flex items-center space-x-2 text-muted-foreground my-4 pl-12"> {/* Indent thinking indicator */}
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> {/* Use primary color */}
            <span>Companira is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Pass props directly */}
      <ChatInput />
    </div>
  );
};

export default ChatContainer;
