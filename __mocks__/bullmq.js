/**
 * Manual mock for BullMQ
 * This prevents ESM issues with Jest
 */

// Create a default mock instance that can be overridden
const createDefaultQueueMock = () => ({
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  addBulk: jest.fn().mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }]),
  getJob: jest.fn(),
  getJobs: jest.fn().mockResolvedValue([]),
  getJobCounts: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0
  }),
  // Status-specific job getters
  getWaiting: jest.fn().mockResolvedValue([]),
  getActive: jest.fn().mockResolvedValue([]),
  getCompleted: jest.fn().mockResolvedValue([]),
  getFailed: jest.fn().mockResolvedValue([]),
  getDelayed: jest.fn().mockResolvedValue([]),
  // Status-specific count getters
  getWaitingCount: jest.fn().mockResolvedValue(0),
  getActiveCount: jest.fn().mockResolvedValue(0),
  getCompletedCount: jest.fn().mockResolvedValue(0),
  getFailedCount: jest.fn().mockResolvedValue(0),
  getDelayedCount: jest.fn().mockResolvedValue(0),
  isPaused: jest.fn().mockResolvedValue(false),
  // Queue control
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  clean: jest.fn().mockResolvedValue(['job-1', 'job-2']),
  drain: jest.fn().mockResolvedValue(undefined),
  obliterate: jest.fn().mockResolvedValue(undefined),
  waitUntilReady: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  client: Promise.resolve({
    ping: jest.fn().mockResolvedValue('PONG'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  })
});

const Queue = jest.fn().mockImplementation(() => createDefaultQueueMock());

const Worker = jest.fn().mockImplementation(() => ({
  close: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  on: jest.fn()
}));

const QueueEvents = jest.fn().mockImplementation(() => ({
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  removeAllListeners: jest.fn()
}));

module.exports = {
  Queue,
  Worker,
  QueueEvents
};