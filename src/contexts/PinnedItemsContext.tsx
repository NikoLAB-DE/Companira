import React, { createContext, useContext, useState, useCallback } from 'react';
import { PinnedItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface PinnedItemsContextType {
  pinnedItems: PinnedItem[];
  addPinnedItem: (content: string) => void;
  removePinnedItem: (id: string) => void;
  updatePinnedItem: (id: string, newContent: string) => void;
}

const PinnedItemsContext = createContext<PinnedItemsContextType | undefined>(undefined);

export const PinnedItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use useState to manage the in-memory list of pinned items
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);

  const addPinnedItem = useCallback((content: string) => {
    if (!content || content.trim() === '') {
      console.warn('[PinnedItemsContext] Attempted to add empty pinned item.');
      return;
    }
    const newItem: PinnedItem = {
      id: uuidv4(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    setPinnedItems(prevItems => [newItem, ...prevItems]); // Add new item to the top
    console.log('[PinnedItemsContext] Added new pinned item:', newItem.id);
  }, []);

  const removePinnedItem = useCallback((id: string) => {
    setPinnedItems(prevItems => prevItems.filter(item => item.id !== id));
    console.log('[PinnedItemsContext] Removed pinned item:', id);
  }, []);

  const updatePinnedItem = useCallback((id: string, newContent: string) => {
    if (!newContent || newContent.trim() === '') {
       console.warn('[PinnedItemsContext] Attempted to update pinned item with empty content.');
       // Optionally remove the item if updated to empty
       // removePinnedItem(id);
       return;
    }
    setPinnedItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, content: newContent.trim() } : item
      )
    );
    console.log('[PinnedItemsContext] Updated pinned item:', id);
  }, []);

  const value = {
    pinnedItems,
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
