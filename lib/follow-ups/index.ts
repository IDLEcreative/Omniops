/**
 * Automated Follow-ups Module
 *
 * Provides comprehensive follow-up automation:
 * - Detection of conversations needing follow-up
 * - Scheduling and sending of follow-up messages
 * - Analytics and effectiveness tracking
 */

export {
  detectFollowUpCandidates,
  prioritizeFollowUps,
  type FollowUpReason,
  type FollowUpCandidate,
  type DetectionOptions,
} from './detector';

export {
  scheduleFollowUps,
  cancelFollowUps,
  type FollowUpMessage,
  type ScheduleOptions,
} from './scheduler';

export { sendPendingFollowUps } from './message-sender';

export {
  getFollowUpAnalytics,
  getFollowUpSummary,
  trackFollowUpResponse,
  type FollowUpMetrics,
  type FollowUpAnalytics,
  type FollowUpSummary,
} from './analytics';
