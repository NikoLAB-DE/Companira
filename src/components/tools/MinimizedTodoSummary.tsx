import React from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

// Helper function to format date strings (copied from ToolsPage)
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


interface MinimizedTodoSummaryProps {
  user: ReturnType<typeof useAuth>['user'];
  activeTasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const MinimizedTodoSummary: React.FC<MinimizedTodoSummaryProps> = ({ user, activeTasks, onTaskClick }) => {
  if (!user) {
    // This component should only be rendered if user exists, but as a safeguard:
    return null;
  }

  if (activeTasks.length === 0) {
    return (
      <div className="text-center p-4 flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No active tasks. Expand to add some!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Tasks:</p>
      <ul className="space-y-1.5 text-sm">
        {activeTasks.slice(0, 4).map(task => {
          const formattedDueDate = formatDate(task.dueDate);
          const formattedFixDate = formatDate(task.fixDate);
          return (
            <li key={task.id}>
              <button
                onClick={() => onTaskClick(task.id)}
                className="flex items-center justify-between text-gray-600 dark:text-gray-400 w-full text-left hover:bg-gray-100 dark:hover:bg-slate-800 p-1 rounded transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-700"
                aria-label={`Edit task: ${task.text}`}
                title={`Click to edit: ${task.text}`}
              >
                <span className="truncate pr-2 flex-1" title={task.text}>{task.text}</span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {formattedDueDate && (
                    <span className="flex items-center text-blue-600 dark:text-blue-400 text-xs" title={`Due: ${formattedDueDate}`}>
                      <Clock className="h-3 w-3 mr-0.5" />
                      {formattedDueDate}
                    </span>
                  )}
                  {formattedFixDate && (
                    <span className="flex items-center text-green-600 dark:text-green-400 text-xs" title={`Fix: ${formattedFixDate}`}>
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
            ...and {activeTasks.length - 4} more
          </li>
        )}
      </ul>
    </div>
  );
};

export default MinimizedTodoSummary;
