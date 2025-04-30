import { useEffect, useState, useRef, useCallback } from "react"; // Added useCallback
import { supabase } from "@/lib/supabase";
import { Task } from "@/types";

// Helper to map Supabase row to Task
function mapRowToTask(row: any): Task {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    dueDate: row.due_date || undefined,
    fixDate: row.fix_date || undefined,
    dueTime: row.due_time || undefined,
    fixTime: row.fix_time || undefined,
    comment: row.comment || "",
  };
}

export function useActiveTasks(userId?: string | null) {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef(true); // Ref to track mount status

  // Define fetchTasks outside useEffect so it can be returned
  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setActiveTasks([]);
      return;
    }
    console.log("[useActiveTasks] Fetching tasks for user:", userId); // Debug log
    const { data, error } = await supabase
      .from("To_Do")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .order("created_at", { ascending: false });

    // Check mount status *before* setting state
    if (!isMountedRef.current) {
       console.log("[useActiveTasks] Component unmounted before fetch completed."); // Debug log
       return;
    }

    if (error) {
      console.error("[useActiveTasks] Error fetching tasks:", error); // Debug log
      setActiveTasks([]);
    } else {
      console.log("[useActiveTasks] Tasks fetched successfully:", data.length); // Debug log
      setActiveTasks(data.map(mapRowToTask));
    }
  }, [userId]); // Dependency on userId

  // Initial fetch on mount or when userId changes
  useEffect(() => {
    isMountedRef.current = true; // Set mounted status
    fetchTasks();

    // Cleanup function to set mounted status to false
    return () => {
      console.log("[useActiveTasks] Cleanup: Component unmounting."); // Debug log
      isMountedRef.current = false;
    };
  }, [fetchTasks]); // Depend on the memoized fetchTasks

  // Subscribe to real-time changes
  useEffect(() => {
    if (!userId) return;

    // Ensure mount status is checked before proceeding
    if (!isMountedRef.current) return;

    console.log("[useActiveTasks] Setting up real-time subscription for user:", userId); // Debug log

    // Clean up previous subscription
    if (subscriptionRef.current) {
      console.log("[useActiveTasks] Removing previous subscription."); // Debug log
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Subscribe to changes for this user
    const channel = supabase
      .channel(`todo-active-tasks-${userId}`) // Use unique channel name per user
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "To_Do",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[useActiveTasks] Real-time change detected:", payload.eventType); // Debug log
          // Refetch on any change detected by the subscription
          // Check mount status again inside the callback
          if (isMountedRef.current) {
             console.log("[useActiveTasks] Refetching tasks due to real-time event."); // Debug log
             fetchTasks(); // Call the memoized fetch function
          } else {
             console.log("[useActiveTasks] Real-time event received, but component unmounted. Skipping refetch."); // Debug log
          }
        }
      )
      .subscribe((status, err) => {
         // Optional: Log subscription status changes
         if (status === 'SUBSCRIBED') {
           console.log('[useActiveTasks] Real-time subscription active.');
         } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
           console.error(`[useActiveTasks] Real-time subscription error: ${status}`, err);
         } else if (status === 'CLOSED') {
            console.log('[useActiveTasks] Real-time subscription closed.');
         }
      });

    subscriptionRef.current = channel;

    // Cleanup function for the subscription effect
    return () => {
      console.log("[useActiveTasks] Cleanup: Removing real-time subscription."); // Debug log
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, fetchTasks]); // Depend on userId and the memoized fetchTasks

  // Return state and the refetch function
  return { activeTasks, refetchActiveTasks: fetchTasks };
}
