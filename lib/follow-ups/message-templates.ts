/**
 * Follow-up Message Templates
 *
 * Contains all message templates for different follow-up reasons
 * across email and in-app channels.
 */

import type { FollowUpCandidate, FollowUpReason } from './detector';

export interface MessageTemplate {
  subject: string;
  content: string;
}

export interface ChannelTemplates {
  email: MessageTemplate;
  in_app: MessageTemplate;
}

/**
 * All follow-up message templates by reason and channel
 */
export const FOLLOW_UP_TEMPLATES: Record<FollowUpReason, ChannelTemplates> = {
  abandoned_conversation: {
    email: {
      subject: 'Did you find what you were looking for?',
      content: `Hi there,

We noticed you were asking about something earlier but didn't get a chance to fully assist you.

We'd love to help! Feel free to reply to this email or visit our chat again, and we'll make sure your questions get answered.

Best regards,
The Support Team`,
    },
    in_app: {
      subject: 'Need help?',
      content: 'We noticed you had a question earlier. Would you like to continue the conversation?',
    },
  },
  unresolved_issue: {
    email: {
      subject: 'Following up on your recent question',
      content: `Hi,

We wanted to check in about your recent conversation with us. We noticed it might not have been fully resolved.

Is there anything else we can help you with?

Please don't hesitate to reach out if you need further assistance.

Best regards,
The Support Team`,
    },
    in_app: {
      subject: 'Issue resolved?',
      content: 'We want to make sure your question was fully answered. Need any more help?',
    },
  },
  low_satisfaction: {
    email: {
      subject: 'We\'d like to help',
      content: `Hi,

We noticed your recent experience might not have met your expectations, and we sincerely apologize.

Your satisfaction is important to us. If there's anything we can do to help or improve, please let us know.

A member of our team is standing by to assist you personally.

Best regards,
The Support Team`,
    },
    in_app: {
      subject: 'Can we help?',
      content: 'We want to make things right. A support specialist is available to assist you personally.',
    },
  },
  cart_abandonment: {
    email: {
      subject: 'You left something in your cart',
      content: `Hi,

We noticed you were interested in some products but didn't complete your purchase.

Your items are still waiting for you! If you had any questions or concerns, we're here to help.

Reply to this email or visit our chat, and we'll make sure you get what you need.

Best regards,
The Support Team`,
    },
    in_app: {
      subject: 'Complete your purchase?',
      content: 'You have items in your cart. Need help completing your order?',
    },
  },
  unanswered_question: {
    email: {
      subject: 'We have an answer for you',
      content: `Hi,

We noticed you asked a question that we may not have fully answered.

We'd love to help! Just reply to this email or visit our chat again.

Best regards,
The Support Team`,
    },
    in_app: {
      subject: 'Got your answer?',
      content: 'We want to make sure your question was answered. Still need help?',
    },
  },
  product_inquiry: {
    email: {
      subject: 'About the product you asked about',
      content: `Hi,

We saw you were interested in one of our products.

If you have any questions about features, pricing, or availability, we're here to help!

Best regards,
The Support Team`,
    },
    in_app: {
      subject: 'Product questions?',
      content: 'We can help you learn more about the products you were looking at.',
    },
  },
};

/**
 * Generate follow-up message content based on reason and channel
 */
export function generateFollowUpMessage(
  candidate: FollowUpCandidate,
  channel: 'email' | 'in_app'
): MessageTemplate {
  const template = FOLLOW_UP_TEMPLATES[candidate.reason][channel];
  return template;
}
