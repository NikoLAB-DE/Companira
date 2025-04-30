import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
// Removed CalendarIcon import
import { Trash2, Plus, Pencil, Save, XCircle, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
// Removed Popover imports
import { format, parseISO, compareDesc, isValid, parse } from 'date-fns';
import { cn } from "@/lib/utils";
import { Task } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

type FilterStatus = 'active' | 'finished' | 'all';

interface TodoListProps {
  userId: string;
  initialEditingTaskId?: string | null; // Added prop to receive initial edit state
}

const getMostRecentDate = (task: Task): Date | null => {
  const dueDate = task.dueDate && isValid(parseISO(task.dueDate)) ? parseISO(task.dueDate) : null;
  const fixDate = task.fixDate && isValid(parseISO(task.fixDate)) ? parseISO(task.fixDate) : null;
  if (dueDate && fixDate) return compareDesc(dueDate, fixDate) < 0 ? fixDate : dueDate;
  return dueDate || fixDate;
};

// Helper to format Date to 'yyyy-MM-dd' string for input[type=date]
const formatDateForInput = (date: Date | undefined): string => {
  if (!date || !isValid(date)) return '';
  try {
    return format(date, 'yyyy-MM-dd');
  } catch {
    return ''; // Handle potential formatting errors
  }
};

// Helper to parse 'yyyy-MM-dd' string from input[type=date] to Date
const parseDateFromInput = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  try {
    // Use parse with explicit format for robustness
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : undefined;
  } catch {
    return undefined; // Handle potential parsing errors
  }
};


const formatDateForSupabase = (date: Date | undefined): string | null => {
  if (!date || !isValid(date)) return null;
  return format(date, 'yyyy-MM-dd');
};

