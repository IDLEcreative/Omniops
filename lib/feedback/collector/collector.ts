/**
 * Feedback Collector
 *
 * Core class for submitting feedback to the API
 */

import { FeedbackType, FeedbackSchema, type FeedbackData } from './types';

export class FeedbackCollector {
  private domain: string;
  private sessionId: string;
  private apiEndpoint: string;

  constructor(options: {
    domain: string;
    sessionId: string;
    apiEndpoint?: string;
  }) {
    this.domain = options.domain;
    this.sessionId = options.sessionId;
    this.apiEndpoint = options.apiEndpoint || '/api/feedback';
  }

  /**
   * Submit quick satisfaction rating (thumbs up/down)
   */
  async submitQuickRating(
    rating: 1 | 5,
    conversationId?: string
  ): Promise<void> {
    await this.submitFeedback({
      type: FeedbackType.SATISFACTION,
      rating,
      conversationId,
      sessionId: this.sessionId,
      domain: this.domain,
    });
  }

  /**
   * Submit detailed feedback with message
   */
  async submitDetailedFeedback(
    type: FeedbackType,
    message: string,
    options?: {
      category?: string;
      rating?: number;
      conversationId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    await this.submitFeedback({
      type,
      message,
      category: options?.category,
      rating: options?.rating,
      conversationId: options?.conversationId,
      metadata: options?.metadata,
      sessionId: this.sessionId,
      domain: this.domain,
    });
  }

  /**
   * Submit bug report
   */
  async submitBugReport(
    description: string,
    options?: {
      category?: string;
      conversationId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    await this.submitFeedback({
      type: FeedbackType.BUG,
      message: description,
      category: options?.category || 'bug',
      conversationId: options?.conversationId,
      metadata: {
        ...options?.metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      sessionId: this.sessionId,
      domain: this.domain,
    });
  }

  /**
   * Submit feature request
   */
  async submitFeatureRequest(
    description: string,
    options?: {
      category?: string;
      conversationId?: string;
    }
  ): Promise<void> {
    await this.submitFeedback({
      type: FeedbackType.FEATURE_REQUEST,
      message: description,
      category: options?.category || 'feature_request',
      conversationId: options?.conversationId,
      sessionId: this.sessionId,
      domain: this.domain,
    });
  }

  /**
   * Submit NPS score (0-10)
   */
  async submitNPS(
    score: number,
    comment?: string
  ): Promise<void> {
    if (score < 0 || score > 10) {
      throw new Error('NPS score must be between 0 and 10');
    }

    await this.submitFeedback({
      type: FeedbackType.NPS,
      npsScore: score,
      message: comment,
      sessionId: this.sessionId,
      domain: this.domain,
    });
  }

  /**
   * Core feedback submission method
   */
  private async submitFeedback(data: FeedbackData): Promise<void> {
    try {
      // Validate data
      FeedbackSchema.parse(data);

      // Submit to API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.statusText}`);
      }

      // Track submission in analytics
      this.trackFeedbackSubmission(data.type);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Track feedback submission for analytics
   */
  private trackFeedbackSubmission(type: FeedbackType): void {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'feedback_submitted', {
        feedback_type: type,
        domain: this.domain,
        session_id: this.sessionId,
      });
    }
  }
}
