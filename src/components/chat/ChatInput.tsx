import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Send, CornerDownLeft } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

// Removed props as they are now directly accessed via useChat hook
const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, loading } = useChat(); // Get sendMessage and loading from context
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !loading) {
      sendMessage(message.trim()); // Call context's sendMessage
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [message]);

  return (
    // Removed outer div as ChatContainer now handles padding/border
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        className="flex-grow resize-none overflow-y-auto max-h-40 min-h-[40px] rounded-lg border border-input focus-visible:ring-1 focus-visible:ring-ring" // Use theme variables
        rows={1}
        disabled={loading} // Use loading state from context
      />
      <Button
        type="submit"
        size="icon"
        className="h-10 w-10 flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" // Use primary color
        disabled={loading || !message.trim()} // Use loading state from context
      >
        {loading ? (
          <CornerDownLeft className="h-5 w-5 animate-pulse" /> // Simple loading indicator
        ) : (
          <Send className="h-5 w-5" />
        )}
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
};

export default ChatInput;
