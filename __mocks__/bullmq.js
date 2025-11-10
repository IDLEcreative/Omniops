/**
 * Manual mock for BullMQ
 * This prevents ESM issues with Jest
 */

// Create a default mock instance that can be overridden
const createDefaultQueueMock = () => ({
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  getJob: jest.fn(),
  getJobCounts: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0
  }),
  getCompleted: jest.fn().mockResolvedValue([]),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  clean: jest.fn().mockResolvedValue(undefined),
  drain: jest.fn().mockResolvedValue(undefined),
  obliterate: jest.fn().mockResolvedValue(undefined),
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
  on: jest.fn()
}));

module.exports = {
  Queue,
  Worker,
  QueueEvents
};