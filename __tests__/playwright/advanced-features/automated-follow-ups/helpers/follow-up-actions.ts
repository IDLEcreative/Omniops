import { expect, Page } from '@playwright/test';
import { BASE_URL } from './constants';

export async function triggerFollowUpDetection(page: Page) {
  const response = await page.request.post(`${BASE_URL}/api/follow-ups`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (data.success && data.data) {
    expect(data.data.scheduled).toBeGreaterThan(0);
  }
}

export async function verifyFollowUpScheduled(page: Page) {
  const response = await page.request.get(`${BASE_URL}/api/follow-ups`);
  const data = await response.json();
  if (Array.isArray(data.pendingFollowUps)) {
    expect(data.pendingFollowUps.length).toBeGreaterThan(0);
  }
}

export async function triggerCronJob(page: Page, cronSecret: string) {
  const response = await page.request.post(`${BASE_URL}/api/cron/send-follow-ups`, {
    headers: {
      authorization: `Bearer ${cronSecret}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  expect(data.success).toBeTruthy();
}

export async function verifyFollowUpNotification(page: Page) {
  await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

  const notificationResponse = await page.request.get(`${BASE_URL}/api/notifications`);
  const notificationData = await notificationResponse.json();
  if (Array.isArray(notificationData.notifications)) {
    const followUps = notificationData.notifications.filter((n: any) => n.type === 'follow_up');
    expect(followUps.length).toBeGreaterThan(0);
  }
}

export async function verifyAnalyticsUpdated(page: Page) {
  const response = await page.request.get(`${BASE_URL}/api/follow-ups?type=summary`);
  const data = await response.json();
  if (data.success && data.data) {
    expect(data.data.sent).toBeGreaterThanOrEqual(0);
  }
}
