import React from 'react';
import { marked } from 'marked'; // Import marked
import DOMPurify from 'dompurify'; // Import DOMPurify
import { Message } from '../../types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  userInitial: string;
}

// Configure marked (optional, but good practice)
// Ensure compatibility with GitHub Flavored Markdown and add line breaks
marked.setOptions({
  breaks: true, // Convert single line breaks in Markdown to <br> tags
  gfm: true,    // Enable GitHub Flavored Markdown (includes tables, strikethrough, etc.)
});

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userInitial }) => {
  const isUser = message.role === 'user';

  // Sanitize and render Markdown for assistant messages
  const renderContent = () => {
    if (!isUser) {
      // 1. Parse Markdown to HTML using marked
      // Ensure message.content is treated as a string
      const rawMarkup = marked.parse(String(message.content || ''));

      // 2. Sanitize the HTML using DOMPurify
      // Allow common formatting tags, but prevent script execution or harmful attributes
      const sanitizedMarkup = DOMPurify.sanitize(rawMarkup, {
         USE_PROFILES: { html: true } // Use the default HTML profile (allows common tags like p, strong, em, ul, ol, li, code, pre, blockquote, a[href], etc.)
         // Add specific tags or attributes if needed, e.g., ADD_TAGS: ['iframe'], ADD_ATTR: ['target']
      });

      // 3. Render the sanitized HTML using dangerouslySetInnerHTML
      // Apply Tailwind Typography plugin classes for styling
      return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
    }
    // Render user messages as plain text (no Markdown processing)
    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className={`flex items-start space-x-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0"> {/* Prevent avatar shrinking */}
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble */}
      <div
        className={`p-3 rounded-lg max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl break-words shadow-sm ${ // Adjusted max-widths
          isUser
            ? 'bg-primary text-primary-foreground' // User message style
            : 'bg-card text-card-foreground' // Assistant message style
        }`}
      >
        {renderContent()} {/* Render processed or plain content */}
      </div>

      {/* User Avatar */}
      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0"> {/* Prevent avatar shrinking */}
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {userInitial || <User className="h-5 w-5" />} {/* Display user initial or fallback icon */}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
