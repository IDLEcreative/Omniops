/**
 * Test data fixtures for audit logger tests
 * Provides reusable step data and mock responses
 */

import type { AuditStepData } from '@/lib/autonomous/security/audit-logger-types';

export const validStepData: AuditStepData = {
  operationId: 'op-123',
  stepNumber: 1,
  intent: 'Navigate to login page',
  action: 'await page.goto("https://example.com/login")',
  success: true,
  pageUrl: 'https://example.com/login',
  durationMs: 1250
};

export const failedStepData: AuditStepData = {
  operationId: 'op-124',
  stepNumber: 3,
  intent: 'Click login button',
  action: 'await page.click("#login-btn")',
  success: false,
  error: 'Element not found',
  pageUrl: 'https://example.com/login',
  durationMs: 500
};

export const stepWithScreenshot: AuditStepData = {
  ...validStepData,
  screenshotUrl: 'https://example.com/screenshots/step-1.png'
};

export const stepWithAI: AuditStepData = {
  ...validStepData,
  aiResponse: 'Click the blue login button in the top right corner'
};

export const createMockLogResponse = (stepData: AuditStepData, id: string = 'audit-123') => ({
  data: {
    id,
    operation_id: stepData.operationId,
    step_number: stepData.stepNumber,
    intent: stepData.intent,
    action: stepData.action,
    success: stepData.success,
    error: stepData.error || null,
    screenshot_url: stepData.screenshotUrl || null,
    page_url: stepData.pageUrl || null,
    duration_ms: stepData.durationMs || null,
    ai_response: stepData.aiResponse || null,
    timestamp: new Date().toISOString()
  },
  error: null
});

export const createMockMultipleLogsResponse = () => [
  {
    id: 'audit-1',
    operation_id: 'op-123',
    step_number: 1,
    intent: 'Navigate to login',
    action: 'await page.goto(...)',
    success: true,
    error: null,
    screenshot_url: 'https://example.com/screenshot-1.png',
    page_url: 'https://example.com/login',
    duration_ms: 1000,
    ai_response: null,
    timestamp: new Date().toISOString()
  },
  {
    id: 'audit-2',
    operation_id: 'op-123',
    step_number: 2,
    intent: 'Fill username',
    action: 'await page.fill(...)',
    success: true,
    error: null,
    screenshot_url: 'https://example.com/screenshot-2.png',
    page_url: 'https://example.com/login',
    duration_ms: 500,
    ai_response: null,
    timestamp: new Date().toISOString()
  },
  {
    id: 'audit-3',
    operation_id: 'op-123',
    step_number: 3,
    intent: 'Click login button',
    action: 'await page.click(...)',
    success: false,
    error: 'Element not found',
    screenshot_url: 'https://example.com/screenshot-3.png',
    page_url: 'https://example.com/login',
    duration_ms: 200,
    ai_response: null,
    timestamp: new Date().toISOString()
  }
];
