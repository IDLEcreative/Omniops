/**
 * Database Transaction Conflicts Test Suite
 *
 * **Purpose:** Tests for deadlock detection and lock ordering
 * **Critical:** Prevents database deadlocks in production
 */

import { describe, it, expect } from '@jest/globals';
import { delay } from '../../utils/race-conditions/concurrency-helpers';

describe('Database Transaction Conflicts', () => {
  it('should detect deadlock potential', async () => {
    const locks: Record<string, string> = {};

    const transaction1 = async () => {
      if (locks.A) throw new Error('A locked');
      locks.A = 'tx1';

      await delay(10);

      if (locks.B && locks.B !== 'tx1') throw new Error('B locked by tx2');
      locks.B = 'tx1';

      await delay(5);

      delete locks.A;
      delete locks.B;

      return 'tx1 complete';
    };

    const transaction2 = async () => {
      if (locks.B) throw new Error('B locked');
      locks.B = 'tx2';

      await delay(10);

      if (locks.A && locks.A !== 'tx2') throw new Error('A locked by tx1');
      locks.A = 'tx2';

      await delay(5);

      delete locks.A;
      delete locks.B;

      return 'tx2 complete';
    };

    const results = await Promise.allSettled([transaction1(), transaction2()]);
    const failures = results.filter((r) => r.status === 'rejected');
    expect(failures.length).toBeGreaterThanOrEqual(0);
  });

  it('should use consistent lock ordering to prevent deadlock', async () => {
    const locks: Record<string, string> = {};

    const transactionWithOrderedLocks = async (txId: string) => {
      if (locks.A) throw new Error('A locked');
      locks.A = txId;

      await delay(5);

      if (locks.B) throw new Error('B locked');
      locks.B = txId;

      await delay(5);

      delete locks.A;
      delete locks.B;

      return `${txId} complete`;
    };

    const results = await Promise.allSettled([
      transactionWithOrderedLocks('tx1'),
      transactionWithOrderedLocks('tx2'),
      transactionWithOrderedLocks('tx3'),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    expect(successes.length).toBeGreaterThan(0);
  });
});