const formatTimeForSupabase = (time: string | undefined): string | null => {
  if (!time || typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return null;
  return time;
};

const TodoList: React.FC<TodoListProps> = ({ userId, initialEditingTaskId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined);
  const [editFixDate, setEditFixDate] = useState<Date | undefined>(undefined);
  const [editDueTime, setEditDueTime] = useState<string>('');
  const [editFixTime, setEditFixTime] = useState<string>('');
  const [editComment, setEditComment] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('To_Do')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        toast({ title: "Error", description: `Failed to load tasks: ${error.message}`, variant: "destructive" });
        setTasks([]);
      } else {
        const fetchedTasks: Task[] = data.map((task: any) => ({
          id: task.id,
          text: task.text,
          completed: task.completed,
          dueDate: task.due_date || undefined,
          fixDate: task.fix_date || undefined,
          dueTime: task.due_time || undefined,
          fixTime: task.fix_time || undefined,
          comment: task.comment || '',
        }));
        setTasks(fetchedTasks);
      }
    } catch (err) {
      console.error("Unexpected error fetching tasks:", err);
      toast({ title: "Error", description: "An unexpected error occurred while loading tasks.", variant: "destructive" });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Effect to handle initial editing state passed from parent
  useEffect(() => {
    if (initialEditingTaskId && tasks.length > 0 && !editingTaskId) { // Only trigger if not already editing
      const taskToEdit = tasks.find(task => task.id === initialEditingTaskId);
      if (taskToEdit) {
        console.log("TodoList received initialEditingTaskId:", initialEditingTaskId, "Found task:", taskToEdit); // Added log
        handleEditTask(taskToEdit);
      } else {
         console.log("TodoList received initialEditingTaskId:", initialEditingTaskId, "but task not found yet."); // Added log
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditingTaskId, tasks]); // Depend on tasks to ensure task exists


  const handleAddTask = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (newTaskText.trim() === '' || !userId) return;
    const newTaskPayload = { user_id: userId, text: newTaskText.trim(), completed: false, comment: '' };
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticTask: Task = { id: tempId, text: newTaskPayload.text, completed: newTaskPayload.completed, comment: newTaskPayload.comment };
    setTasks((prevTasks) => [optimisticTask, ...prevTasks]);
    setNewTaskText('');
    try {
      const { data, error } = await supabase.from('To_Do').insert(newTaskPayload).select().single();
      if (error) {
        console.error('Error adding task:', error);
        toast({ title: "Error", description: `Failed to add task: ${error.message}`, variant: "destructive" });
        setTasks((prevTasks) => prevTasks.filter(task => task.id !== tempId));
        setNewTaskText(newTaskPayload.text);
        return;
      }
      if (data) {
        const addedTask: Task = {
          id: data.id, text: data.text, completed: data.completed,
          dueDate: data.due_date || undefined, fixDate: data.fix_date || undefined,
          dueTime: data.due_time || undefined, fixTime: data.fix_time || undefined,
          comment: data.comment || '',
        };
        setTasks((prevTasks) => prevTasks.map(task => task.id === tempId ? addedTask : task));
        toast({ title: "Success", description: "Task added." });
      } else {
        fetchTasks(); // Refetch if insert didn't return data for some reason
      }
    } catch (err) {
      console.error("Unexpected error adding task:", err);
      toast({ title: "Error", description: "An unexpected error occurred while adding the task.", variant: "destructive" });
      setTasks((prevTasks) => prevTasks.filter(task => task.id !== tempId));
      setNewTaskText(newTaskPayload.text);
    }
  }, [newTaskText, userId, toast, fetchTasks]);

  const handleToggleTask = useCallback(async (id: string) => {
    const taskToToggle = tasks.find((task) => task.id === id);
    if (!taskToToggle || id.startsWith('temp-')) return;
    const newCompletedStatus = !taskToToggle.completed;
    setTasks((prevTasks) => prevTasks.map((task) => task.id === id ? { ...task, completed: newCompletedStatus } : task));
    try {
      const { error } = await supabase.from('To_Do').update({ completed: newCompletedStatus, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
      if (error) {
        console.error('Error toggling task:', error);
        toast({ title: "Error", description: `Failed to update task status: ${error.message}`, variant: "destructive" });
        setTasks((prevTasks) => prevTasks.map((task) => task.id === id ? { ...task, completed: !newCompletedStatus } : task));
      }
    } catch (err) {
      console.error("Unexpected error toggling task:", err);
      toast({ title: "Error", description: "An unexpected error occurred while updating task status.", variant: "destructive" });
      setTasks((prevTasks) => prevTasks.map((task) => task.id === id ? { ...task, completed: !newCompletedStatus } : task));
    }
  }, [tasks, userId, toast]);

  const handleEditTask = useCallback((task: Task) => {
    if (task.id.startsWith('temp-')) {
      toast({ title: "Info", description: "Cannot edit an unsaved task." });
      return;
    }
    console.log("Setting edit state for task:", task.id); // Added log
    setEditingTaskId(task.id);
    setEditText(task.text);
    // Parse existing date strings (YYYY-MM-DD) into Date objects for state
    setEditDueDate(task.dueDate ? parseDateFromInput(task.dueDate) : undefined);
    setEditFixDate(task.fixDate ? parseDateFromInput(task.fixDate) : undefined);
    setEditDueTime(task.dueTime ?? '');
    setEditFixTime(task.fixTime ?? '');
    setEditComment(task.comment ?? '');
  }, [toast]);


  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null); setEditText(''); setEditDueDate(undefined); setEditFixDate(undefined);
    setEditDueTime(''); setEditFixTime(''); setEditComment('');
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (!taskToDelete) return;
    const originalTasks = tasks;
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    setExpandedComments(prev => { const next = new Set(prev); next.delete(id); return next; });
    if (editingTaskId === id) handleCancelEdit();
    if (id.startsWith('temp-')) {
      toast({ title: "Info", description: "Unsaved task removed." });
      return;
    }
    try {
      const { error } = await supabase.from('To_Do').delete().eq('id', id).eq('user_id', userId);
      if (error) {
        console.error('Error deleting task:', error);
        toast({ title: "Error", description: `Failed to delete task: ${error.message}`, variant: "destructive" });
        setTasks(originalTasks);
      } else {
        toast({ title: "Success", description: "Task deleted." });
      }
    } catch (err) {
      console.error("Unexpected error deleting task:", err);
      toast({ title: "Error", description: "An unexpected error occurred while deleting the task.", variant: "destructive" });
      setTasks(originalTasks);
    }
  }, [tasks, userId, toast, editingTaskId, handleCancelEdit]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingTaskId || editText.trim() === '' || !userId || editingTaskId.startsWith('temp-')) return;
    const originalTask = tasks.find(task => task.id === editingTaskId);
    if (!originalTask) return;

    // Format Date objects from state back to 'yyyy-MM-dd' strings for Supabase
    const formattedDueDate = formatDateForSupabase(editDueDate);
    const formattedFixDate = formatDateForSupabase(editFixDate);
    const formattedDueTime = formatTimeForSupabase(editDueTime);
    const formattedFixTime = formatTimeForSupabase(editFixTime);

    const updatedFields = {
      text: editText.trim(),
      due_date: formattedDueDate,
      fix_date: formattedFixDate,
      due_time: formattedDueTime,
      fix_time: formattedFixTime,
      comment: editComment.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const updatedTaskData: Task = {
      ...originalTask,
      text: updatedFields.text,
      // Use the formatted strings for optimistic update to match DB format
      dueDate: updatedFields.due_date ?? undefined,
      fixDate: updatedFields.fix_date ?? undefined,
      dueTime: updatedFields.due_time ?? undefined,
      fixTime: updatedFields.fix_time ?? undefined,
      comment: updatedFields.comment ?? '',
    };

    setTasks(prevTasks => prevTasks.map(task => task.id === editingTaskId ? updatedTaskData : task));
    handleCancelEdit(); // Close edit mode optimistically

    try {
      const { error } = await supabase.from('To_Do').update(updatedFields).eq('id', editingTaskId).eq('user_id', userId);
      if (error) {
        console.error('Error saving task edits:', error);
        toast({ title: "Error", description: `Failed to save changes: ${error.message}`, variant: "destructive" });
        // Revert optimistic update on error
        setTasks(prevTasks => prevTasks.map(task => task.id === editingTaskId ? originalTask : task));
      } else {
        toast({ title: "Success", description: "Task updated." });
        // Optional: Refetch to ensure consistency, though optimistic update should be fine
        // fetchTasks();
      }
    } catch (err) {
      console.error("Unexpected error saving task edits:", err);
      toast({ title: "Error", description: "An unexpected error occurred while saving changes.", variant: "destructive" });
      // Revert optimistic update on error
      setTasks(prevTasks => prevTasks.map(task => task.id === editingTaskId ? originalTask : task));
    }
  }, [editingTaskId, editText, editDueDate, editFixDate, editDueTime, editFixTime, editComment, userId, tasks, toast, handleCancelEdit]);


  const groupedAndSortedTasks = useMemo(() => {
    const validTasks = tasks.filter(task => !task.id.startsWith('temp-') || tasks.find(t => t.id === task.id)); // Ensure temp tasks are included if still present
    const filtered = validTasks.filter(task => {
      switch (filterStatus) {
        case 'active': return !task.completed;
        case 'finished': return task.completed;
        default: return true;
      }
    });
    const tasksWithDates: Task[] = []; const tasksWithoutDates: Task[] = [];
    filtered.forEach(task => { (task.dueDate || task.fixDate) ? tasksWithDates.push(task) : tasksWithoutDates.push(task); });
    tasksWithDates.sort((a, b) => {
      const dateA = getMostRecentDate(a); const dateB = getMostRecentDate(b);
      if (dateA && dateB) return compareDesc(dateA, dateB); if (dateA) return -1; if (dateB) return 1; return 0;
    });
    tasksWithoutDates.sort((a, b) => a.text.localeCompare(b.text)); // Keep sorting others by text
    return { tasksWithDates, tasksWithoutDates };
  }, [tasks, filterStatus]);

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr); // Dates from DB are ISO strings (YYYY-MM-DD)
      if (!isValid(date)) return "Invalid Date";
      let formatted = format(date, 'PP'); // Format as 'MMM d, yyyy'
      if (timeStr) {
        const timeMatch = timeStr.match(/^(\d{2}:\d{2})/);
        if (timeMatch) formatted += ` ${timeMatch[1]}`;
      }
      return formatted;
    } catch (error) {
      console.error("Error formatting date/time:", dateStr, timeStr, error);
      return "Invalid Date";
    }
  };

  const toggleCommentExpansion = (taskId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const renderTaskList = (taskList: Task[], title?: string) => (
    <>
      {title && taskList.length > 0 && <h3 className="text-sm font-semibold text-gray-500 mt-4 mb-2 px-1">{title}</h3>}
      <ul className="space-y-3">
        {taskList.map((task) => {
          const isCommentExpanded = expandedComments.has(task.id);
          const isTemporary = task.id.startsWith('temp-');
          return (
            <li key={task.id} className={cn("p-3 rounded-md bg-background border border-border transition-colors hover:bg-accent", isTemporary && "opacity-60 pointer-events-none")}>
              {editingTaskId === task.id ? (
                // --- Edit Mode ---
                <div className="space-y-3">
                  <Input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="text-sm" aria-label="Edit task text" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Due Date/Time */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-blue-600">Due Date & Time</Label>
                      <div className="flex gap-1 items-center">
                        {/* Date Input */}
                        <Input
                          type="date"
                          value={formatDateForInput(editDueDate)} // Format Date to 'yyyy-MM-dd'
                          onChange={(e) => setEditDueDate(parseDateFromInput(e.target.value))} // Parse 'yyyy-MM-dd' to Date
                          className="flex-grow h-9 text-xs"
                          aria-label="Due date"
                        />
                        {/* Time Input */}
                        <Input
                          type="time"
                          value={editDueTime}
                          onChange={(e) => setEditDueTime(e.target.value)}
                          className="w-[80px] h-9 text-xs"
                          aria-label="Due time"
                        />
                        {/* Removed Clear Button */}
                      </div>
                    </div>
                    {/* Fix Date/Time */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-green-600">Fix Date & Time</Label>
                      <div className="flex gap-1 items-center">
                        {/* Date Input */}
                        <Input
                          type="date"
                          value={formatDateForInput(editFixDate)} // Format Date to 'yyyy-MM-dd'
                          onChange={(e) => setEditFixDate(parseDateFromInput(e.target.value))} // Parse 'yyyy-MM-dd' to Date
                          className="flex-grow h-9 text-xs"
                          aria-label="Fix date"
                        />
                        {/* Time Input */}
                        <Input
                          type="time"
                          value={editFixTime}
                          onChange={(e) => setEditFixTime(e.target.value)}
                          className="w-[80px] h-9 text-xs"
                          aria-label="Fix time"
                        />
                         {/* Removed Clear Button */}
                      </div>
                    </div>
                  </div>
                  {/* Comment */}
                  <div>
                    <Label htmlFor={`comment-${task.id}`} className="text-xs font-semibold text-gray-600">Comment</Label>
                    <Textarea id={`comment-${task.id}`} placeholder="Add a comment..." value={editComment} onChange={(e) => setEditComment(e.target.value)} className="mt-1 min-h-[60px] text-sm" aria-label="Edit task comment" />
                  </div>
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}><XCircle className="mr-1 h-4 w-4" /> Cancel</Button>
                    <Button size="sm" onClick={handleSaveEdit}><Save className="mr-1 h-4 w-4" /> Save</Button>
                  </div>
                </div>
              ) : (
                // --- View Mode ---
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3 flex-grow min-w-0">
                    <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => handleToggleTask(task.id)} aria-labelledby={`task-label-${task.id}`} className="mt-0.5 flex-shrink-0" disabled={isTemporary} />
                    <div className="flex-grow space-y-1 min-w-0">
                      <Label htmlFor={`task-${task.id}`} id={`task-label-${task.id}`} className={`block text-sm break-words ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.text}
                        {isTemporary && <span className="text-xs text-orange-500 ml-2">(Saving...)</span>}
                      </Label>
                      {/* Display Due Date/Time */}
                      {task.dueDate && (
                        // Use Clock icon for consistency if CalendarIcon removed
                        <div className="flex items-center text-xs text-blue-600"><Clock className="h-3 w-3 mr-1 flex-shrink-0" /><span className="font-semibold mr-1">Due:</span><span>{formatDateTime(task.dueDate, task.dueTime)}</span></div>
                      )}
                      {/* Display Fix Date/Time */}
                      {task.fixDate && (
                        <div className="flex items-center text-xs text-green-600"><Clock className="h-3 w-3 mr-1 flex-shrink-0" /><span className="font-semibold mr-1">Fix:</span><span>{formatDateTime(task.fixDate, task.fixTime)}</span></div>
                      )}
                      {/* Display Comment */}
                      {task.comment && (
                        <div className="text-xs text-gray-500 mt-1 group">
                          <div className="flex items-center cursor-pointer" onClick={() => toggleCommentExpansion(task.id)} role="button" tabIndex={0} aria-expanded={isCommentExpanded} aria-controls={`comment-text-${task.id}`} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleCommentExpansion(task.id)}>
                            {isCommentExpanded ? <ChevronUp className="h-4 w-4 mr-1 flex-shrink-0 group-hover:text-primary" /> : <ChevronDown className="h-4 w-4 mr-1 flex-shrink-0 group-hover:text-primary" />}
                            <span>Comment</span>
                          </div>
                          {isCommentExpanded && (
                            <p id={`comment-text-${task.id}`} className={cn("mt-1 p-2 rounded bg-muted/50 whitespace-pre-wrap break-words text-xs")}>
                              {task.comment}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-row items-center gap-0 flex-shrink-0 ml-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)} aria-label={`Edit task: ${task.text}`} title={`Edit task: ${task.text}`} className="text-muted-foreground hover:text-primary h-8 w-8" disabled={isTemporary}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label={`Go to chat regarding task: ${task.text}`} title={`Go to chat regarding task: ${task.text}`} className="text-muted-foreground hover:text-primary h-8 w-8" disabled={isTemporary}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} aria-label={`Delete task: ${task.text}`} title={`Delete task: ${task.text}`} className="text-muted-foreground hover:text-destructive h-8 w-8">
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
  const hasRealTasks = tasks.some(task => !task.id.startsWith('temp-'));
  const noTasksMatchFilter = tasksWithDates.length === 0 && tasksWithoutDates.length === 0 && hasRealTasks && !loading;
  const noTasksAtAll = tasks.length === 0 && !loading;

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader className="p-3 border-b">
        <div className="flex justify-center gap-1.5">
          <Button variant={filterStatus === 'active' ? 'default' : 'outline'} size="xs" className="text-xs" onClick={() => setFilterStatus('active')} disabled={loading}>Active</Button>
          <Button variant={filterStatus === 'finished' ? 'default' : 'outline'} size="xs" className="text-xs" onClick={() => setFilterStatus('finished')} disabled={loading}>Finished</Button>
          <Button variant={filterStatus === 'all' ? 'default' : 'outline'} size="xs" className="text-xs" onClick={() => setFilterStatus('all')} disabled={loading}>All</Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-grow overflow-y-auto">
        <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-grow h-9 text-sm"
            aria-label="New task input"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-9 w-9" aria-label="Add task" disabled={loading || !newTaskText.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {loading && <div className="text-center text-gray-500 py-4 text-sm">Loading tasks...</div>}

        {!loading && noTasksAtAll && <p className="text-center text-gray-500 text-sm">No tasks yet. Add one above!</p>}
        {!loading && noTasksMatchFilter && (
           <p className="text-center text-gray-500 text-sm">
             {filterStatus === 'active' && 'No active tasks match this filter.'}
             {filterStatus === 'finished' && 'No finished tasks match this filter.'}
           </p>
        )}

        {!loading && !noTasksAtAll && !noTasksMatchFilter && (
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
