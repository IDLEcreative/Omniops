/**
 * Feedback Widget - Browser UI Components
 *
 * Provides embeddable feedback UI for browser environments
 */

import { FeedbackCollector } from './collector';
import { FeedbackType } from './types';

/**
 * Create and inject feedback widget button
 */
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

/**
 * Display feedback modal for user input
 */
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
