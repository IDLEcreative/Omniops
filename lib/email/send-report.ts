import nodemailer from 'nodemailer';
import { generateCSVContent } from '@/lib/analytics/export-csv';

// Note: This uses nodemailer for SMTP email sending
// For production, consider using Resend API instead (lib/alerts/send-alert-email.ts)

// Lazy-load transporter to avoid issues during build
let transporter: ReturnType<typeof nodemailer.createTransporter> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface ReportData {
  organizationName: string;
  startDate: string;
  endDate: string;
  totalConversations: number;
  avgResponseTime: number;
  sentimentScore: number;
  topQueries: Array<{ query: string; count: number }>;
  summary: {
    totalMessages: number;
    positiveSentiment: number;
    negativeSentiment: number;
    neutralSentiment: number;
  };
}

export async function sendAnalyticsReport(
  to: string,
  period: 'daily' | 'weekly' | 'monthly',
  data: ReportData
) {
  // Generate CSV attachment
  const csvContent = generateCSVContent({
    dateRange: { start: data.startDate, end: data.endDate },
    summary: {
      totalConversations: data.totalConversations,
      avgResponseTime: data.avgResponseTime,
      sentimentScore: data.sentimentScore,
    },
    topQueries: data.topQueries || [],
    dailySentiment: [], // Would be populated with actual data
    languages: [],
    failedSearches: [],
  });

  // Send email with HTML template
  const info = await getTransporter().sendMail({
    from: process.env.SMTP_FROM || '"Analytics Reports" <noreply@omniops.co.uk>',
    to,
    subject: `${period.charAt(0).toUpperCase() + period.slice(1)} Analytics Report - ${data.organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9fafb; }
          .metric-card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
          .metric-label { color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .queries-list { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .query-item { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 ${period.charAt(0).toUpperCase() + period.slice(1)} Analytics Report</h1>
          <p>${data.organizationName}</p>
          <p>${data.startDate} to ${data.endDate}</p>
        </div>

        <div class="content">
          <h2>Key Metrics</h2>

          <div class="metric-card">
            <div class="metric-label">Total Conversations</div>
            <div class="metric-value">${data.totalConversations.toLocaleString()}</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Average Response Time</div>
            <div class="metric-value">${data.avgResponseTime.toFixed(1)}s</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Sentiment Score</div>
            <div class="metric-value">${data.sentimentScore.toFixed(1)}/5</div>
          </div>

          <h2>Sentiment Analysis</h2>
          <div class="metric-card">
            <p>😊 Positive: ${data.summary.positiveSentiment}%</p>
            <p>😐 Neutral: ${data.summary.neutralSentiment}%</p>
            <p>😞 Negative: ${data.summary.negativeSentiment}%</p>
          </div>

          ${data.topQueries && data.topQueries.length > 0 ? `
          <h2>Top 5 Queries</h2>
          <div class="queries-list">
            ${data.topQueries.slice(0, 5).map((q, i) => `
              <div class="query-item">
                <strong>${i + 1}.</strong> ${q.query} <span style="color: #667eea;">(${q.count})</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <p style="margin-top: 30px;">
            📎 See the attached CSV file for detailed analytics data.
          </p>
        </div>

        <div class="footer">
          <p>This is an automated report from your analytics system.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `analytics-${period}-${Date.now()}.csv`,
        content: csvContent,
        contentType: 'text/csv',
      },
    ],
  });

  return info;
}

// Verify SMTP configuration
export async function verifySMTPConfig(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch (error) {
    console.error('SMTP verification failed:', error);
    return false;
  }
}
