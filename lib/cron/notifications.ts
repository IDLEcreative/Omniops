export interface NotificationPayload {
  type: 'success' | 'failure' | 'warning';
  title: string;
  message: string;
  details?: Record<string, any>;
}

export async function sendNotifications(payload: NotificationPayload) {
  const promises: Promise<any>[] = [];

  // Email
  if (process.env.NOTIFICATION_EMAIL_ENABLED === 'true') {
    promises.push(sendEmail(payload));
  }

  // Slack
  if (process.env.NOTIFICATION_SLACK_ENABLED === 'true') {
    promises.push(sendSlack(payload));
  }

  // Discord
  if (process.env.NOTIFICATION_DISCORD_ENABLED === 'true') {
    promises.push(sendDiscord(payload));
  }

  await Promise.allSettled(promises);
}

async function sendEmail(payload: NotificationPayload) {
  const nodemailer = await import('nodemailer');

  const transport = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transport.sendMail({
    from: process.env.NOTIFICATION_EMAIL_FROM,
    to: process.env.NOTIFICATION_EMAIL_TO,
    subject: `[${payload.type.toUpperCase()}] ${payload.title}`,
    html: `
      <h2>${payload.title}</h2>
      <p>${payload.message}</p>
      ${payload.details ? `<pre>${JSON.stringify(payload.details, null, 2)}</pre>` : ''}
    `,
  });
}

async function sendSlack(payload: NotificationPayload) {
  const webhook = process.env.NOTIFICATION_SLACK_WEBHOOK;
  if (!webhook) return;

  const color = payload.type === 'success' ? 'good' :
                payload.type === 'failure' ? 'danger' : 'warning';

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: payload.title,
        text: payload.message,
        fields: payload.details ? Object.entries(payload.details).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })) : [],
      }],
    }),
  });
}

async function sendDiscord(payload: NotificationPayload) {
  const webhook = process.env.NOTIFICATION_DISCORD_WEBHOOK;
  if (!webhook) return;

  const color = payload.type === 'success' ? 0x00ff00 :
                payload.type === 'failure' ? 0xff0000 : 0xffa500;

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: payload.title,
        description: payload.message,
        color,
        fields: payload.details ? Object.entries(payload.details).map(([key, value]) => ({
          name: key,
          value: String(value),
        })) : [],
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}
