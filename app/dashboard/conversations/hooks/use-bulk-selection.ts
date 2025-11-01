/**
 * Bulk Selection Hook
 */

import { useState, useCallback } from 'react';

export function useBulkSelection() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  }, [selectionMode]);

  const toggleSelectConversation = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllConversations = useCallback((conversations: Array<{ id: string }>, selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(conversations.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, []);

  const clearBulkSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectionMode,
    selectedIds,
    toggleSelectionMode,
    toggleSelectConversation,
    selectAllConversations,
    clearBulkSelection
  };
}
