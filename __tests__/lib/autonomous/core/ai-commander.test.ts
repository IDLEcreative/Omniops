/**
 * Tests for AICommander
 * Tests OpenAI GPT-4 Vision integration and command extraction
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AICommander } from '@/lib/autonomous/core/ai-commander';
import type { TaskStep } from '@/lib/autonomous/core/base-agent-types';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('AICommander', () => {
  let aiCommander: AICommander;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockTaskStep: TaskStep = {
    order: 1,
    intent: 'Navigate to WooCommerce admin login',
    action: 'goto',
    target: '/wp-admin',
    expectedResult: 'Login page loaded'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);

    aiCommander = new AICommander('test-api-key');
  });

  describe('getCommand', () => {
    it('should generate command from AI response with code blocks', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```typescript\nawait page.goto("https://example.com/wp-admin")\n```'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const command = await aiCommander.getCommand(
        mockTaskStep,
        'base64-screenshot-data',
        'https://example.com'
      );

      expect(command).toBe('await page.goto("https://example.com/wp-admin")');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-vision-preview',
          temperature: 0.1,
          max_tokens: 500
        })
      );
    });

    it('should extract command from plain text response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Sure, here is the command:\nawait page.click("button.login")\nThis will click the login button.'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const command = await aiCommander.getCommand(
        mockTaskStep,
        'base64-screenshot-data',
        'https://example.com/login'
      );

      expect(command).toBe('await page.click("button.login")');
    });

    it('should include screenshot in request', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'await page.fill("input[name=username]", "admin")'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const screenshot = 'base64-encoded-screenshot';
      await aiCommander.getCommand(mockTaskStep, screenshot, 'https://example.com');

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(call.messages[0].content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'text' }),
          expect.objectContaining({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${screenshot}`,
              detail: 'high'
            }
          })
        ])
      );
    });

    it('should build proper prompt with step details', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'await page.type("input.email", "test@example.com")'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await aiCommander.getCommand(mockTaskStep, 'screenshot', 'https://example.com/admin');

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const textContent = call.messages[0].content[0].text;

      expect(textContent).toContain('**Current Step:** 1');
      expect(textContent).toContain('**Intent:** Navigate to WooCommerce admin login');
      expect(textContent).toContain('**Action Type:** goto');
      expect(textContent).toContain('**Target:** /wp-admin');
      expect(textContent).toContain('**Expected Result:** Login page loaded');
      expect(textContent).toContain('**Current Page URL:** https://example.com/admin');
    });

    it('should handle AI response without code blocks', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'await page.locator(".product-title").textContent()'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const command = await aiCommander.getCommand(
        mockTaskStep,
        'screenshot',
        'https://example.com'
      );

      expect(command).toBe('await page.locator(".product-title").textContent()');
    });

    it('should handle JavaScript code blocks', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```javascript\nawait page.screenshot({ path: "screenshot.png" })\n```'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const command = await aiCommander.getCommand(
        mockTaskStep,
        'screenshot',
        'https://example.com'
      );

      expect(command).toBe('await page.screenshot({ path: "screenshot.png" })');
    });

    it('should use low temperature for deterministic commands', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'await page.click("button")'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await aiCommander.getCommand(mockTaskStep, 'screenshot', 'https://example.com');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.1
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API rate limit exceeded')
      );

      await expect(
        aiCommander.getCommand(mockTaskStep, 'screenshot', 'https://example.com')
      ).rejects.toThrow('OpenAI API rate limit exceeded');
    });

    it('should handle empty AI response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: ''
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const command = await aiCommander.getCommand(
        mockTaskStep,
        'screenshot',
        'https://example.com'
      );

      expect(command).toBe('');
    });

    it('should handle malformed AI response', async () => {
      const mockResponse = {
        choices: []
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const command = await aiCommander.getCommand(
        mockTaskStep,
        'screenshot',
        'https://example.com'
      );

      expect(command).toBe('');
    });

    it('should handle step without target', async () => {
      const stepWithoutTarget: TaskStep = {
        order: 2,
        intent: 'Wait for page load',
        action: 'wait',
        expectedResult: 'Page fully loaded'
      };

      const mockResponse = {
        choices: [{
          message: {
            content: 'await page.waitForLoadState("networkidle")'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await aiCommander.getCommand(stepWithoutTarget, 'screenshot', 'https://example.com');

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      const textContent = call.messages[0].content[0].text;

      expect(textContent).toContain('**Target:** N/A');
    });
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(() => new AICommander('test-key')).not.toThrow();
    });

    it('should create OpenAI instance with correct configuration', () => {
      new AICommander('my-api-key');

      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'my-api-key',
        timeout: 30 * 1000,
        maxRetries: 2
      });
    });
  });
});
