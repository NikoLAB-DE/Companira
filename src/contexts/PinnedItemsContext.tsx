import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PinnedItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase'; // Import supabase client
import { useAuth } from './AuthContext'; // Import useAuth
import { useToast } from '@/components/ui/use-toast'; // Import useToast

interface PinnedItemsContextType {
  pinnedItems: PinnedItem[];
  loading: boolean; // Add loading state for initial fetch
  addPinnedItem: (content: string) => void;
  removePinnedItem: (id: string) => void;
  updatePinnedItem: (id: string, newContent: string) => void;
}

const PinnedItemsContext = createContext<PinnedItemsContextType | undefined>(undefined);

export const PinnedItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [loading, setLoading] = useState(true); // State for initial loading

  // Helper function to sort items by timestamp (descending)
  const sortItems = useCallback((items: PinnedItem[]) => {
    return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  // --- Fetch Pinned Items from Supabase ---
  const fetchPinnedItems = useCallback(async () => {
    if (!user?.id) {
      console.log('[PinnedItemsContext] No user logged in, skipping fetch.');
      setPinnedItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log(`[PinnedItemsContext] Fetching pinned items for user: ${user.id}`);

    try {
      const { data, error } = await supabase
        .from('pinned_items')
        .select('*')
        // --- MODIFIED: Order by updated_at descending ---
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[PinnedItemsContext] Error fetching pinned items:', error);
        toast({ title: "Error", description: `Failed to load pinned items: ${error.message}`, variant: "destructive" });
        setPinnedItems([]);
      } else if (data) {
        console.log('[PinnedItemsContext] Pinned items fetched:', data.length);
        // Map database rows to PinnedItem type, using updated_at for timestamp
        const fetchedItems: PinnedItem[] = data.map((item: any) => ({
          id: item.id,
          content: item.content,
          timestamp: item.updated_at || item.created_at, // Use updated_at, fallback to created_at
        }));
        // Data is already sorted by the query, no need to sort again here unless fallback was used
        setPinnedItems(fetchedItems);
      } else {
         console.log('[PinnedItemsContext] No pinned items found for user.');
         setPinnedItems([]);
      }
    } catch (err: any) {
      console.error('[PinnedItemsContext] Unexpected error fetching pinned items:', err);
      toast({ title: "Error", description: "An unexpected error occurred while loading pinned items.", variant: "destructive" });
      setPinnedItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]); // Depend on user.id and toast

  // --- Effect to Fetch Pinned Items on User Change or Mount ---
  useEffect(() => {
    fetchPinnedItems();
  }, [fetchPinnedItems]); // Depend on the memoized fetch function

  // --- Add Pinned Item ---
  const addPinnedItem = useCallback(async (content: string) => {
    if (!user?.id) {
      toast({ title: "Login Required", description: "Please log in to pin conversations.", variant: "info" });
      return;
    }
    if (!content || content.trim() === '') {
      console.warn('[PinnedItemsContext] Attempted to add empty pinned item.');
      return;
    }

    const newItemContent = content.trim();
    const tempId = `temp-${uuidv4()}`; // Temporary ID for optimistic update
    const optimisticItem: PinnedItem = {
      id: tempId,
      content: newItemContent,
      timestamp: new Date().toISOString(), // Use current time for optimistic display
    };

    // Optimistically add the new item to the state (at the top)
    setPinnedItems(prevItems => [optimisticItem, ...prevItems]);
    console.log('[PinnedItemsContext] Optimistically added new pinned item:', tempId);

    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('pinned_items')
        .insert({ user_id: user.id, content: newItemContent })
        .select() // Select the inserted data to get the real ID and timestamps
        .single();

      if (error) {
        console.error('[PinnedItemsContext] Error saving new pinned item to Supabase:', error);
        toast({ title: "Error", description: `Failed to save pinned item: ${error.message}`, variant: "destructive" });
        // Revert optimistic update on error
        setPinnedItems(prevItems => prevItems.filter(item => item.id !== tempId));
        return;
      }

      if (data) {
        console.log('[PinnedItemsContext] New pinned item saved to Supabase:', data.id);
        // Replace the optimistic item with the real data from Supabase
        const savedItem: PinnedItem = {
          id: data.id,
          content: data.content,
          timestamp: data.updated_at || data.created_at, // Use updated_at from DB
        };
        // --- MODIFIED: Replace optimistic item and re-sort the list ---
        setPinnedItems(prevItems => {
          const updatedList = prevItems.map(item => item.id === tempId ? savedItem : item);
          return sortItems(updatedList); // Sort the list after replacing
        });
        toast({ title: "Pinned!", description: "Conversation pinned successfully." });
      } else {
         // Fallback: if insert didn't return data, refetch to ensure state is correct
         console.warn('[PinnedItemsContext] Supabase insert did not return data, refetching...');
         fetchPinnedItems(); // fetchPinnedItems will sort
         toast({ title: "Pinned!", description: "Conversation pinned successfully (syncing...)." });
      }

    } catch (err: any) {
      console.error('[PinnedItemsContext] Unexpected error adding pinned item:', err);
      toast({ title: "Error", description: "An unexpected error occurred while pinning.", variant: "destructive" });
      // Revert optimistic update on unexpected error
      setPinnedItems(prevItems => prevItems.filter(item => item.id !== tempId));
    }
  }, [user?.id, toast, fetchPinnedItems, sortItems]); // Depend on sortItems

  // --- Remove Pinned Item ---
  const removePinnedItem = useCallback(async (id: string) => {
    if (!user?.id || id.startsWith('temp-')) {
       if (id.startsWith('temp-')) console.warn('[PinnedItemsContext] Attempted to delete unsaved temporary item.');
       else toast({ title: "Login Required", description: "Please log in to delete pinned conversations.", variant: "info" });
       return;
    }

    const originalItems = pinnedItems; // Store current state for rollback
    // Optimistically remove the item from the state
    setPinnedItems(prevItems => prevItems.filter(item => item.id !== id));
    console.log('[PinnedItemsContext] Optimistically removed pinned item:', id);

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('pinned_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user owns the item

      if (error) {
        console.error('[PinnedItemsContext] Error deleting pinned item from Supabase:', error);
        toast({ title: "Error", description: `Failed to delete pinned item: ${error.message}`, variant: "destructive" });
        // Revert optimistic removal on error
        setPinnedItems(originalItems);
      } else {
        console.log('[PinnedItemsContext] Pinned item deleted from Supabase:', id);
        toast({ title: "Deleted!", description: "Pinned conversation removed." });
      }
    } catch (err: any) {
      console.error('[PinnedItemsContext] Unexpected error deleting pinned item:', err);
      toast({ title: "Error", description: "An unexpected error occurred while deleting.", variant: "destructive" });
      // Revert optimistic removal on unexpected error
      setPinnedItems(originalItems);
    }
  }, [user?.id, pinnedItems, toast]); // Depend on user.id, pinnedItems, and toast

  // --- Update Pinned Item ---
  const updatePinnedItem = useCallback(async (id: string, newContent: string) => {
     if (!user?.id || id.startsWith('temp-')) {
       if (id.startsWith('temp-')) console.warn('[PinnedItemsContext] Attempted to update unsaved temporary item.');
       else toast({ title: "Login Required", description: "Please log in to edit pinned conversations.", variant: "info" });
       return;
     }
     if (!newContent || newContent.trim() === '') {
        console.warn('[PinnedItemsContext] Attempted to update pinned item with empty content.');
        // Optionally remove the item if updated to empty, or just prevent update
        // removePinnedItem(id); // Uncomment if you want to delete on empty save
        toast({ title: "Info", description: "Pinned item cannot be empty.", variant: "info" });
        return;
     }

     const updatedContent = newContent.trim();
     const originalItems = pinnedItems; // Store current state for rollback
     const originalItem = originalItems.find(item => item.id === id);
     if (!originalItem) {
        console.warn('[PinnedItemsContext] Attempted to update non-existent item:', id);
        return;
     }

     // Optimistically update the item in the state, update timestamp to now
     const optimisticItems = pinnedItems.map(item =>
       item.id === id ? { ...item, content: updatedContent, timestamp: new Date().toISOString() } : item
     );
     // --- MODIFIED: Sort the list after optimistic update ---
     setPinnedItems(sortItems(optimisticItems));
     console.log('[PinnedItemsContext] Optimistically updated pinned item:', id);

     try {
       // Update in Supabase
       const { data, error } = await supabase
         .from('pinned_items')
         .update({ content: updatedContent, updated_at: new Date().toISOString() }) // Include updated_at
         .eq('id', id)
         .eq('user_id', user.id) // Ensure user owns the item
         .select() // Select the updated data
         .single();

       if (error) {
         console.error('[PinnedItemsContext] Error updating pinned item in Supabase:', error);
         toast({ title: "Error", description: `Failed to save changes: ${error.message}`, variant: "destructive" });
         // Revert optimistic update on error
         setPinnedItems(originalItems); // Revert to original state
       } else if (data) {
         console.log('[PinnedItemsContext] Pinned item updated in Supabase:', data.id);
         // Update state with data from Supabase to ensure consistency (e.g., updated_at)
         const savedItem: PinnedItem = {
           id: data.id,
           content: data.content,
           timestamp: data.updated_at || data.created_at, // Use updated_at from DB
         };
         // --- MODIFIED: Replace optimistic item and re-sort the list ---
         setPinnedItems(prevItems => {
           const updatedList = prevItems.map(item => item.id === id ? savedItem : item);
           return sortItems(updatedList); // Sort the list after replacing
         });
         toast({ title: "Saved!", description: "Pinned conversation updated." });
       } else {
          // Fallback: if update didn't return data, refetch
          console.warn('[PinnedItemsContext] Supabase update did not return data, refetching...');
          fetchPinnedItems(); // fetchPinnedItems will sort
          toast({ title: "Saved!", description: "Pinned conversation updated (syncing...)." });
       }

     } catch (err: any) {
       console.error('[PinnedItemsContext] Unexpected error updating pinned item:', err);
       toast({ title: "Error", description: "An unexpected error occurred while saving changes.", variant: "destructive" });
       // Revert optimistic update on unexpected error
       setPinnedItems(originalItems); // Revert to original state
     }
  }, [user?.id, pinnedItems, toast, fetchPinnedItems, sortItems]); // Depend on sortItems


  const value = {
    pinnedItems,
    loading, // Expose loading state
    addPinnedItem,
    removePinnedItem,
    updatePinnedItem,
  };

  return (
    <PinnedItemsContext.Provider value={value}>
      {children}
    </PinnedItemsContext.Provider>
  );
};

export const usePinnedItems = () => {
  const context = useContext(PinnedItemsContext);
  if (context === undefined) {
    throw new Error('usePinnedItems must be used within a PinnedItemsProvider');
  }
  return context;
};
