/**
 * Tests for Logger - Context Enrichment, Request Tracking, Error Serialization, and History Management
 *
 * Coverage:
 * - Context enrichment (timestamp, environment, service)
 * - Request ID tracking
 * - Error serialization with stack traces
 * - Log history management
 * - Utility functions (withErrorHandling)
 */

import { logger, withErrorHandling } from '@/lib/logger';

describe('Logger - Context Enrichment', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should include timestamp in log entries', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Test message');

    const logs = logger.getRecentLogs(1);
    expect(logs[0].timestamp).toBeDefined();
    expect(new Date(logs[0].timestamp).getTime()).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });

  it('should include environment in log entries', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Test message');

    const logs = logger.getRecentLogs(1);
    expect(logs[0].environment).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('should include service name in log entries', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Test message');

    const logs = logger.getRecentLogs(1);
    expect(logs[0].service).toBe('omniops');

    consoleSpy.mockRestore();
  });
});

describe('Logger - Request ID Tracking', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should track request ID from context', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    await logger.withRequestContext('req_123', async () => {
      logger.info('Processing request');
    });

    const logs = logger.getRecentLogs(1);
    expect(logs[0].requestId).toBe('req_123');

    consoleSpy.mockRestore();
  });

  it('should track request ID across multiple log calls', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    await logger.withRequestContext('req_456', async () => {
      logger.info('Step 1');
      logger.info('Step 2');
      logger.warn('Step 3 warning');
    });

    const logs = logger.getRecentLogs(3);
    expect(logs[0].requestId).toBe('req_456');
    expect(logs[1].requestId).toBe('req_456');
    expect(logs[2].requestId).toBe('req_456');

    consoleSpy.mockRestore();
  });

  it('should filter logs by request ID', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    await logger.withRequestContext('req_a', async () => {
      logger.info('Request A - step 1');
      logger.info('Request A - step 2');
    });

    await logger.withRequestContext('req_b', async () => {
      logger.info('Request B - step 1');
    });

    const logsA = logger.getLogsByRequestId('req_a');
    const logsB = logger.getLogsByRequestId('req_b');

    expect(logsA).toHaveLength(2);
    expect(logsB).toHaveLength(1);
    expect(logsA[0].message).toBe('Request A - step 1');
    expect(logsB[0].message).toBe('Request B - step 1');

    consoleSpy.mockRestore();
  });
});

describe('Logger - Error Serialization', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should serialize Error objects', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const testError = new Error('Test error');

    logger.error('Error occurred', testError);

    const logs = logger.getRecentLogs(1);
    expect(logs[0].error?.message).toBe('Test error');
    expect(logs[0].error?.name).toBe('Error');

    consoleSpy.mockRestore();
  });

  it('should include stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const testError = new Error('Test error');

    logger.error('Error occurred', testError);

    const logs = logger.getRecentLogs(1);
    expect(logs[0].error?.stack).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('should handle non-Error objects', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    logger.error('Error occurred', 'String error');

    const logs = logger.getRecentLogs(1);
    expect(logs[0].error?.message).toBe('String error');
    expect(logs[0].error?.name).toBe('UnknownError');

    consoleSpy.mockRestore();
  });
});

describe('Logger - Log History Management', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should maintain log history', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Message 1');
    logger.info('Message 2');
    logger.info('Message 3');

    const logs = logger.getRecentLogs(3);
    expect(logs).toHaveLength(3);
    expect(logs[0].message).toBe('Message 1');
    expect(logs[2].message).toBe('Message 3');

    consoleSpy.mockRestore();
  });

  it('should clear logs', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Message 1');
    logger.info('Message 2');
    logger.clearLogs();

    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  it('should export logs as JSON', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Message 1', { data: 'test' });

    const exported = logger.exportLogs();
    const parsed = JSON.parse(exported);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].message).toBe('Message 1');

    consoleSpy.mockRestore();
  });

  it('should filter logs by level', () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    logger.info('Info message');
    logger.warn('Warn message');
    logger.error('Error message');

    const infoLogs = logger.getLogsByLevel('info');
    const warnLogs = logger.getLogsByLevel('warn');
    const errorLogs = logger.getLogsByLevel('error');

    expect(infoLogs).toHaveLength(1);
    expect(warnLogs).toHaveLength(1);
    expect(errorLogs).toHaveLength(1);

    expect(infoLogs[0].message).toBe('Info message');
    expect(warnLogs[0].message).toBe('Warn message');
    expect(errorLogs[0].message).toBe('Error message');

    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe('Logger - Utility Functions', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('withErrorHandling should catch and log errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await withErrorHandling(
      async () => {
        throw new Error('Test error');
      },
      'Operation failed',
      { operationId: 'op_123' }
    );

    expect(result).toBeNull();
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].message).toBe('Operation failed');
    expect(logs[0].context?.operationId).toBe('op_123');

    consoleSpy.mockRestore();
  });

  it('withErrorHandling should return result on success', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await withErrorHandling(
      async () => 'success',
      'Operation failed'
    );

    expect(result).toBe('success');

    consoleSpy.mockRestore();
  });
});
