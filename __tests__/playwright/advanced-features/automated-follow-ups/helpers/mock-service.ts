import { Page } from '@playwright/test';
import { CRON_SECRET } from './constants';
import { FollowUpMessage } from './types';

export interface FollowUpService {
  getState(): {
    pendingFollowUps: FollowUpMessage[];
    sentFollowUps: FollowUpMessage[];
    notifications: any[];
    analytics: {
      total_scheduled: number;
      total_sent: number;
      response_rate: number;
    };
  };
  addPendingFollowUp(followUp: Partial<FollowUpMessage>): FollowUpMessage;
}

export async function mockFollowUpAPIs(page: Page): Promise<FollowUpService> {
  const followUpState = {
    pendingFollowUps: [] as FollowUpMessage[],
    sentFollowUps: [] as FollowUpMessage[],
    notifications: [] as any[],
    analytics: {
      total_scheduled: 0,
      total_sent: 0,
      response_rate: 0,
    },
  };

  await page.route('**/api/follow-ups', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      const url = new URL(route.request().url());
      const type = url.searchParams.get('type');

      if (type === 'summary') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              pending: followUpState.pendingFollowUps.length,
              sent: followUpState.sentFollowUps.length,
              analytics: followUpState.analytics,
            },
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          pendingFollowUps: followUpState.pendingFollowUps,
        }),
      });
    }

    if (method === 'POST') {
      const newFollowUp: FollowUpMessage = {
        id: `followup_${Date.now()}`,
        conversation_id: `conv_${Date.now()}`,
        reason: 'abandoned_conversation',
        channel: 'in_app',
        status: 'pending',
        scheduled_at: new Date(Date.now() + 1000).toISOString(),
        content: 'We noticed you had a question earlier. Would you like to continue the conversation?',
      };

      followUpState.pendingFollowUps.push(newFollowUp);
      followUpState.analytics.total_scheduled += 1;

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            candidates_found: 1,
            scheduled: 1,
            skipped: 0,
          },
        }),
      });
    }
  });

  await page.route('**/api/cron/send-follow-ups', async (route) => {
    const authHeader = route.request().headers()['authorization'];
    if (!authHeader?.includes(CRON_SECRET)) {
      return route.fulfill({ status: 403 });
    }

    const toSend = [...followUpState.pendingFollowUps];
    followUpState.pendingFollowUps = [];

    toSend.forEach((followUp) => {
      followUp.status = 'sent';
      followUpState.sentFollowUps.push(followUp);
      followUpState.analytics.total_sent += 1;

      if (followUp.channel === 'in_app') {
        followUpState.notifications.push({
          id: `notif_${Date.now()}`,
          type: 'follow_up',
          title: 'Need help?',
          message: followUp.content,
          created_at: new Date().toISOString(),
        });
      }
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        sent: toSend.length,
        failed: 0,
        timestamp: new Date().toISOString(),
      }),
    });
  });

  await page.route('**/api/notifications**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        notifications: followUpState.notifications,
      }),
    });
  });

  return {
    getState: () => followUpState,
    addPendingFollowUp: (followUp: Partial<FollowUpMessage>) => {
      const newFollowUp: FollowUpMessage = {
        id: followUp.id || `followup_${Date.now()}`,
        conversation_id: followUp.conversation_id || `conv_${Date.now()}`,
        reason: followUp.reason || 'abandoned_conversation',
        channel: followUp.channel || 'in_app',
        status: 'pending',
        scheduled_at: followUp.scheduled_at || new Date(Date.now() + 1000).toISOString(),
        content: followUp.content || 'Default follow-up message',
      };

      followUpState.pendingFollowUps.push(newFollowUp);
      followUpState.analytics.total_scheduled += 1;
      return newFollowUp;
    },
  };
}
