/**
 * AI Frustration Detector
 *
 * @purpose Detect when users are frustrated, confused, or need human assistance
 * @flow Analyzes message content and conversation patterns for frustration signals
 */

export interface FrustrationSignals {
  hasFrustration: boolean;
  score: number; // 0-100, higher = more frustrated
  indicators: string[];
  suggestion: 'human' | 'none';
}

/**
 * Keywords and phrases indicating frustration
 */
const FRUSTRATION_KEYWORDS = [
  // Direct frustration
  'frustrated', 'annoyed', 'angry', 'upset', 'mad',
  // Confusion
  'confused', 'lost', 'don\'t understand', 'not understanding', 'not getting',
  // Repetition (asking same thing)
  'already told you', 'said that', 'mentioned', 'repeat',
  // Escalation requests
  'speak to', 'talk to', 'human', 'person', 'manager', 'supervisor', 'real person',
  'actual person', 'someone', 'representative', 'agent',
  // Negative experience
  'not helpful', 'doesn\'t help', 'useless', 'waste of time', 'not working',
  // Urgency
  'urgent', 'emergency', 'asap', 'immediately', 'right now', 'hurry',
  // Give up signals
  'forget it', 'never mind', 'give up', 'whatever',
];

/**
 * Patterns indicating user needs human help
 */
const ESCALATION_PATTERNS = [
  /can i (speak|talk) to (a|an)? (human|person|agent|manager)/i,
  /need (a|an)? (real )?person/i,
  /transfer (me )?to (a|an)? (human|person|agent)/i,
  /(this|you) (is|are) not helping/i,
  /i('ve| have) asked (this )?multiple times/i,
  /still (not|don't) (understand|get it)/i,
];

/**
 * Analyze a user message for frustration signals
 */
export function detectFrustration(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): FrustrationSignals {
  const messageLower = userMessage.toLowerCase();
  const indicators: string[] = [];
  let score = 0;

  // Check for frustration keywords
  for (const keyword of FRUSTRATION_KEYWORDS) {
    if (messageLower.includes(keyword.toLowerCase())) {
      indicators.push(`Contains keyword: "${keyword}"`);
      score += 10;
    }
  }

  // Check for escalation patterns
  for (const pattern of ESCALATION_PATTERNS) {
    if (pattern.test(messageLower)) {
      indicators.push('Explicitly requested human help');
      score += 30; // Strong signal
    }
  }

  // Check for excessive punctuation (!!!, ???)
  const exclamationCount = (userMessage.match(/!/g) || []).length;
  const questionMarkCount = (userMessage.match(/\?/g) || []).length;
  if (exclamationCount >= 3) {
    indicators.push('Multiple exclamation marks (frustration)');
    score += 15;
  }
  if (questionMarkCount >= 3) {
    indicators.push('Multiple question marks (confusion)');
    score += 10;
  }

  // Check for ALL CAPS (shouting)
  const capsWords = userMessage.match(/\b[A-Z]{3,}\b/g) || [];
  if (capsWords.length >= 2) {
    indicators.push('Excessive capitalization');
    score += 15;
  }

  // Check for repetition in conversation history
  if (conversationHistory.length >= 4) {
    const userMessages = conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase().trim());

    // Check if user is repeating similar questions
    const lastUserMessage = userMessages[userMessages.length - 1];
    const previousUserMessages = userMessages.slice(0, -1);

    for (const prevMsg of previousUserMessages) {
      // Simple similarity check (contains 50%+ same words)
      const currentWords = new Set(lastUserMessage.split(/\s+/));
      const prevWords = prevMsg.split(/\s+/);
      const overlap = prevWords.filter(word => currentWords.has(word)).length;
      const similarity = overlap / Math.max(currentWords.size, prevWords.length);

      if (similarity > 0.5 && prevMsg.length > 10) {
        indicators.push('User repeating similar questions');
        score += 20;
        break;
      }
    }
  }

  // Check conversation length - long conversations may need human
  if (conversationHistory.length >= 10) {
    indicators.push('Long conversation (10+ messages)');
    score += 10;
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine suggestion
  const suggestion = score >= 50 ? 'human' : 'none';

  return {
    hasFrustration: score >= 30, // Threshold for any frustration
    score,
    indicators,
    suggestion,
  };
}

/**
 * Generate helpful response when frustration is detected
 */
export function generateFrustrationResponse(signals: FrustrationSignals): string {
  if (signals.suggestion === 'human') {
    return `I sense you might need more personalized assistance. Would you like me to connect you with a human agent? Just click the "Need Human Help?" button below, and someone from our team will assist you shortly.`;
  }

  if (signals.hasFrustration && signals.score >= 30) {
    return `I'm here to help! If I'm not providing the assistance you need, please let me know or request a human agent using the button below.`;
  }

  return '';
}

/**
 * Check if AI should automatically suggest human handoff
 * (Used in chat API to add suggestion to response)
 */
export function shouldSuggestHuman(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): {
  suggest: boolean;
  reason: string;
  addToResponse: string;
} {
  const signals = detectFrustration(userMessage, conversationHistory);

  if (signals.suggestion === 'human') {
    return {
      suggest: true,
      reason: signals.indicators.join(', '),
      addToResponse: generateFrustrationResponse(signals),
    };
  }

  return {
    suggest: false,
    reason: '',
    addToResponse: '',
  };
}
