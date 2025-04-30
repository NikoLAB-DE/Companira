import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify'; // Import DOMPurify
import { marked } from 'marked'; // Import marked

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  markdownContent: string;
  title?: string;
  description?: string;
}

// Configure marked (same as in ChatMessage)
marked.setOptions({
  breaks: true,
  gfm: true,
});

const HelpDialog: React.FC<HelpDialogProps> = ({
  isOpen,
  onClose,
  markdownContent,
  title = "Help",
  description = "Find answers and tips here.",
}) => {

  // Function to render markdown safely (reused from ChatMessage)
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return null;
    const rawMarkup = marked.parse(String(markdown));
    const sanitizedMarkup = DOMPurify.sanitize(rawMarkup, { USE_PROFILES: { html: true } });
    return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col"> {/* Added max-h and flex-col */}
        <DialogHeader className="flex-shrink-0"> {/* Prevent header from shrinking */}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto py-4 pr-2 -mr-2"> {/* Added padding, right margin to offset scrollbar */}
           {/* Render the markdown content */}
           {renderMarkdown(markdownContent)}
        </div>
        {/* No footer needed for a simple info dialog */}
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
