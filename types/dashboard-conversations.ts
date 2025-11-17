/**
 * Dashboard Conversations Types
 */

export type DashboardConversationStatus = 'active' | 'waiting' | 'resolved';

export interface DashboardRecentConversation {
  id: string;
  createdAt: string;
  status: DashboardConversationStatus;
  lastMessagePreview: string;
  lastMessageAt: string;
  customerName: string | null;
}

export interface DashboardLanguageDistribution {
  language: string;
  percentage: number;
  count: number;
}

export interface DashboardConversationFilter {
  status?: DashboardConversationStatus;
  sentiment?: 'positive' | 'negative' | 'neutral';
  domain?: string;
  customerEmail?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DashboardConversationMetrics {
  totalConversations: number;
  activeConversations: number;
  resolvedToday: number;
  averageResolutionTime: number;
  satisfactionScore: number;
}

export interface DashboardConversationItem {
  id: string;
  customerEmail: string;
  customerName?: string;
  domain: string;
  status: DashboardConversationStatus;
  sentiment?: 'positive' | 'negative' | 'neutral';
  messageCount: number;
  lastMessage: {
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
  metadata?: {
    productViewed?: boolean;
    cartCreated?: boolean;
    checkoutStarted?: boolean;
    orderCompleted?: boolean;
  };
}