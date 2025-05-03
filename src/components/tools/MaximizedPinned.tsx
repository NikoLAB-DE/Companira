import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePinnedItems } from '@/contexts/PinnedItemsContext';
import { PinnedItem } from '@/types';
import LockedToolContent from './LockedToolContent';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, Pencil, Trash2, Save, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked (same as in ChatMessage)
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Helper function to render markdown safely (copied from ToolsPage)
const renderMarkdown = (markdown: string) => {
  if (!markdown) return null;
  // Use marked to convert markdown to HTML, then sanitize
  const rawMarkup = marked.parse(String(markdown));
  const sanitizedMarkup = DOMPurify.sanitize(rawMarkup, { USE_PROFILES: { html: true } });
  return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
};

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


interface MaximizedPinnedProps {
  user: ReturnType<typeof useAuth>['user'];
  pinnedItems: PinnedItem[];
  removePinnedItem: ReturnType<typeof usePinnedItems>['removePinnedItem'];
  updatePinnedItem: ReturnType<typeof usePinnedItems>['updatePinnedItem'];
  initialPinnedItemId?: string | null; // Prop to indicate which item to expand initially
}

const MaximizedPinned: React.FC<MaximizedPinnedProps> = ({
  user,
  pinnedItems,
  removePinnedItem,
  updatePinnedItem,
  initialPinnedItemId,
}) => {
  if (!user) {
    return <LockedToolContent />;
  }

  // State for managing expanded/editing state of individual pinned items
  const [expandedPinnedItems, setExpandedPinnedItems] = useState<Set<string>>(new Set());
  const [editingPinnedItemId, setEditingPinnedItemId] = useState<string | null>(null);
  // State to hold the content being edited (will be HTML from contenteditable)
  const [editPinnedContent, setEditPinnedContent] = useState('');
  // Ref for the contenteditable div
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Effect to handle initial pinned item expansion
  useEffect(() => {
    if (initialPinnedItemId) {
      console.log("[MaximizedPinned] Initial pinned item ID:", initialPinnedItemId); // Debug log
      // Add the initial pinned item ID to the expanded set
      setExpandedPinnedItems(prev => new Set(prev).add(initialPinnedItemId));
      // Optionally, find the item and set it for editing immediately
      // const itemToEdit = pinnedItems.find(item => item.id === initialPinnedItemId);
      // if (itemToEdit) {
      //    handleEditPinnedItem(itemToEdit);
      // }
    }
  }, [initialPinnedItemId]); // Depend on initialPinnedItemId

  // --- Pinned Items Handlers (Moved from ToolsPage) ---
  const togglePinnedItemExpansion = (id: string) => {
    setExpandedPinnedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEditPinnedItem = (item: PinnedItem) => {
    setEditingPinnedItemId(item.id);
    // When starting edit, render the markdown to HTML and set it as the initial content
    // The state `editPinnedContent` will now hold the HTML during editing.
    const initialHtml = DOMPurify.sanitize(marked.parse(String(item.content || '')));
    setEditPinnedContent(initialHtml);
    // Ensure it's expanded when editing
    setExpandedPinnedItems(prev => new Set(prev).add(item.id));
  };

  const handleCancelPinnedEdit = () => {
    setEditingPinnedItemId(null);
    setEditPinnedContent('');
  };

  const handleSavePinnedEdit = (id: string) => {
    // When saving, the `editPinnedContent` state already holds the HTML from the contenteditable div.
    // We save this HTML directly for the in-memory version.
    if (editPinnedContent.trim()) {
      // Note: For future Supabase integration, you might need to convert HTML back to Markdown here,
      // or store HTML in the database if your schema supports it.
      updatePinnedItem(id, editPinnedContent.trim());
      setEditingPinnedItemId(null);
      setEditPinnedContent('');
    }
  };

  const handleDeletePinnedItem = (id: string) => {
    removePinnedItem(id);
    // Also remove from expanded/editing state if it was there
    setExpandedPinnedItems(prev => { const next = new Set(prev); next.delete(id); return next; });
    if (editingPinnedItemId === id) {
      setEditingPinnedItemId(null);
      setEditPinnedContent('');
    }
  };

  // Handle input from the contenteditable div
  const handleContentEditableInput = useCallback(() => {
    if (contentEditableRef.current) {
      // Update the state with the current HTML content of the div
      setEditPinnedContent(contentEditableRef.current.innerHTML);
    }
  }, []);

  // Effect to focus the contenteditable div when entering edit mode
  useEffect(() => {
    if (editingPinnedItemId && contentEditableRef.current) {
      contentEditableRef.current.focus();
      // Place cursor at the end (optional, but good UX)
      const range = document.createRange();
      const selection = window.getSelection();
      if (selection) {
        range.selectNodeContents(contentEditableRef.current);
        range.collapse(false); // Collapse to the end
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [editingPinnedItemId]);
  // --- End Pinned Items Handlers ---


  if (pinnedItems.length === 0) {
    return (
      <div className="text-center p-4 flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No pinned conversations yet. Pin a message from the chat!</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <ul className="space-y-4">
        {pinnedItems.map(item => {
          // Check if this item should be expanded (either initially or via toggle)
          const isExpanded = expandedPinnedItems.has(item.id);
          const isEditing = editingPinnedItemId === item.id;
          // Extract the first line from the *original* content (which might be HTML after edit)
          const firstLineHtml = item.content.split('\n')[0];
          // Strip HTML tags for display in the collapsed view
          const firstLineText = stripHtmlTags(firstLineHtml);

          return (
            <li key={item.id} className="p-3 rounded-md bg-background border border-border shadow-sm">
              {isEditing ? (
                // --- Pinned Item Edit Mode (using contenteditable div) ---
                <div className="space-y-3">
                  <div
                    ref={contentEditableRef} // Attach ref
                    contentEditable={true} // Make it editable
                    // Set initial HTML content by rendering the current item's content
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(String(item.content || ''))) }}
                    onInput={handleContentEditableInput} // Capture input changes
                    className={cn(
                      "prose prose-sm max-w-none dark:prose-invert", // Apply prose styles
                      "min-h-[80px] p-3 rounded-md border border-border bg-background text-sm", // Add styling for the editable area
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" // Focus styles
                    )}
                    aria-label="Edit pinned item content"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelPinnedEdit}><XCircle className="mr-1 h-4 w-4" /> Cancel</Button>
                    <Button size="sm" onClick={() => handleSavePinnedEdit(item.id)}><Save className="mr-1 h-4 w-4" /> Save</Button>
                  </div>
                </div>
              ) : (
                // --- Pinned Item View Mode ---
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-grow min-w-0">
                    {/* Clickable area to expand/collapse */}
                    <button
                      onClick={() => togglePinnedItemExpansion(item.id)}
                      className="w-full text-left text-sm text-foreground/90 hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-700"
                      aria-expanded={isExpanded}
                      aria-controls={`pinned-content-${item.id}`}
                    >
                      {/* Display first line or full content */}
                      {isExpanded ? (
                        // Render full content as markdown when expanded
                        renderMarkdown(item.content)
                      ) : (
                        // Show only the first line as plain text when collapsed
                        <p className="truncate">{firstLineText}</p>
                      )}
                    </button>
                    {/* Timestamp and Expand/Collapse Icon */}
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                       {/* Display timestamp (optional formatting) */}
                       <span>Pinned: {format(parseISO(item.timestamp), 'MMM d, yyyy HH:mm')}</span>
                       {/* Toggle Icon */}
                       <span className="ml-auto">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                       </span>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-row items-center gap-0 flex-shrink-0 ml-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPinnedItem(item)} aria-label={`Edit pinned item: ${firstLineText}`} title={`Edit pinned item: ${firstLineText}`} className="text-muted-foreground hover:text-primary h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePinnedItem(item.id)} aria-label={`Delete pinned item: ${firstLineText}`} title={`Delete pinned item: ${firstLineText}`} className="text-muted-foreground hover:text-destructive h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MaximizedPinned;
