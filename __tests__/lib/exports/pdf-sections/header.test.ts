import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { addHeader } from '@/lib/exports/pdf-sections/header';
import type { PDFExportOptions } from '@/lib/exports/pdf-types';

/**
 * PDF Header Section Test Suite
 * Tests header generation with title, timestamp, and separator line
 */

describe('PDF Header Section', () => {
  let mockDoc: any;
  const defaultOptions: PDFExportOptions = {
    includeTimestamp: true,
    title: 'Test Report'
  };

  beforeEach(() => {
    mockDoc = {
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      setTextColor: jest.fn(),
      setDrawColor: jest.fn(),
      text: jest.fn(),
      line: jest.fn()
    };
  });

  it('should render title at correct position', () => {
    const y = addHeader(mockDoc, 'Test Title', 20, 170, defaultOptions);

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(18);
    expect(mockDoc.setFont).toHaveBeenCalledWith('helvetica', 'bold');
    expect(mockDoc.text).toHaveBeenCalledWith('Test Title', 20, 20);
  });

  it('should return updated Y position after rendering', () => {
    const startY = 20;
    const endY = addHeader(mockDoc, 'Title', startY, 170, defaultOptions);

    // Title (10) + timestamp (8) + separator (10) = 28 units added
    expect(endY).toBeGreaterThan(startY);
    expect(endY).toBe(48); // 20 + 10 + 8 + 10
  });

  it('should include timestamp when option is enabled', () => {
    const options = { ...defaultOptions, includeTimestamp: true };
    addHeader(mockDoc, 'Title', 20, 170, options);

    const timestampCall = (mockDoc.text as jest.Mock).mock.calls.find(call =>
      call[0].startsWith('Generated:')
    );

    expect(timestampCall).toBeDefined();
    expect(timestampCall[0]).toMatch(/Generated:/);
  });

  it('should exclude timestamp when option is disabled', () => {
    const options = { ...defaultOptions, includeTimestamp: false };
    const y = addHeader(mockDoc, 'Title', 20, 170, options);

    const timestampCall = (mockDoc.text as jest.Mock).mock.calls.find(call =>
      call[0].startsWith('Generated:')
    );

    expect(timestampCall).toBeUndefined();
    // Should be shorter without timestamp
    expect(y).toBe(40); // 20 + 10 + 10 (no 8 for timestamp)
  });

  it('should draw separator line at correct position', () => {
    const startY = 20;
    const width = 170;
    const margin = 20;

    addHeader(mockDoc, 'Title', startY, width, defaultOptions);

    expect(mockDoc.setDrawColor).toHaveBeenCalledWith(200);
    expect(mockDoc.line).toHaveBeenCalledWith(
      margin,
      38, // Y position after title and timestamp
      margin + width,
      38
    );
  });

  it('should reset text color to black after rendering', () => {
    addHeader(mockDoc, 'Title', 20, 170, defaultOptions);

    const setTextColorCalls = (mockDoc.setTextColor as jest.Mock).mock.calls;
    const lastCall = setTextColorCalls[setTextColorCalls.length - 1];

    expect(lastCall).toEqual([0]); // Black color
  });

  it('should handle empty title string', () => {
    const y = addHeader(mockDoc, '', 20, 170, defaultOptions);

    expect(mockDoc.text).toHaveBeenCalledWith('', 20, 20);
    expect(y).toBeGreaterThan(20);
  });

  it('should handle very long titles', () => {
    const longTitle = 'A'.repeat(200);
    const y = addHeader(mockDoc, longTitle, 20, 170, defaultOptions);

    expect(mockDoc.text).toHaveBeenCalledWith(longTitle, 20, 20);
    expect(y).toBe(48);
  });

  it('should use correct font sizes for title and timestamp', () => {
    addHeader(mockDoc, 'Title', 20, 170, defaultOptions);

    const fontSizeCalls = (mockDoc.setFontSize as jest.Mock).mock.calls;
    expect(fontSizeCalls).toContainEqual([18]); // Title
    expect(fontSizeCalls).toContainEqual([10]); // Timestamp
  });

  it('should use correct font styles', () => {
    addHeader(mockDoc, 'Title', 20, 170, defaultOptions);

    const fontCalls = (mockDoc.setFont as jest.Mock).mock.calls;
    expect(fontCalls).toContainEqual(['helvetica', 'bold']); // Title
    expect(fontCalls).toContainEqual(['helvetica', 'normal']); // Timestamp
  });
});
