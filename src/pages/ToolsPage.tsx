import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PenTool, Pin, ListChecks, MapPin, Maximize2, Minimize2, Lock, Calendar, Clock } from 'lucide-react';
import TodoList from '../components/tools/TodoList';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '@/types';
import { format, parseISO } from 'date-fns';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  contentPlaceholder: string;
  requiresAuth?: boolean;
}

const toolsData: Tool[] = [
  {
    id: 'journaling',
    title: 'Guided Journaling',
    description: 'Structured prompts to help you reflect',
    icon: PenTool,
    iconColor: 'text-blue-600',
    contentPlaceholder: 'Journaling prompts coming soon',
    requiresAuth: true,
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
    id: 'todo',
    title: 'To-Do-How-To',
    description: 'Manage tasks and get guidance',
    icon: ListChecks,
    iconColor: 'text-purple-600',
    contentPlaceholder: 'Expand to manage your To-Do list',
    requiresAuth: true,
  },
  {
    id: 'findHelp',
    title: 'Find support, activities in your area',
    description: 'Local resources and community connections',
    icon: MapPin,
    iconColor: 'text-red-600',
    contentPlaceholder: 'Local resource finder coming soon',
    requiresAuth: false,
  },
];

// Helper function to format date strings
const formatDate = (dateStr?: string | null) => { // Allow null
  if (!dateStr) return null;
  try {
    // Ensure the date string is valid before parsing
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return format(parseISO(dateStr), 'MMM d'); // e.g., Oct 27
    }
    return null; // Return null for invalid formats
  } catch (e) {
    console.error("Error parsing date:", dateStr, e);
    return null; // Handle parsing errors gracefully
  }
};


const ToolsPage: React.FC = () => {
  const [maximizedCardId, setMaximizedCardId] = useState<string | null>(null);
  const { user } = useAuth();
  const [activeTasks, setActiveTasks] = useState<Task[]>([]); // State for active tasks summary

  // Effect to load and filter active tasks for the summary view
  useEffect(() => {
    if (user && !maximizedCardId) { // Only load if user exists and no card is maximized
      const storageKey = `companira-todo-${user.id}`;
      try {
        const storedTasks = localStorage.getItem(storageKey);
        if (storedTasks) {
          const allTasks: Task[] = JSON.parse(storedTasks);
          const active = allTasks.filter(task => !task.completed);
          setActiveTasks(active);
        } else {
          setActiveTasks([]); // No tasks stored
        }
      } catch (error) {
        console.error("Error loading tasks from localStorage for summary:", error);
        setActiveTasks([]); // Reset on error
      }
    } else if (!user) {
      setActiveTasks([]); // Clear tasks if user logs out
    }
    // Rerun when user changes or when a card is minimized/maximized
  }, [user, maximizedCardId]);

  const handleMaximize = (id: string, requiresAuth?: boolean) => {
    if (requiresAuth && !user) {
      console.log("Login required to use this tool.");
      // Optionally, show a toast or message to the user
      return;
    }
    setMaximizedCardId(id);
  };

  const handleMinimize = () => {
    setMaximizedCardId(null);
  };

  const cardsToDisplay = maximizedCardId
    ? toolsData.filter(tool => tool.id === maximizedCardId)
    : toolsData;

  return (
    // Removed the h1 and p elements from here
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* The introductory text block has been removed */}

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
                    {isLocked && !isMaximized && <Lock className="h-4 w-4 ml-2 text-gray-400" title="Login required" />}
                  </CardTitle>
                  <CardDescription>
                    {tool.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
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
              <CardContent className={`bg-gray-50 rounded-b-lg ${isMaximized ? 'min-h-[60vh] p-0' : 'h-48 p-4 overflow-y-auto'}`}>
                {/* --- Conditional Rendering Logic --- */}
                {isMaximized ? (
                  // --- Maximized View ---
                  isTodoTool && user ? (
                    <TodoList userId={user.id} /> // Show full TodoList when maximized and logged in
                  ) : isLocked ? (
                    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
                      <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Please log in to use this tool.</p>
                    </div>
                  ) : (
                    <div className="text-center p-4 flex items-center justify-center h-full">
                      <p className="text-gray-500">{tool.contentPlaceholder} <span className="block mt-4 text-sm">(Full tool interface will appear here)</span></p>
                    </div>
                  )
                ) : (
                  // --- Minimized View ---
                  isLocked ? (
                    <div className="text-center p-4 flex items-center justify-center h-full">
                       <p className="text-gray-500">Login required to use this tool.</p>
                    </div>
                  ) : isTodoTool && user ? (
                     // --- ToDo Summary View (Minimized & Logged In) ---
                     activeTasks.length > 0 ? (
                       <div className="space-y-2">
                         <p className="text-sm font-medium text-gray-700 mb-2">Active Tasks:</p>
                         <ul className="space-y-1.5 text-sm">
                           {activeTasks.slice(0, 4).map(task => { // Limit displayed tasks for summary
                             const formattedDueDate = formatDate(task.dueDate);
                             const formattedFixDate = formatDate(task.fixDate);
                             return (
                               <li key={task.id} className="flex items-center justify-between text-gray-600">
                                 <span className="truncate pr-2 flex-1" title={task.text}>{task.text}</span>
                                 <div className="flex items-center space-x-2 flex-shrink-0">
                                   {formattedDueDate && (
                                     <span className="flex items-center text-blue-600 text-xs" title={`Due: ${formattedDueDate}`}>
                                       <Calendar className="h-3 w-3 mr-0.5" />
                                       {formattedDueDate}
                                     </span>
                                   )}
                                   {formattedFixDate && (
                                     <span className="flex items-center text-green-600 text-xs" title={`Fix: ${formattedFixDate}`}>
                                       <Clock className="h-3 w-3 mr-0.5" />
                                       {formattedFixDate}
                                     </span>
                                   )}
                                 </div>
                               </li>
                             );
                           })}
                           {activeTasks.length > 4 && (
                              <li className="text-xs text-gray-500 text-center pt-1">...and {activeTasks.length - 4} more</li>
                           )}
                         </ul>
                       </div>
                     ) : (
                       <div className="text-center p-4 flex items-center justify-center h-full">
                         <p className="text-gray-500">No active tasks. Expand to add some!</p>
                       </div>
                     )
                  ) : (
                     // --- Placeholder for other tools (Minimized & Not Locked) ---
                     <div className="text-center p-4 flex items-center justify-center h-full">
                       <p className="text-gray-500">{tool.contentPlaceholder}</p>
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
