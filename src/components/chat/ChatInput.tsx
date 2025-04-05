import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Send, CornerDownLeft } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, loading } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !loading) {
      sendMessage(message.trim());
      setMessage('');
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
      const scrollHeight = textareaRef.current.scrollHeight;
      // Consider max-height if you have one defined in CSS
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [message]);

  return (
    // The form now sits inside a padded container in ChatContainer
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message here..."
        // Adjusted classes for better fit and appearance
        className="flex-grow resize-none overflow-y-auto max-h-40 min-h-[40px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={1}
        disabled={loading}
      />
      <Button
        type="submit"
        size="icon"
        className="h-10 w-10 flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-md" // Added rounded-md
        disabled={loading || !message.trim()}
      >
        {loading ? (
          <CornerDownLeft className="h-5 w-5 animate-pulse" />
        ) : (
          <Send className="h-5 w-5" />
        )}
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
};

export default ChatInput;
