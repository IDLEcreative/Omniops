/**
 * Tests for Logger - Sensitive Data Redaction
 *
 * Coverage:
 * - Password, API key, and token redaction
 * - Nested and array redaction
 * - Multiple sensitive patterns
 */

import { logger } from '@/lib/logger';

describe('Logger - Sensitive Data Redaction', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should redact password fields', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('User login', {
      username: 'john',
      password: 'secret123',
    });

    const logs = logger.getRecentLogs(1);
    expect(logs[0].context?.username).toBe('john');
    expect(logs[0].context?.password).toBe('[REDACTED]');

    consoleSpy.mockRestore();
  });

  it('should redact API keys', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('API call', {
      apiKey: 'sk_test_123456',
      data: 'public data',
    });

    const logs = logger.getRecentLogs(1);
    expect(logs[0].context?.apiKey).toBe('[REDACTED]');
    expect(logs[0].context?.data).toBe('public data');

    consoleSpy.mockRestore();
  });

  it('should redact tokens', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Token refresh', {
      accessToken: 'token_abc123',
      refreshToken: 'token_xyz789',
      userId: '123',
    });

    const logs = logger.getRecentLogs(1);
    expect(logs[0].context?.accessToken).toBe('[REDACTED]');
    expect(logs[0].context?.refreshToken).toBe('[REDACTED]');
    expect(logs[0].context?.userId).toBe('123');

    consoleSpy.mockRestore();
  });

  it('should redact nested sensitive data', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Payment processing', {
      user: {
        name: 'John',
        creditCard: '4111111111111111',
      },
      amount: 100,
    });

    const logs = logger.getRecentLogs(1);
    expect(logs[0].context?.user.name).toBe('John');
    expect(logs[0].context?.user.creditCard).toBe('[REDACTED]');
    expect(logs[0].context?.amount).toBe(100);

    consoleSpy.mockRestore();
  });

  it('should redact sensitive data in arrays', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Batch processing', {
      users: [
        { name: 'Alice', password: 'pass1' },
        { name: 'Bob', password: 'pass2' },
      ],
    });

    const logs = logger.getRecentLogs(1);
    expect(logs[0].context?.users[0].name).toBe('Alice');
    expect(logs[0].context?.users[0].password).toBe('[REDACTED]');
    expect(logs[0].context?.users[1].name).toBe('Bob');
    expect(logs[0].context?.users[1].password).toBe('[REDACTED]');

    consoleSpy.mockRestore();
  });

  it('should redact multiple sensitive patterns', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Security test', {
      secret: 'secret_value',
      privateKey: 'private_key_value',
      authorization: 'Bearer token',
      sessionId: 'session_123',
      normalField: 'normal_value',
    });

    const logs = logger.getRecentLogs(1);
    expect(logs[0].context?.secret).toBe('[REDACTED]');
    expect(logs[0].context?.privateKey).toBe('[REDACTED]');
    expect(logs[0].context?.authorization).toBe('[REDACTED]');
    expect(logs[0].context?.sessionId).toBe('[REDACTED]');
    expect(logs[0].context?.normalField).toBe('normal_value');

    consoleSpy.mockRestore();
  });
});
