/**
 * Tests for Logger - Log Levels and Production Mode
 *
 * Coverage:
 * - All log levels (debug, info, warn, error)
 * - Production mode JSON output
 */

import { logger, LogLevel } from '@/lib/logger';

describe('Logger - Log Levels', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    logger.clearLogs();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log info messages', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Test message', { userId: '123' });

    expect(consoleSpy).toHaveBeenCalled();
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].context?.userId).toBe('123');

    consoleSpy.mockRestore();
  });

  it('should log warn messages', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    logger.warn('Warning message', { threshold: 90 });

    expect(consoleSpy).toHaveBeenCalled();
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe('warn');
    expect(logs[0].message).toBe('Warning message');

    consoleSpy.mockRestore();
  });

  it('should log error messages with error objects', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const testError = new Error('Test error');

    logger.error('Error occurred', testError, { userId: '123' });

    expect(consoleSpy).toHaveBeenCalled();
    const logs = logger.getRecentLogs(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].message).toBe('Error occurred');
    expect(logs[0].error?.message).toBe('Test error');
    expect(logs[0].error?.name).toBe('Error');

    consoleSpy.mockRestore();
  });

  it('should only log debug in development mode', () => {
    const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

    process.env.NODE_ENV = 'production';
    logger.debug('Debug message');
    expect(consoleSpy).not.toHaveBeenCalled();

    process.env.NODE_ENV = 'development';
    logger.debug('Debug message');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('Logger - Production Mode', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should output JSON in production', () => {
    process.env.NODE_ENV = 'production';
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Test message', { userId: '123' });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];

    // Should be valid JSON
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed.message).toBe('Test message');
    expect(parsed.level).toBe('info');

    consoleSpy.mockRestore();
    process.env.NODE_ENV = 'test';
  });
});
