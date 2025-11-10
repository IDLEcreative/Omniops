/**
 * Agent conversation test scenarios
 * Aggregates all test scenarios for the conversation suite
 */

import { basicContextRetention } from './scenario-basic-context';
import { topicSwitchingAndReturn } from './scenario-topic-switching';
import { complexOrderInquiry } from './scenario-order-inquiry';
import { numberedListReference } from './scenario-numbered-reference';
import { clarificationAndCorrection } from './scenario-clarification';
import { pronounResolution } from './scenario-pronoun-resolution';
import { complexTopicWeaving } from './scenario-topic-weaving';
import { timeBasedContext } from './scenario-time-context';

import type { TestScenario } from '../../utils/agents';

export const testScenarios: TestScenario[] = [
  basicContextRetention,
  topicSwitchingAndReturn,
  complexOrderInquiry,
  numberedListReference,
  clarificationAndCorrection,
  pronounResolution,
  complexTopicWeaving,
  timeBasedContext,
];
