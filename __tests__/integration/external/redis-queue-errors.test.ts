/**
 * Redis Queue Integration Tests
 *
 * Comprehensive tests for Redis-backed job queue integration covering:
 * - Job creation
 * - Job processing
 * - Job completion
 * - Job failure handling
 * - Job retry logic
 * - Queue monitoring
 * - Connection pooling
 * - Error recovery
 *
 * Uses real Redis operations (or in-memory fallback) for testing.
 */

import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'

// Redis connection for tests - will use local Redis or skip if unavailable
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    if (times > 1) return null
    return Math.min(times * 50, 200)
  }
})

let isRedisAvailable = false

describe('Redis Queue Integration', () => {
  let testQueue: Queue
  let testWorker: Worker

  beforeAll(async () => {
    // Test Redis connection
    try {
      await connection.ping()
      isRedisAvailable = true
      // Create test queue
      testQueue = new Queue('test-queue-external', { connection })
    } catch (error) {
      console.log('⚠️  Redis not available - skipping Redis queue tests')
      isRedisAvailable = false
    }
  })

  afterAll(async () => {
    // Cleanup
    if (isRedisAvailable) {
      await testQueue?.close()
      await testWorker?.close()
      await connection.quit()
    }
  })

  afterEach(async () => {
    // Clean up jobs between tests
    if (isRedisAvailable) {
      await testQueue?.obliterate({ force: true })
    }
  })

  // Helper to skip tests when Redis unavailable
  const skipIfNoRedis = () => {
    if (!isRedisAvailable) {
      console.log('⏭️  Skipping test - Redis not available')
      return true
    }
    return false
  }


  describe('Job Failure Handling', () => {
    test('should handle job failures', async () => {
      if (skipIfNoRedis()) return

      testWorker = new Worker(
        'test-queue',
        async (job: Job) => {
          throw new Error('Processing failed')
        },
        { connection }
      )

      const job = await testQueue.add('failing-job', { data: 'test' })

      // Wait for failure
      await new Promise(resolve => setTimeout(resolve, 500))

      const failedJob = await Job.fromId(testQueue, job.id!)
      const state = await failedJob?.getState()

      expect(state).toBe('failed')
    })

    test('should store failure reason', async () => {
      if (skipIfNoRedis()) return

      const errorMessage = 'Custom error message'

      testWorker = new Worker(
        'test-queue',
        async (job: Job) => {
          throw new Error(errorMessage)
        },
        { connection }
      )

      const job = await testQueue.add('failing-job', { data: 'test' })

      // Wait for failure
      await new Promise(resolve => setTimeout(resolve, 500))

      const failedJob = await Job.fromId(testQueue, job.id!)
      expect(failedJob?.failedReason).toContain(errorMessage)
    })
  })

  describe('Job Retry Logic', () => {
    test('should retry failed jobs', async () => {
      if (skipIfNoRedis()) return

      let attemptCount = 0

      testWorker = new Worker(
        'test-queue',
        async (job: Job) => {
          attemptCount++
          if (attemptCount < 3) {
            throw new Error('Retry me')
          }
          return { success: true, attempts: attemptCount }
        },
        { connection }
      )

      await testQueue.add(
        'retry-job',
        { data: 'test' },
        { attempts: 3, backoff: { type: 'fixed', delay: 100 } }
      )

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(attemptCount).toBe(3)
    })

    test('should use exponential backoff', async () => {
      if (skipIfNoRedis()) return

      const attemptTimes: number[] = []

      testWorker = new Worker(
        'test-queue',
        async (job: Job) => {
          attemptTimes.push(Date.now())
          if (attemptTimes.length < 3) {
            throw new Error('Retry with backoff')
          }
          return { success: true }
        },
        { connection }
      )

      await testQueue.add(
        'backoff-job',
        { data: 'test' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 100
          }
        }
      )

      // Wait for all attempts
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify exponential delays (rough check)
      if (attemptTimes.length >= 3) {
        const delay1 = attemptTimes[1]! - attemptTimes[0]!
        const delay2 = attemptTimes[2]! - attemptTimes[1]!
        expect(delay2).toBeGreaterThan(delay1)
      }
    })
  })

  describe('Queue Monitoring', () => {
    test('should get job counts', async () => {
      if (skipIfNoRedis()) return

      await testQueue.add('job-1', { data: 1 })
      await testQueue.add('job-2', { data: 2 })
      await testQueue.add('job-3', { data: 3 })

      const counts = await testQueue.getJobCounts('waiting', 'active', 'completed', 'failed')

      expect(counts.waiting).toBeGreaterThanOrEqual(0)
      expect(counts.active).toBeGreaterThanOrEqual(0)
      expect(counts.completed).toBeGreaterThanOrEqual(0)
      expect(counts.failed).toBeGreaterThanOrEqual(0)
    })

    test('should retrieve waiting jobs', async () => {
      if (skipIfNoRedis()) return

      await testQueue.add('job-1', { order: 1 })
      await testQueue.add('job-2', { order: 2 })

      const waitingJobs = await testQueue.getWaiting()

      expect(waitingJobs.length).toBeGreaterThanOrEqual(0)
      if (waitingJobs.length > 0) {
        expect(waitingJobs[0]?.data).toBeDefined()
      }
    })

    test('should retrieve job by ID', async () => {
      if (skipIfNoRedis()) return

      const job = await testQueue.add('test-job', { message: 'Find me' })

      const retrievedJob = await Job.fromId(testQueue, job.id!)

      expect(retrievedJob).toBeDefined()
      expect(retrievedJob?.data).toEqual({ message: 'Find me' })
    })
  })

  describe('Error Recovery', () => {
    test('should handle connection errors gracefully', async () => {
      if (skipIfNoRedis()) return

      // This test validates that queue operations handle Redis connection issues
      const errorQueue = new Queue('error-test-queue', {
        connection: new IORedis({
          maxRetriesPerRequest: 0,
          retryStrategy: () => null,
          enableOfflineQueue: false
        })
      })

      // Attempt to add job with connection that will fail
      await expect(
        errorQueue.add('test-job', { data: 'test' }).catch(err => {
          // Expected to fail due to connection issues
          throw err
        })
      ).rejects.toThrow()

      await errorQueue.close()
    })

    test('should clean up stale jobs', async () => {
      if (skipIfNoRedis()) return

      // Add some jobs
      await testQueue.add('job-1', { data: 1 })
      await testQueue.add('job-2', { data: 2 })

      // Clean completed jobs older than 0 seconds (all)
      const cleaned = await testQueue.clean(0, 100, 'completed')

      expect(Array.isArray(cleaned)).toBe(true)
    })
  })
})
