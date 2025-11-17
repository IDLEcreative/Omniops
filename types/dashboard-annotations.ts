/**
 * Dashboard Annotations Types
 */

export interface ChartAnnotation {
  id: string;
  organizationId: string;
  date: string;
  title: string;
  description: string;
  category: 'campaign' | 'release' | 'incident' | 'other';
  color?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricGoal {
  id: string;
  organizationId: string;
  metric: string;
  targetValue: number;
  currentValue?: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate?: string;
  status: 'active' | 'achieved' | 'expired';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationTranscript {
  id?: string;
  conversationId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  summary?: string;
  duration?: number;
  createdAt?: string;
  metadata?: Record<string, any>;
}