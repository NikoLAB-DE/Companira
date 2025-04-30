import React, { useState, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Message } from '../../types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, Sparkles, MoreVertical, FileDown, Pin, ListPlus, ClipboardCopy, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  userInitial: string;
  isLastMessage?: boolean;
}

marked.setOptions({
  breaks: true,
  gfm: true,
});

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userInitial, isLastMessage }) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Placeholder actions
  const handleExport = () => {
    console.log("Placeholder: Export response", message.id);
    toast({ title: "Placeholder", description: "Export to PDF clicked." });
  };
  const handlePin = () => {
    console.log("Placeholder: Pin response", message.id);
    toast({ title: "Placeholder", description: "Pin Response clicked." });
  };
  const handleCreateTask = () => {
    console.log("Placeholder: Create task from response", message.id);
    toast({ title: "Placeholder", description: "Create Task clicked." });
  };

  // Copy function
  const handleCopy = useCallback(async () => {
    const textToCopy = message.content;
    if (!textToCopy) {
      toast({ title: "Error", description: "No content available to copy.", variant: "destructive" });
      return;
    }

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      console.error("Clipboard API (writeText) not available in this environment.");
      toast({ title: "Error", description: "Clipboard access is not available in this browser or context.", variant: "destructive" });
      return;
    }

    try {
      console.log("Attempting to copy chat message to clipboard...");
      await navigator.clipboard.writeText(textToCopy);
      console.log("Chat message successfully copied to clipboard.");
      setIsCopied(true);
      toast({ title: "Success", description: "Message copied to clipboard!" });
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error("Failed to copy chat message:", err);
      let errorMsg = "Could not copy message to clipboard.";
      if (err instanceof Error) {
        errorMsg += ` Reason: ${err.name} - ${err.message}`;
      }
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  }, [message.content, toast]);

  const renderContent = () => {
    if (isAssistant) {
      const rawMarkup = marked.parse(String(message.content || ''));
      const sanitizedMarkup = DOMPurify.sanitize(rawMarkup, { USE_PROFILES: { html: true } });
      return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
    }
    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className={`flex items-start space-x-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {/* Assistant Avatar */}
      {isAssistant && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble Container */}
      {/* Use relative positioning for the bubble to contain the absolutely positioned button */}
      <div className="relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <div
          className={`p-3 rounded-lg break-words shadow-sm ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground'
          }`}
        >
          {renderContent()}
        </div>

        {/* Options Popover Trigger (Only for assistant message) */}
        {isAssistant && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                // Position the button absolutely within the bubble container
                // Adjust bottom and right values for desired padding
                // Removed opacity classes to make it always visible
                className="absolute bottom-1 right-1 h-7 w-7 text-primary hover:text-primary/80"
                aria-label="Message options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            {/* PopoverContent positioning is handled by Radix UI, default should be fine */}
            <PopoverContent className="w-48 p-1">
              {/* Copy Button */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start px-2 py-1.5 text-sm",
                  isCopied && "text-green-600 hover:text-green-700" // Style when copied
                )}
                onClick={handleCopy}
                disabled={isCopied}
              >
                {isCopied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                )}
                {isCopied ? 'Copied!' : 'Copy'}
              </Button>
              {/* Other Buttons */}
              <Button variant="ghost" className="w-full justify-start px-2 py-1.5 text-sm" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" /> Export to PDF
              </Button>
              <Button variant="ghost" className="w-full justify-start px-2 py-1.5 text-sm" onClick={handlePin}>
                <Pin className="mr-2 h-4 w-4" /> Pin Response
              </Button>
              <Button variant="ghost" className="w-full justify-start px-2 py-1.5 text-sm" onClick={handleCreateTask}>
                <ListPlus className="mr-2 h-4 w-4" /> Create Task
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {userInitial || <User className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
