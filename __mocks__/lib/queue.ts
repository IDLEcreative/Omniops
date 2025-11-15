/**
 * Mock Queue Module
 */

export enum JobPriority {
  CRITICAL = 10,
  HIGH = 5,
  NORMAL = 0,
  LOW = -5,
  DEFERRED = -10,
}

export const createQueue = jest.fn();
export const addJob = jest.fn();
export const getJob = jest.fn();
export const getQueueStats = jest.fn();
export const pauseQueue = jest.fn();
export const resumeQueue = jest.fn();
export const cleanQueue = jest.fn();
