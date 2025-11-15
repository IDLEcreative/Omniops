import { DashboardConversationsData } from '@/hooks/use-dashboard-conversations';

export function createMockConversations(
  overrides?: Partial<DashboardConversationsData>
): DashboardConversationsData {
  return {
    total: 156,
    change: 12,
    statusCounts: {
      active: 45,
      waiting: 15,
      resolved: 96,
    },
    languages: [
      { language: 'en', count: 100, percentage: 64 },
      { language: 'es', count: 40, percentage: 26 },
      { language: 'fr', count: 16, percentage: 10 },
    ],
    peakHours: [
      { hour: 9, label: '9 AM', level: 'high', count: 25 },
      { hour: 14, label: '2 PM', level: 'medium', count: 18 },
      { hour: 20, label: '8 PM', level: 'low', count: 8 },
    ],
    recent: [
      {
        id: 'conv-1',
        message: 'How do I reset my password?',
        timestamp: '2025-10-19T10:00:00Z',
        status: 'active',
        customerName: 'Alice',
      },
      {
        id: 'conv-2',
        message: 'Where is my order?',
        timestamp: '2025-10-19T09:45:00Z',
        status: 'resolved',
        customerName: 'Bob',
      },
    ],
    ...overrides,
  };
}
