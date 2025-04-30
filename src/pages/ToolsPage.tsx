import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PenTool, Pin, ListChecks, MapPin, Maximize2, Minimize2, Lock, Calendar, Clock } from 'lucide-react';
import TodoList from '../components/tools/TodoList';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '@/types';
import { format, parseISO, isValid } from 'date-fns'; // Ensure isValid is imported
import { useActiveTasks } from '@/hooks/useActiveTasks';
import { cn } from '@/lib/utils'; // Import cn utility

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  contentPlaceholder: string;
  requiresAuth?: boolean;
  isNew?: boolean; // Added isNew property
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
    isNew: true, // Mark as New
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
    id: 'pinned',
    title: 'Pinned conversations',
    description: 'Quick access to important chats',
    icon: Pin,
    iconColor: 'text-green-600',
    contentPlaceholder: 'Pinned conversations feature coming soon',
    requiresAuth: true,
  },
  {
    id: 'journaling',
    title: 'Guided Journaling',
    description: 'Structured prompts to help you reflect',
    icon: PenTool,
    iconColor: 'text-blue-600',
    contentPlaceholder: 'Journaling prompts coming soon',
    requiresAuth: true,
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


const ToolsPage: React.FC = () => {
  const [maximizedCardId, setMaximizedCardId] = useState<string | null>(null);
  // State to hold the ID of the task to be edited, triggered from summary click
  const [editingTaskIdFromSummary, setEditingTaskIdFromSummary] = useState<string | null>(null);
  const { user } = useAuth();
  // Destructure the refetch function from the hook
  const { activeTasks, refetchActiveTasks } = useActiveTasks(user?.id);

  // Handle maximizing a card normally (e.g., clicking the maximize icon)
  const handleMaximize = (id: string, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      return;
    }
    setMaximizedCardId(id);
    // Reset editing task ID when maximizing normally
    setEditingTaskIdFromSummary(null);
  };

  // Handle minimizing any card
  const handleMinimize = () => {
    const previouslyMaximized = maximizedCardId; // Store the ID before clearing it
    setMaximizedCardId(null);
    // Reset editing task ID when minimizing
    setEditingTaskIdFromSummary(null);

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
    setMaximizedCardId('todo'); // Maximize the ToDo card
  };

  // Reset editingTaskIdFromSummary when the maximized card changes to something other than 'todo'
  // or when it's minimized completely.
  useEffect(() => {
    if (maximizedCardId !== 'todo') {
      setEditingTaskIdFromSummary(null);
    }
  }, [maximizedCardId]);


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

          return (
            <Card key={tool.id} className={isMaximized ? 'transition-all duration-300 ease-in-out' : ''}>
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
                    {isLocked && !isMaximized && <Lock className="h-4 w-4 ml-2 text-gray-400" title="Login required" />}
                  </CardTitle>
                  <CardDescription>
                    {tool.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  // Use handleMaximize when clicking the icon, handleMinimize if already maximized
                  onClick={() => isMaximized ? handleMinimize() : handleMaximize(tool.id, tool.requiresAuth)}
                  aria-label={isMaximized ? 'Minimize tool' : 'Maximize tool'}
                  disabled={isLocked && !isMaximized}
                  title={isLocked && !isMaximized ? "Login required to use this tool" : (isMaximized ? 'Minimize tool' : 'Maximize tool')}
                >
                  {isMaximized ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                     isLocked ? <Lock className="h-5 w-5 text-gray-400" /> : <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className={cn(
                "bg-gray-50 dark:bg-slate-900 rounded-b-lg", // Added dark mode background
                // Ensure minimized view has padding for the button clicks
                isMaximized ? 'min-h-[60vh] p-0' : 'h-48 p-4 overflow-y-auto'
              )}>
                {/* --- Conditional Rendering Logic --- */}
                {isMaximized ? (
                  // --- Maximized View ---
                  isTodoTool && user ? (
                    // Pass the editingTaskIdFromSummary to TodoList
                    <TodoList userId={user.id} initialEditingTaskId={editingTaskIdFromSummary} />
                  ) : isLocked ? (
                    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                      <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Please log in to use this tool.</p> {/* Dark mode text */}
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
