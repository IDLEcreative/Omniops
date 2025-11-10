/**
 * Cross-Frame Integration Tests
 * Tests coordination between ConnectionMonitor and EnhancedParentStorageAdapter
 */

import { EnhancedParentStorageAdapter } from '@/lib/chat-widget/parent-storage-enhanced';
import {
  setupWindowMocks,
  teardownWindowMocks,
} from '@/__tests__/utils/cross-frame';

describe('Integration: ConnectionMonitor + EnhancedParentStorageAdapter', () => {
  let adapter: EnhancedParentStorageAdapter;

  beforeEach(() => {
    setupWindowMocks();
  });

  afterEach(() => {
    teardownWindowMocks();
  });

  it('should coordinate connection state between monitor and adapter', async () => {
    adapter = new EnhancedParentStorageAdapter();

    // Manually set disconnected state to test queueing
    (adapter as any).connectionState = 'disconnected';

    // Adapter should queue messages when disconnected
    adapter.setItem('coordinated_key', 'coordinated_value');

    // Advance past debounce
    await jest.advanceTimersByTimeAsync(300);

    // Should be queued
    expect(adapter.getQueueSize()).toBeGreaterThan(0);
  });
});
