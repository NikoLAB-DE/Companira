import React from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PinnedItem } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import DOMPurify from 'dompurify'; // Import DOMPurify
import { marked } from 'marked'; // Import marked

// Configure marked (same as in ChatMessage)
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Helper function to strip HTML tags from a string (copied from ToolsPage)
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  try {
    // Render markdown to HTML first, then strip tags
    const rawMarkup = marked.parse(String(html));
    const doc = new DOMParser().parseFromString(rawMarkup, 'text/html');
    return doc.body.textContent || '';
  } catch (e) {
    console.error("Error stripping HTML tags:", e);
    return html; // Return original string on error
  }
};


interface MinimizedPinnedSummaryProps {
  user: ReturnType<typeof useAuth>['user'];
  pinnedItems: PinnedItem[];
  onPinnedItemClick: (itemId: string) => void;
}

const MinimizedPinnedSummary: React.FC<MinimizedPinnedSummaryProps> = ({ user, pinnedItems, onPinnedItemClick }) => {
  if (!user) {
    // This component should only be rendered if user exists, but as a safeguard:
    return null;
  }

  if (pinnedItems.length === 0) {
    return (
      <div className="text-center p-4 flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No pinned conversations yet. Pin a message from the chat!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pinned Conversations:</p>
      <ul className="space-y-1.5 text-sm">
        {/* Limit to first 4 items for summary view */}
        {pinnedItems.slice(0, 4).map(item => {
          // Extract the first line for the summary view
          const firstLineText = stripHtmlTags(item.content.split('\n')[0]);

          return (
            <li key={item.id}>
              <button
                onClick={() => onPinnedItemClick(item.id)}
                className="flex items-center justify-between text-gray-600 dark:text-gray-400 w-full text-left hover:bg-gray-100 dark:hover:bg-slate-800 p-1 rounded transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-700"
                aria-label={`View pinned item: ${firstLineText}`}
                title={`Click to view: ${firstLineText}`}
              >
                <span className="truncate pr-2 flex-1" title={firstLineText}>{firstLineText}</span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Display timestamp */}
                  <span className="flex items-center text-muted-foreground text-xs" title={`Pinned: ${format(parseISO(item.timestamp), 'MMM d, yyyy HH:mm')}`}>
                    <Clock className="h-3 w-3 mr-0.5" />
                    {format(parseISO(item.timestamp), 'MMM d')} {/* Display only date in summary */}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
        {pinnedItems.length > 4 && (
          <li className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
            ...and {pinnedItems.length - 4} more
          </li>
        )}
      </ul>
    </div>
  );
};

export default MinimizedPinnedSummary;
