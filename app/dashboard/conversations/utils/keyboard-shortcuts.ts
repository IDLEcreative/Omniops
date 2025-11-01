/**
 * Keyboard Shortcuts Configuration
 */

import { useMemo } from 'react';
import { formatShortcut, type KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";

export function useConversationShortcuts(
  selectNext: () => void,
  selectPrevious: () => void,
  clearSelection: () => void,
  focusSearch: () => void,
  handleRefresh: () => void,
  setActiveTab: (tab: any) => void
) {
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: 'j', callback: selectNext, description: 'Next conversation' },
    { key: 'ArrowDown', callback: selectNext, description: 'Next conversation' },
    { key: 'k', callback: selectPrevious, description: 'Previous conversation' },
    { key: 'ArrowUp', callback: selectPrevious, description: 'Previous conversation' },
    { key: 'Escape', callback: clearSelection, description: 'Clear selection' },
    { key: '/', callback: focusSearch, description: 'Focus search' },
    { key: 'r', callback: handleRefresh, description: 'Refresh data' },
    { key: '1', callback: () => setActiveTab('all'), description: 'All conversations' },
    { key: '2', callback: () => setActiveTab('active'), description: 'Active conversations' },
    { key: '3', callback: () => setActiveTab('waiting'), description: 'Waiting conversations' },
    { key: '4', callback: () => setActiveTab('resolved'), description: 'Resolved conversations' },
  ], [selectNext, selectPrevious, clearSelection, focusSearch, handleRefresh, setActiveTab]);

  const displayShortcuts = useMemo(() =>
    shortcuts.map(s => ({
      keys: formatShortcut(s),
      description: s.description
    }))
  , [shortcuts]);

  return { shortcuts, displayShortcuts };
}
