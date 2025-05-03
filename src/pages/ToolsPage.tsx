import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PenTool, Pin, ListChecks, MapPin, Maximize2, Minimize2, Lock, Calendar, Clock, ChevronDown, ChevronUp, Pencil, Trash2, Save, XCircle } from 'lucide-react'; // Added icons for pinned items
import TodoList from '../components/tools/TodoList';
import { useAuth } from '../contexts/AuthContext';
import { Task, PinnedItem } from '@/types'; // Import PinnedItem type
import { format, parseISO, isValid } from 'date-fns'; // Ensure isValid is imported
import { useActiveTasks } from '@/hooks/useActiveTasks';
import { cn } from '@/lib/utils'; // Import cn utility
import { usePinnedItems } from '@/contexts/PinnedItemsContext'; // Import usePinnedItems
import { marked } from 'marked'; // Import marked for rendering pinned content
import DOMPurify from 'dompurify'; // Import DOMPurify
// Removed Textarea import as we're using contenteditable div

// Configure marked (same as in ChatMessage)
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  contentPlaceholder: string;
  requiresAuth?: boolean;
  isNew?: boolean; // Added isNew property
  disabled?: boolean; // Added disabled property
}

// Reordered toolsData array
const toolsData: Tool[] = [
  {
    id: 'todo',
    title: 'To-Do-How-To',
    description: 'Manage tasks and get guidance',
    icon: ListChecks,
    iconColor: 'text-purple-600',
    contentPlaceholder: 'Expand to manage your To-Do list',
    requiresAuth: true,
    isNew: true,
  },
  {
    id: 'pinned',
    title: 'Pinned conversations',
    description: 'Quick access to important chats',
    icon: Pin,
    iconColor: 'text-green-600',
    contentPlaceholder: 'Pinned conversations feature coming soon', // This will be replaced by actual content
    requiresAuth: true,
    isNew: true,
  },
  {
    id: 'findHelp',
    title: 'Find what you need',
    description:'Local resources, current events, latest news, opening hours',
    icon: MapPin,
    iconColor: 'text-red-600',
    contentPlaceholder: 'Local resource finder coming soon',
    requiresAuth: false,
  },
  {
    id: 'journaling',
    title: 'Guided Journaling',
    description: 'Structured prompts to help you reflect',
    icon: PenTool,
    iconColor: 'text-blue-600',
    contentPlaceholder: 'Journaling prompts coming soon',
    requiresAuth: true,
    disabled: true, // Disabled
  },
];

// Helper function to format date strings
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    // Check if it's a valid ISO date string (YYYY-MM-DD) before parsing
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
       const parsedDate = parseISO(dateStr);
       if (isValid(parsedDate)) { // Check if parsing was successful
         return format(parsedDate, 'MMM d');
       }
    }
    // Attempt parsing anyway for other valid formats parseISO might handle
    const parsedDate = parseISO(dateStr);
    if (isValid(parsedDate)) {
        return format(parsedDate, 'MMM d');
    }

    return null; // Return null if format is unexpected or invalid
  } catch (e) {
    console.warn("Error formatting date:", dateStr, e); // Log warning for debugging
    return null;
  }
};

// Helper function to render markdown safely (reused from ChatMessage)
const renderMarkdown = (markdown: string) => {
  if (!markdown) return null;
  // Use marked to convert markdown to HTML, then sanitize
  const rawMarkup = marked.parse(String(markdown));
  const sanitizedMarkup = DOMPurify.sanitize(rawMarkup, { USE_PROFILES: { html: true } });
  return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
};

// Helper function to strip HTML tags from a string
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch (e) {
    console.error("Error stripping HTML tags:", e);
    return html; // Return original string on error
  }
};


