import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Trash2, Plus, Pencil, Save, XCircle, Calendar as CalendarIcon, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, compareDesc } from 'date-fns';
import { cn } from "@/lib/utils";
import { Task } from '@/types';

type FilterStatus = 'all' | 'active' | 'finished';

interface TodoListProps {
  userId: string;
}

// Helper function to get the most recent date (due or fix) for sorting
const getMostRecentDate = (task: Task): Date | null => {
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const fixDate = task.fixDate ? parseISO(task.fixDate) : null;

  if (dueDate && fixDate) {
    return compareDesc(dueDate, fixDate) < 0 ? fixDate : dueDate; // Return the later date
  }
  return dueDate || fixDate; // Return whichever one exists, or null
};

const TodoList: React.FC<TodoListProps> = ({ userId }) => {
  const storageKey = `companira-todo-${userId}`;
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined);
  const [editFixDate, setEditFixDate] = useState<Date | undefined>(undefined);
  const [editDueTime, setEditDueTime] = useState<string>('');
  const [editFixTime, setEditFixTime] = useState<string>('');
  const [editComment, setEditComment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set()); // State for expanded comments

  // Load tasks from localStorage
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(storageKey);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({ // Use 'any' temporarily for migration
          id: task.id ?? crypto.randomUUID(), // Ensure ID exists
          text: task.text,
          completed: task.completed,
          dueDate: task.dueDate,
          fixDate: task.fixDate,
          dueTime: task.dueTime,
          fixTime: task.fixTime,
          comment: task.comment ?? '', // Ensure comment is always a string
        }));
        setTasks(parsedTasks);
      }
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error);
      // Optionally clear corrupted storage
      // localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Save tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
    }
  }, [tasks, storageKey]);

  const handleAddTask = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (newTaskText.trim() === '') return;
    const newTask: Task = {
      id: crypto.randomUUID(), // Internal ID generated here
      text: newTaskText.trim(),
      completed: false,
      comment: '', // Initialize comment as empty string
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setNewTaskText('');
  }, [newTaskText]);

  const handleToggleTask = useCallback((id: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    setExpandedComments(prev => { // Remove from expanded set if deleted
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingTaskId === id) {
      setEditingTaskId(null);
    }
  }, [editingTaskId]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditText(task.text);
    setEditDueDate(task.dueDate ? parseISO(task.dueDate) : undefined);
    setEditFixDate(task.fixDate ? parseISO(task.fixDate) : undefined);
    setEditDueTime(task.dueTime ?? '');
    setEditFixTime(task.fixTime ?? '');
    setEditComment(task.comment ?? '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditText('');
    setEditDueDate(undefined);
    setEditFixDate(undefined);
    setEditDueTime('');
    setEditFixTime('');
    setEditComment('');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTaskId || editText.trim() === '') return;
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              text: editText.trim(),
              dueDate: editDueDate ? format(editDueDate, 'yyyy-MM-dd') : undefined,
              fixDate: editFixDate ? format(editFixDate, 'yyyy-MM-dd') : undefined,
              dueTime: editDueTime || undefined,
              fixTime: editFixTime || undefined,
              comment: editComment.trim() || '', // Ensure comment is saved as string
            }
          : task
      )
    );
    handleCancelEdit();
  }, [editingTaskId, editText, editDueDate, editFixDate, editDueTime, editFixTime, editComment, handleCancelEdit]);

  // Grouping, Sorting, and Filtering Logic
  const groupedAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      switch (filterStatus) {
        case 'active': return !task.completed;
        case 'finished': return task.completed;
        case 'all':
        default: return true;
      }
    });

    const tasksWithDates: Task[] = [];
    const tasksWithoutDates: Task[] = [];

    filtered.forEach(task => {
      if (task.dueDate || task.fixDate) {
        tasksWithDates.push(task);
      } else {
        tasksWithoutDates.push(task);
      }
    });

    // Sort tasks with dates by the most recent date (descending)
    tasksWithDates.sort((a, b) => {
      const dateA = getMostRecentDate(a);
      const dateB = getMostRecentDate(b);
      if (dateA && dateB) return compareDesc(dateA, dateB);
      if (dateA) return -1; // Tasks with dates come before those without (within this group, though shouldn't happen)
      if (dateB) return 1;
      return 0; // Should not happen if logic is correct
    });

    return { tasksWithDates, tasksWithoutDates };

  }, [tasks, filterStatus]);

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr);
      let formatted = format(date, 'PP'); // e.g., Oct 27, 2023
      if (timeStr) {
        formatted += ` ${timeStr}`;
      }
      return formatted;
    } catch (error) {
      console.error("Error formatting date:", dateStr, error);
      return "Invalid Date";
    }
  };

  const toggleCommentExpansion = (taskId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Helper function to render a list of tasks
  const renderTaskList = (taskList: Task[], title?: string) => (
    <>
      {title && taskList.length > 0 && <h3 className="text-sm font-semibold text-gray-500 mt-4 mb-2 px-1">{title}</h3>}
      <ul className="space-y-3">
        {taskList.map((task) => {
          const isCommentExpanded = expandedComments.has(task.id);
          return (
            <li
              key={task.id}
              className="p-3 rounded-md bg-background border border-border transition-colors hover:bg-accent"
            >
              {editingTaskId === task.id ? (
                /* Edit Mode (remains the same) */
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="text-base"
                    aria-label="Edit task text"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Due Date/Time */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-blue-600">Due Date & Time</Label>
                      <div className="flex gap-1 items-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn("flex-grow justify-start text-left font-normal", !editDueDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editDueDate ? format(editDueDate, "PPP") : <span>Pick date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={editDueDate} onSelect={setEditDueDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" value={editDueTime} onChange={(e) => setEditDueTime(e.target.value)} className="w-[90px]" aria-label="Due time" />
                        <Button variant="ghost" size="icon" onClick={() => { setEditDueDate(undefined); setEditDueTime(''); }} aria-label="Clear due date and time" className="text-muted-foreground hover:text-destructive h-9 w-9 p-0">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Fix Date/Time */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-green-600">Fix Date & Time</Label>
                      <div className="flex gap-1 items-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn("flex-grow justify-start text-left font-normal", !editFixDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editFixDate ? format(editFixDate, "PPP") : <span>Pick date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={editFixDate} onSelect={setEditFixDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" value={editFixTime} onChange={(e) => setEditFixTime(e.target.value)} className="w-[90px]" aria-label="Fix time" />
                        <Button variant="ghost" size="icon" onClick={() => { setEditFixDate(undefined); setEditFixTime(''); }} aria-label="Clear fix date and time" className="text-muted-foreground hover:text-destructive h-9 w-9 p-0">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Comment */}
                  <div>
                    <Label htmlFor={`comment-${task.id}`} className="text-xs font-semibold text-gray-600">Comment</Label>
                    <Textarea
                      id={`comment-${task.id}`}
                      placeholder="Add a comment..."
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="mt-1 min-h-[60px]"
                      aria-label="Edit task comment"
                    />
                  </div>
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <XCircle className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="mr-1 h-4 w-4" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3 flex-grow min-w-0"> {/* Added min-w-0 for flex shrink */}
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      aria-labelledby={`task-label-${task.id}`}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-grow space-y-1 min-w-0"> {/* Added min-w-0 */}
                      <Label
                        htmlFor={`task-${task.id}`}
                        id={`task-label-${task.id}`}
                        className={`block text-base break-words ${task.completed ? 'line-through text-gray-500' : ''}`}
                      >
                        {task.text}
                      </Label>
                      {/* Due Date */}
                      {task.dueDate && (
                        <div className="flex items-center text-xs text-blue-600">
                          <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="font-semibold mr-1">Due:</span>
                          <span>{formatDateTime(task.dueDate, task.dueTime)}</span>
                        </div>
                      )}
                      {/* Fix Date */}
                      {task.fixDate && (
                        <div className="flex items-center text-xs text-green-600">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="font-semibold mr-1">Fix:</span>
                          <span>{formatDateTime(task.fixDate, task.fixTime)}</span>
                        </div>
                      )}
                      {/* Comment Section */}
                      {task.comment && (
                        <div
                          className="flex items-start text-xs text-gray-500 mt-1 cursor-pointer group"
                          onClick={() => toggleCommentExpansion(task.id)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isCommentExpanded}
                          aria-controls={`comment-text-${task.id}`}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleCommentExpansion(task.id)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 group-hover:text-primary" />
                          <p
                            id={`comment-text-${task.id}`}
                            className={cn(
                              "whitespace-pre-wrap break-words", // Allow wrapping
                              !isCommentExpanded && "line-clamp-1" // Apply line clamp only if collapsed
                            )}
                          >
                            {task.comment}
                          </p>
                          {/* Optional: Add expand/collapse icon */}
                          {/* {isCommentExpanded ? <ChevronUp className="h-3 w-3 ml-1 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />} */}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Action Buttons Container */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 flex-shrink-0 ml-2"> {/* Added ml-2 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTask(task)}
                      aria-label={`Edit task: ${task.text}`}
                      title={`Edit task: ${task.text}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate('/')}
                      aria-label={`Go to chat regarding task: ${task.text}`}
                      title={`Go to chat regarding task: ${task.text}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                      aria-label={`Delete task: ${task.text}`}
                      title={`Delete task: ${task.text}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  const { tasksWithDates, tasksWithoutDates } = groupedAndSortedTasks;
  const noTasksMatchFilter = tasksWithDates.length === 0 && tasksWithoutDates.length === 0 && tasks.length > 0;
  const noTasksAtAll = tasks.length === 0;

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg text-center mb-2">My To-Do List</CardTitle>
        <div className="flex justify-center gap-2">
          {/* Filter Buttons (remain the same) */}
          <Button variant={filterStatus === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('all')}>All</Button>
          <Button variant={filterStatus === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('active')}>Active</Button>
          <Button variant={filterStatus === 'finished' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('finished')}>Finished</Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-y-auto">
        {/* Add Task Form (remains the same) */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-grow"
            aria-label="New task input"
          />
          <Button type="submit" size="icon" aria-label="Add task">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {/* Task List Rendering */}
        {noTasksAtAll && (
          <p className="text-center text-gray-500">No tasks yet. Add one above!</p>
        )}
        {noTasksMatchFilter && (
           <p className="text-center text-gray-500">
             {filterStatus === 'active' && 'No active tasks.'}
             {filterStatus === 'finished' && 'No finished tasks.'}
             {filterStatus !== 'all' && 'No tasks match the current filter.'}
           </p>
        )}

        {!noTasksAtAll && !noTasksMatchFilter && (
          <>
            {renderTaskList(tasksWithDates, tasksWithDates.length > 0 ? "Scheduled Tasks" : undefined)}
            {renderTaskList(tasksWithoutDates, tasksWithoutDates.length > 0 ? "Other Tasks" : undefined)}
          </>
        )}

      </CardContent>
    </Card>
  );
};

export default TodoList;
