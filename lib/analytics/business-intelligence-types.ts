/**
 * Type definitions for Business Intelligence Analytics
 * Centralized type definitions for all BI modules
 */

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface CustomerJourneyMetrics {
  avgSessionsBeforeConversion: number;
  avgMessagesPerSession: number;
  commonPaths: JourneyPath[];
  dropOffPoints: DropOffPoint[];
  conversionRate: number;
  timeToConversion: number; // minutes
}

export interface JourneyPath {
  path: string[];
  frequency: number;
  conversionRate: number;
}

export interface DropOffPoint {
  stage: string;
  dropOffRate: number;
  avgTimeSpent: number;
  commonQueries: string[];
}

export interface ContentGapAnalysis {
  unansweredQueries: UnansweredQuery[];
  lowConfidenceTopics: string[];
  suggestedContent: ContentSuggestion[];
  coverageScore: number; // 0-100
}

export interface UnansweredQuery {
  query: string;
  frequency: number;
  avgConfidence: number;
  lastAsked: Date;
}

export interface ContentSuggestion {
  topic: string;
  demandScore: number;
  suggestedType: 'faq' | 'guide' | 'product_info';
  relatedQueries: string[];
}

export interface PeakUsagePattern {
  hourlyDistribution: HourlyUsage[];
  dailyDistribution: DailyUsage[];
  peakHours: { hour: number; load: number }[];
  quietHours: { hour: number; load: number }[];
  predictedNextPeak: Date;
  resourceRecommendation: string;
}

export interface HourlyUsage {
  hour: number;
  avgMessages: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface DailyUsage {
  dayOfWeek: number;
  avgSessions: number;
  peakHour: number;
  totalMessages: number;
}

export interface ConversionFunnel {
  stages: FunnelStage[];
  overallConversionRate: number;
  avgTimeInFunnel: number; // minutes
  bottlenecks: Bottleneck[];
}

export interface FunnelStage {
  name: string;
  enteredCount: number;
  completedCount: number;
  conversionRate: number;
  avgDuration: number;
  dropOffReasons: string[];
}

export interface Bottleneck {
  stage: string;
  severity: 'high' | 'medium' | 'low';
  impact: number; // potential conversion increase if fixed
  recommendation: string;
}

// Internal data structures for processing
export interface ConversationData {
  id: string;
  session_id: string;
  created_at: string;
  metadata?: {
    converted?: boolean;
    confidence?: number;
    [key: string]: any;
  };
  messages?: MessageData[];
}

export interface MessageData {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  metadata?: {
    confidence?: number;
    [key: string]: any;
  };
}