const ToolsPage: React.FC = () => {
  const [maximizedCardId, setMaximizedCardId] = useState<string | null>(null);
  // State to hold the ID of the task to be edited, triggered from summary click
  const [editingTaskIdFromSummary, setEditingTaskIdFromSummary] = useState<string | null>(null);
  // State to hold the ID of the pinned item to be initially expanded, triggered from summary click
  const [initialPinnedItemId, setInitialPinnedItemId] = useState<string | null>(null);

  const { user } = useAuth();
  // Destructure the refetch function from the hook
  const { activeTasks, refetchActiveTasks } = useActiveTasks(user?.id);
  // Get pinned items and management functions from context
  const { pinnedItems, removePinnedItem, updatePinnedItem } = usePinnedItems();

  // State for managing expanded/editing state of individual pinned items
  const [expandedPinnedItems, setExpandedPinnedItems] = useState<Set<string>>(new Set());
  const [editingPinnedItemId, setEditingPinnedItemId] = useState<string | null>(null);
  // State to hold the content being edited (will be HTML from contenteditable)
  const [editPinnedContent, setEditPinnedContent] = useState('');
  // Ref for the contenteditable div
  const contentEditableRef = useRef<HTMLDivElement>(null);


  // Handle maximizing a card normally (e.g., clicking the maximize icon)
  // Added optional initialPinnedItemId parameter
  const handleMaximize = (tool: Tool, initialPinnedItemId?: string | null) => {
    if (tool.requiresAuth && !user) {
      return;
    }
    if (tool.disabled) { // Prevent maximizing if disabled
      return;
    }
    setMaximizedCardId(tool.id);
    // Reset editing task ID when maximizing normally or for a different card```typescript
    if (tool.id !== 'todo') {
      setEditingTaskIdFromSummary(null);
    }
    // Reset pinned item editing/expansion when maximizing a different card
    if (tool.id !== 'pinned') {
       setEditingPinnedItemId(null);
       setExpandedPinnedItems(new Set());
       setInitialPinnedItemId(null); // Also reset initial pinned item ID
    } else {
       // If maximizing the pinned card, set the initial pinned item ID if provided
       setInitialPinnedItemId(initialPinnedItemId || null);
    }
  };

  // Handle minimizing any card
  const handleMinimize = () => {
    const previouslyMaximized = maximizedCardId; // Store the ID before clearing it
    setMaximizedCardId(null);
    // Reset editing task ID when minimizing
    setEditingTaskIdFromSummary(null);
    // Reset pinned item editing/expansion when minimizing
    setEditingPinnedItemId(null);
    setExpandedPinnedItems(new Set());
    setInitialPinnedItemId(null); // Reset initial pinned item ID

    // If the 'todo' card was the one being minimized, refetch the tasks
    if (previouslyMaximized === 'todo') {
      console.log("[ToolsPage] Minimizing Todo card, calling refetchActiveTasks..."); // Debug log
      refetchActiveTasks();
    }
  };

  // Handle clicking a task in the summary view
  const handleSummaryTaskClick = (taskId: string) => {
    if (!user) return; // Should not happen if tasks are shown, but good practice
    console.log("Summary task clicked, setting edit ID:", taskId); // Added log
    setEditingTaskIdFromSummary(taskId); // Set the ID of the task to edit
    // Find the todo tool data to pass to handleMaximize
    const todoTool = toolsData.find(t => t.id === 'todo');
    if (todoTool) {
      handleMaximize(todoTool, true); // Maximize the ToDo card
    }
  };

  // Handle clicking a pinned item in the summary view
  const handleSummaryPinnedItemClick = (itemId: string) => {
     if (!user) return; // Should not happen if pinned items are shown, but good practice
     console.log("Summary pinned item clicked, setting initial expanded ID:", itemId); // Added log
     // Find the pinned tool data to pass to handleMaximize
     const pinnedTool = toolsData.find(t => t.id === 'pinned');
     if (pinnedTool) {
       handleMaximize(pinnedTool, itemId); // Maximize the Pinned card and pass the item ID
     }
  };


  // Reset editingTaskIdFromSummary when the maximized card changes to something other than 'todo'
  // or when it's minimized completely.
  useEffect(() => {
    if (maximizedCardId !== 'todo') {
      setEditingTaskIdFromSummary(null);
    }
  }, [maximizedCardId]);

  // Effect to handle initial pinned item expansion when the pinned card is maximized
  useEffect(() => {
    if (maximizedCardId === 'pinned' && initialPinnedItemId) {
      console.log("[ToolsPage] Pinned card maximized with initialPinnedItemId:", initialPinnedItemId); // Debug log
      // Add the initial pinned item ID to the expanded set
      setExpandedPinnedItems(prev => new Set(prev).add(initialPinnedItemId));
      // Optionally, clear initialPinnedItemId after it's used
      // setInitialPinnedItemId(null); // Decide if you want it to only expand once
    }
  }, [maximizedCardId, initialPinnedItemId]);


  // --- Pinned Items Handlers ---
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


  const cardsToDisplay = maximizedCardId
    ? toolsData.filter(tool => tool.id === maximizedCardId)
    : toolsData;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className={`grid gap-6 ${maximizedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {cardsToDisplay.map((tool) => {
          const isMaximized = maximizedCardId === tool.id;
          const isLocked = tool.requiresAuth && !user;
          const isTodoTool = tool.id === 'todo';
          const isPinnedTool = tool.id === 'pinned';
          const isToolDisabled = tool.disabled; // Check if the tool is disabled

          return (
            <Card key={tool.id} className={cn(isMaximized ? 'transition-all duration-300 ease-in-out' : '', isToolDisabled && 'opacity-70 cursor-not-allowed', 'overflow-hidden')}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center mb-1">
                    <tool.icon className={`h-5 w-5 mr-2 ${tool.iconColor}`} />
                    {tool.title}
                    {/* Add New Badge */}
                    {tool.isNew && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        New
                      </span>
                    )}
                    {/* Add Disabled/WIP Badge */}
                    {isToolDisabled && (
                       <span className="ml-2 inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-0.5 text-xs font-medium text-yellow-600 ring-1 ring-inset ring-yellow-500/20 dark:text-yellow-400 dark:ring-yellow-400/30">
                         WIP
                       </span>
                    )}
                    {isLocked && !isMaximized && !isToolDisabled && <Lock className="h-4 w-4 ml-2 text-gray-400" title="Login required" />}
                  </CardTitle>
                  <CardDescription>
                    {tool.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  // Use handleMaximize when clicking the icon, handleMinimize if already maximized
                  onClick={() => isMaximized ? handleMinimize() : handleMaximize(tool)} // Pass tool data to handleMaximize
                  aria-label={isMaximized ? 'Minimize tool' : 'Maximize tool'}
                  title={isMaximized ? 'Minimize tool' : (isToolDisabled ? 'Feature under development' : (isLocked ? "Login required to use this tool" : 'Maximize tool'))}
                  disabled={isLocked || isToolDisabled} // Disable maximize button if locked or disabled
                >
                  {isMaximized ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                     isLocked || isToolDisabled ? <Lock className="h-5 w-5 text-gray-400" /> : <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className={cn(
                "bg-gray-50 dark:bg-slate-900 rounded-b-lg", // Added dark mode background
                // Ensure minimized view has padding for the button clicks
                isMaximized ? 'min-h-[60vh] p-0' : 'h-48 p-4 overflow-y-auto',
                isToolDisabled && !isMaximized && 'flex items-center justify-center' // Center content for disabled minimized cards
              )}>
                {/* --- Conditional Rendering Logic --- */}
                {isMaximized ? (
                  // --- Maximized View ---
                  isTodoTool && user ? (
                    // Pass the editingTaskIdFromSummary to TodoList
                    <TodoList userId={user.id} initialEditingTaskId={editingTaskIdFromSummary} />
                  ) : isPinnedTool && user ? (
                    // --- Pinned Items Full View (Maximized & Logged In) ---
                    <div className="p-4 h-full overflow-y-auto">
                      {pinnedItems.length > 0 ? (
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
                      ) : (
                        <div className="text-center p-4 flex items-center justify-center h-full">
                          <p className="text-gray-500 dark:text-gray-400">No pinned conversations yet. Pin a message from the chat!</p>
                        </div>
                      )}
                    </div>
                  ) : isLocked ? (
                    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                      <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Please log in to use this tool.</p> {/* Dark mode text */}
                    </div>
                  ) : isToolDisabled ? ( // Handle disabled maximized state
                     <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                       <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                       <p className="text-gray-500 dark:text-gray-400">This feature is currently under development.</p>
                       <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{tool.contentPlaceholder}</p>
                     </div>
                  ) : (
                    <div className="text-center p-4 flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">{tool.contentPlaceholder} <span className="block mt-4 text-sm">(Full tool interface will appear here)</span></p> {/* Dark mode text */}
                    </div>
                  )
                ) : (
                  // --- Minimized View ---
                  isLocked ? (
                    <div className="text-center p-4 flex items-center justify-center h-full">
                       <p className="text-gray-500 dark:text-gray-400">Login required to use this tool.</p> {/* Dark mode text */}
                    </div>
                  ) : isToolDisabled ? ( // Handle disabled minimized state
                     <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                       <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                       <p className="text-gray-500 dark:text-gray-400">Under Development</p>
                     </div>
                  ) : isTodoTool && user ? (
                     // --- ToDo Summary View (Minimized & Logged In) ---
                     activeTasks.length > 0 ? (
                       <div className="space-y-2">
                         <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Tasks:</p> {/* Dark mode text */}
                         <ul className="space-y-1.5 text-sm">
                           {activeTasks.slice(0, 4).map(task => {
                             const formattedDueDate = formatDate(task.dueDate);
                             const formattedFixDate = formatDate(task.fixDate);
                             return (
                               // Make the list item clickable via a button
                               <li key={task.id} >
                                 <button
                                    onClick={() => handleSummaryTaskClick(task.id)} // Call handler on click
                                    className="flex items-center justify-between text-gray-600 dark:text-gray-400 w-full text-left hover:bg-gray-100 dark:hover:bg-slate-800 p-1 rounded transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-700" // Dark mode styles
                                    aria-label={`Edit task: ${task.text}`}
                                    title={`Click to edit: ${task.text}`}
                                  >
                                   <span className="truncate pr-2 flex-1" title={task.text}>{task.text}</span>
                                   <div className="flex items-center space-x-2 flex-shrink-0">
                                     {formattedDueDate && (
                                       <span className="flex items-center text-blue-600 dark:text-blue-400 text-xs" title={`Due: ${formattedDueDate}`}> {/* Dark mode text */}
                                         <Clock className="h-3 w-3 mr-0.5" /> {/* Changed from Calendar */}
                                         {formattedDueDate}
                                       </span>
                                     )}
                                     {formattedFixDate && (
                                       <span className="flex items-center text-green-600 dark:text-green-400 text-xs" title={`Fix: ${formattedFixDate}`}> {/* Dark mode text */}
                                         <Clock className="h-3 w-3 mr-0.5" />
                                         {formattedFixDate}
                                       </span>
                                     )}
                                   </div>
                                 </button>
                               </li>
                             );
                           })}
                           {activeTasks.length > 4 && (
                              <li className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                                ...and {activeTasks.length - 4} more {/* Dark mode text */}
                              </li>
                           )}
                         </ul>
                       </div>
                     ) : (
                       <div className="text-center p-4 flex items-center justify-center h-full">
                         <p className="text-gray-500 dark:text-gray-400">No active tasks. Expand to add some!</p> {/* Dark mode text */}
                       </div>
                     )
                  ) : isPinnedTool && user ? (
                     // --- Pinned Items Summary View (Minimized & Logged In) ---
                     pinnedItems.length > 0 ? (
                       <div className="space-y-2">
                         <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pinned Conversations:</p> {/* Added title */}
                         <ul className="space-y-1.5 text-sm">
                           {/* Limit to first 4 items for summary view */}
                           {pinnedItems.slice(0, 4).map(item => {
                             // Extract the first line for the summary view
                             const firstLineHtml = item.content.split('\n')[0];
                             const firstLineText = stripHtmlTags(firstLineHtml);

                             return (
                               <li key={item.id}>
                                 <button
                                    onClick={() => handleSummaryPinnedItemClick(item.id)} // Call handler on click
                                    className="flex items-center justify-between text-gray-600 dark:text-gray-400 w-full text-left hover:bg-gray-100 dark:hover:bg-slate-800 p-1 rounded transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-700" // Dark mode styles
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
                                ...and {pinnedItems.length - 4} more {/* Dark mode text */}
                              </li>
                           )}
                         </ul>
                       </div>
                     ) : (
                       <div className="text-center p-4 flex items-center justify-center h-full">
                         <p className="text-gray-500 dark:text-gray-400">No pinned conversations yet. Pin a message from the chat!</p>
                       </div>
                     )
                  ) : (
                     <div className="text-center p-4 flex items-center justify-center h-full">
                       <p className="text-gray-500 dark:text-gray-400">{tool.contentPlaceholder}</p> {/* Dark mode text */}
                     </div>
                  )
                )}
                {/* --- End Conditional Rendering --- */}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsPage;
