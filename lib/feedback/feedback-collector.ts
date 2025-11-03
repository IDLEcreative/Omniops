/**
 * User Feedback Collection System
 *
 * Provides in-widget feedback mechanisms:
 * - Quick satisfaction ratings (thumbs up/down)
 * - Detailed feedback forms
 * - Bug reporting
 * - Feature requests
 * - NPS score collection
 *
 * Used by: Widget embed, dashboard, analytics
 */

import { z } from 'zod';

// ============================================================================
// Feedback Types
// ============================================================================

export enum FeedbackType {
  SATISFACTION = 'satisfaction',
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  GENERAL = 'general',
  NPS = 'nps',
}

export enum SatisfactionRating {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const FeedbackSchema = z.object({
  type: z.nativeEnum(FeedbackType),
  rating: z.number().int().min(1).max(5).optional(),
  npsScore: z.number().int().min(0).max(10).optional(),
  message: z.string().min(1).max(2000).optional(),
  category: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
  conversationId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  domain: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().url().optional(),
});

export type FeedbackData = z.infer<typeof FeedbackSchema>;

// ============================================================================
// Feedback Collector Class
// ============================================================================

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

// ============================================================================
// Feedback Analysis Utilities
// ============================================================================

export class FeedbackAnalyzer {
  /**
   * Calculate Net Promoter Score (NPS)
   * NPS = % Promoters (9-10) - % Detractors (0-6)
   */
  static calculateNPS(scores: number[]): number {
    if (scores.length === 0) return 0;

    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s <= 6).length;
    const total = scores.length;

    return Math.round(((promoters - detractors) / total) * 100);
  }

  /**
   * Calculate average satisfaction rating
   */
  static calculateAverageSatisfaction(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }

  /**
   * Categorize feedback sentiment
   */
  static categorizeSentiment(rating: number): 'negative' | 'neutral' | 'positive' {
    if (rating <= 2) return 'negative';
    if (rating === 3) return 'neutral';
    return 'positive';
  }

  /**
   * Extract common themes from feedback messages
   */
  static extractThemes(messages: string[]): Map<string, number> {
    const themes = new Map<string, number>();

    // Common keywords to track
    const keywords = [
      'slow', 'fast', 'helpful', 'confusing', 'easy', 'difficult',
      'bug', 'error', 'broken', 'great', 'terrible', 'love', 'hate',
      'missing', 'need', 'want', 'feature', 'improvement'
    ];

    for (const message of messages) {
      const lowerMessage = message.toLowerCase();
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          themes.set(keyword, (themes.get(keyword) || 0) + 1);
        }
      }
    }

    return themes;
  }

  /**
   * Identify urgent feedback requiring immediate attention
   */
  static isUrgent(feedback: FeedbackData): boolean {
    if (feedback.type === FeedbackType.BUG) return true;
    if (feedback.rating && feedback.rating <= 2) return true;
    if (feedback.npsScore !== undefined && feedback.npsScore <= 3) return true;

    // Check for urgent keywords
    const urgentKeywords = ['broken', 'crash', 'error', 'urgent', 'critical', 'can\'t'];
    const message = feedback.message?.toLowerCase() || '';
    return urgentKeywords.some(keyword => message.includes(keyword));
  }
}

// ============================================================================
// Browser Integration Helper
// ============================================================================

export function createFeedbackWidget(options: {
  domain: string;
  sessionId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}): HTMLElement {
  const container = document.createElement('div');
  container.id = 'feedback-widget';
  container.style.position = 'fixed';
  container.style.zIndex = '9999';

  // Position the widget
  const position = options.position || 'bottom-right';
  const [vertical, horizontal] = position.split('-');
  container.style[vertical as 'bottom' | 'top'] = '20px';
  container.style[horizontal as 'right' | 'left'] = '20px';

  // Create feedback button
  const button = document.createElement('button');
  button.textContent = '💬 Feedback';
  button.style.padding = '10px 20px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
  button.style.fontWeight = 'bold';
  button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

  button.addEventListener('click', () => {
    // Open feedback modal
    showFeedbackModal(options.domain, options.sessionId);
  });

  container.appendChild(button);
  return container;
}

function showFeedbackModal(domain: string, sessionId: string): void {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'feedback-modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
  overlay.style.zIndex = '10000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  // Create modal content
  const modal = document.createElement('div');
  modal.style.backgroundColor = 'white';
  modal.style.padding = '30px';
  modal.style.borderRadius = '10px';
  modal.style.maxWidth = '500px';
  modal.style.width = '90%';
  modal.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

  modal.innerHTML = `
    <h2 style="margin-top: 0;">Send Feedback</h2>
    <p style="color: #666;">Help us improve your experience</p>

    <div style="margin: 20px 0;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold;">
        How satisfied are you?
      </label>
      <div id="rating-buttons" style="display: flex; gap: 10px; justify-content: center;">
        ${[1, 2, 3, 4, 5].map(rating => `
          <button
            class="rating-btn"
            data-rating="${rating}"
            style="padding: 10px 20px; border: 2px solid #ddd; background: white; cursor: pointer; border-radius: 5px; font-size: 20px;"
          >
            ${rating === 1 ? '😞' : rating === 2 ? '😕' : rating === 3 ? '😐' : rating === 4 ? '🙂' : '😄'}
          </button>
        `).join('')}
      </div>
    </div>

    <div style="margin: 20px 0;">
      <label style="display: block; margin-bottom: 10px; font-weight: bold;">
        What's on your mind?
      </label>
      <textarea
        id="feedback-message"
        placeholder="Tell us more (optional)..."
        style="width: 100%; min-height: 100px; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-family: inherit;"
      ></textarea>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button
        id="cancel-btn"
        style="padding: 10px 20px; border: 2px solid #ddd; background: white; cursor: pointer; border-radius: 5px;"
      >
        Cancel
      </button>
      <button
        id="submit-btn"
        style="padding: 10px 20px; border: none; background: #4CAF50; color: white; cursor: pointer; border-radius: 5px; font-weight: bold;"
      >
        Submit Feedback
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Handle rating selection
  let selectedRating: number | null = null;
  modal.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      selectedRating = parseInt(target.getAttribute('data-rating') || '0');

      // Visual feedback
      modal.querySelectorAll('.rating-btn').forEach(b => {
        (b as HTMLElement).style.borderColor = '#ddd';
        (b as HTMLElement).style.backgroundColor = 'white';
      });
      target.style.borderColor = '#4CAF50';
      target.style.backgroundColor = '#e8f5e9';
    });
  });

  // Handle cancel
  modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // Handle submit
  modal.querySelector('#submit-btn')?.addEventListener('click', async () => {
    const message = (modal.querySelector('#feedback-message') as HTMLTextAreaElement)?.value;

    if (!selectedRating) {
      alert('Please select a rating');
      return;
    }

    const collector = new FeedbackCollector({ domain, sessionId });

    try {
      await collector.submitDetailedFeedback(
        FeedbackType.GENERAL,
        message || 'No additional comments',
        {
          rating: selectedRating,
          category: 'widget_feedback',
        }
      );

      // Show success message
      modal.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">✓</div>
          <h2>Thank you!</h2>
          <p>Your feedback helps us improve.</p>
        </div>
      `;

      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 2000);
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}
