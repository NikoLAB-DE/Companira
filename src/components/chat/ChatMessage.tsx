import React from 'react';
import { Message } from '../../types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User, Sparkles } from 'lucide-react'; // Import Sparkles, keep User for fallback

interface ChatMessageProps {
  message: Message;
  userInitial: string; // Add prop for user initial
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userInitial }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start space-x-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          {/* Optional Bot Image */}
          {/* <AvatarImage src="/path/to/bot-avatar.png" alt="Assistant" /> */}
          <AvatarFallback className="bg-accent text-accent-foreground">
            {/* Updated Bot Icon */}
            <Sparkles className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg break-words shadow-sm ${ // Added subtle shadow
          isUser
            ? 'bg-primary text-primary-foreground' // User message: Orange background, dark text
            : 'bg-card text-card-foreground' // Assistant message: Card background, default text
        }`}
      >
        <p className="text-sm">{message.content}</p>
        {/* Optional: Timestamp */}
        {/* <p className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p> */}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          {/* Optional User Image */}
          {/* <AvatarImage src={user?.avatarUrl} alt="User" /> */}
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {/* Display user's first initial */}
            {userInitial || <User className="h-5 w-5" />} {/* Fallback to User icon if initial is missing */}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
