import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { addSummary } from '@/lib/exports/pdf-sections/summary';
import type { SearchResult } from '@/lib/search/conversation-search';

/**
 * PDF Summary Section Test Suite
 * Tests summary statistics including sentiment breakdown
 */

describe('PDF Summary Section', () => {
  let mockDoc: any;

  beforeEach(() => {
    mockDoc = {
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn()
    };
  });

  const createMockResult = (conversationId: string, sentiment: string): SearchResult => ({
    conversationId,
    content: 'Test message',
    role: 'user',
    createdAt: '2024-01-01T10:00:00Z',
    relevanceScore: 0.8,
    highlight: null,
    customerEmail: 'test@example.com',
    domainName: 'example.com',
    sentiment: sentiment as any
  });

  it('should render summary title', () => {
    const results = [createMockResult('conv-1', 'neutral')];
    addSummary(mockDoc, results, 50, 170);

    expect(mockDoc.text).toHaveBeenCalledWith('Summary', 20, 50);
  });

  it('should display total results count', () => {
    const results = [
      createMockResult('conv-1', 'neutral'),
      createMockResult('conv-1', 'positive'),
      createMockResult('conv-2', 'negative')
    ];

    addSummary(mockDoc, results, 50, 170);

    const textCalls = (mockDoc.text as jest.Mock).mock.calls;
    const totalCall = textCalls.find(call => call[0].includes('Total Results:'));

    expect(totalCall[0]).toBe('Total Results: 3');
  });

  it('should display unique conversations count', () => {
    const results = [
      createMockResult('conv-1', 'neutral'),
      createMockResult('conv-1', 'positive'),
      createMockResult('conv-2', 'negative'),
      createMockResult('conv-3', 'neutral')
    ];

    addSummary(mockDoc, results, 50, 170);

    const textCalls = (mockDoc.text as jest.Mock).mock.calls;
    const uniqueCall = textCalls.find(call => call[0].includes('Unique Conversations:'));

    expect(uniqueCall[0]).toBe('Unique Conversations: 3');
  });

  it('should calculate sentiment breakdown correctly', () => {
    const results = [
      createMockResult('conv-1', 'positive'),
      createMockResult('conv-1', 'positive'),
      createMockResult('conv-2', 'negative'),
      createMockResult('conv-3', 'neutral'),
      createMockResult('conv-3', 'neutral'),
      createMockResult('conv-3', 'neutral')
    ];

    addSummary(mockDoc, results, 50, 170);

    const textCalls = (mockDoc.text as jest.Mock).mock.calls;
    const sentimentCall = textCalls.find(call => call[0].includes('Sentiment:'));

    expect(sentimentCall[0]).toBe('Sentiment: 2 positive, 1 negative, 3 neutral');
  });

  it('should handle all positive sentiment', () => {
    const results = [
      createMockResult('conv-1', 'positive'),
      createMockResult('conv-2', 'positive'),
      createMockResult('conv-3', 'positive')
    ];

    addSummary(mockDoc, results, 50, 170);

    const textCalls = (mockDoc.text as jest.Mock).mock.calls;
    const sentimentCall = textCalls.find(call => call[0].includes('Sentiment:'));

    expect(sentimentCall[0]).toBe('Sentiment: 3 positive, 0 negative, 0 neutral');
  });

  it('should handle all negative sentiment', () => {
    const results = [
      createMockResult('conv-1', 'negative'),
      createMockResult('conv-2', 'negative')
    ];

    addSummary(mockDoc, results, 50, 170);

    const textCalls = (mockDoc.text as jest.Mock).mock.calls;
    const sentimentCall = textCalls.find(call => call[0].includes('Sentiment:'));

    expect(sentimentCall[0]).toBe('Sentiment: 0 positive, 2 negative, 0 neutral');
  });

  it('should treat missing sentiment as neutral', () => {
    const results = [
      { ...createMockResult('conv-1', 'neutral'), sentiment: null as any },
      { ...createMockResult('conv-2', 'positive'), sentiment: undefined as any }
    ];

    addSummary(mockDoc, results, 50, 170);

    const textCalls = (mockDoc.text as jest.Mock).mock.calls;
    const sentimentCall = textCalls.find(call => call[0].includes('Sentiment:'));

    expect(sentimentCall[0]).toBe('Sentiment: 0 positive, 0 negative, 2 neutral');
  });

  it('should return updated Y position', () => {
    const results = [createMockResult('conv-1', 'neutral')];
    const startY = 50;
    const endY = addSummary(mockDoc, results, startY, 170);

    // Title (7) + Total (6) + Unique (6) + Sentiment (10) = 29
    expect(endY).toBe(79);
  });

  it('should handle empty results array', () => {
    const startY = 50;
    const endY = addSummary(mockDoc, [], startY, 170);

    expect(mockDoc.text).toHaveBeenCalledWith('Total Results: 0', 25, expect.any(Number));
    expect(mockDoc.text).toHaveBeenCalledWith('Unique Conversations: 0', 25, expect.any(Number));
    expect(endY).toBeGreaterThan(startY);
  });

  it('should use correct font sizes and styles', () => {
    const results = [createMockResult('conv-1', 'neutral')];
    addSummary(mockDoc, results, 50, 170);

    const fontSizeCalls = (mockDoc.setFontSize as jest.Mock).mock.calls;
    const fontCalls = (mockDoc.setFont as jest.Mock).mock.calls;

    expect(fontSizeCalls).toContainEqual([12]); // Title
    expect(fontSizeCalls).toContainEqual([10]); // Stats
    expect(fontCalls).toContainEqual(['helvetica', 'bold']); // Title
    expect(fontCalls).toContainEqual(['helvetica', 'normal']); // Stats
  });

  it('should position all text elements correctly', () => {
    const results = [createMockResult('conv-1', 'neutral')];
    const startY = 50;
    addSummary(mockDoc, results, startY, 170);

    const textCalls = (mockDoc.text as jest.Mock).mock.calls;
    const yPositions = textCalls.map(call => call[2]);

    // Check Y positions are increasing
    for (let i = 1; i < yPositions.length; i++) {
      expect(yPositions[i]).toBeGreaterThan(yPositions[i - 1]);
    }
  });
});
