/**
 * Widget Configuration End-to-End Tests - Orchestrator
 *
 * Tests the complete flow from database config loading through
 * the chat API to ensure all customization features work in practice.
 *
 * These tests validate:
 * - Real API calls with different configurations
 * - Proper parameter passing through the stack
 * - Telemetry logging of config settings
 * - Actual OpenAI API parameter changes
 *
 * Test suite includes:
 * - Personality and tone settings
 * - Response length and token limits
 * - Language and custom system prompts
 * - Temperature settings and defaults
 */

import { describe, beforeAll } from '@jest/globals';

// Import mocks setup
import './widget-config-e2e/mocks-setup';

// Import test definitions
import { defineFriendlyPersonalityTests, definePersonalityTests } from './widget-config-e2e/personality-tests';
import { defineResponseLengthTests } from './widget-config-e2e/response-length-tests';
import { defineLanguageAndPromptTests } from './widget-config-e2e/language-and-prompt-tests';
import { defineTemperatureAndDefaultsTests } from './widget-config-e2e/temperature-and-defaults-tests';

let POST: typeof import('@/app/api/chat/route').POST;

beforeAll(async () => {
  ({ POST } = await import('@/app/api/chat/route'));
});

// Getter function to access POST after it's loaded
const getPOST = () => POST;

describe('Widget Config E2E - Chat API Integration', () => {
  describe('Personality Settings', () => {
    defineFriendlyPersonalityTests(getPOST);
    definePersonalityTests(getPOST);
  });

  describe('Response Length Settings', () => {
    defineResponseLengthTests(getPOST);
  });

  describe('Language and Custom Prompts', () => {
    defineLanguageAndPromptTests(getPOST);
  });

  describe('Temperature and Defaults', () => {
    defineTemperatureAndDefaultsTests(getPOST);
  });
});
