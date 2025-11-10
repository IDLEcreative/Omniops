import { createServiceRoleClient } from '@/lib/supabase-server';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';

interface ValidationResult {
  conversationsChecked: number;
  validMetadata: number;
  missingMetadata: number;
  invalidMetadata: number;
  sampleMetadata: any | null;
  analyticsTest: {
    success: boolean;
    dailyActiveUsers?: number;
    sessionMetrics?: any;
    shoppingBehavior?: any;
    error?: string;
  };
  issues: string[];
  success: boolean;
}

interface PageView {
  url: string;
  title?: string;
  timestamp: string;
  duration_seconds?: number;
}

interface SessionMetadata {
  session_id: string;
  domain: string;
  page_views: PageView[];
  total_pages?: number;
}

function validateSessionMetadata(metadata: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!metadata) {
    issues.push('metadata is null or undefined');
    return { valid: false, issues };
  }

  const sessionMetadata = metadata.session_metadata as SessionMetadata | undefined;

  if (!sessionMetadata) {
    issues.push('session_metadata field is missing');
    return { valid: false, issues };
  }

  // Validate session_id
  if (!sessionMetadata.session_id || typeof sessionMetadata.session_id !== 'string') {
    issues.push('session_id is missing or not a string');
  }

  // Validate domain
  if (!sessionMetadata.domain || typeof sessionMetadata.domain !== 'string') {
    issues.push('domain is missing or not a string');
  }

  // Validate page_views
  if (!Array.isArray(sessionMetadata.page_views)) {
    issues.push('page_views is not an array');
  } else if (sessionMetadata.page_views.length === 0) {
    issues.push('page_views array is empty');
  } else {
    // Validate each page view
    sessionMetadata.page_views.forEach((view, index) => {
      if (!view.url || typeof view.url !== 'string') {
        issues.push(`page_views[${index}]: url is missing or not a string`);
      }
      if (!view.timestamp || typeof view.timestamp !== 'string') {
        issues.push(`page_views[${index}]: timestamp is missing or not a string`);
      }
      if (view.duration_seconds !== undefined && typeof view.duration_seconds !== 'number') {
        issues.push(`page_views[${index}]: duration_seconds is not a number`);
      }
    });
  }

  return { valid: issues.length === 0, issues };
}

async function verifySessionMetadataStorage(): Promise<ValidationResult> {
  const result: ValidationResult = {
    conversationsChecked: 0,
    validMetadata: 0,
    missingMetadata: 0,
    invalidMetadata: 0,
    sampleMetadata: null,
    analyticsTest: { success: false },
    issues: [],
    success: false,
  };

  try {
    // Initialize Supabase client
    const supabase = await createServiceRoleClient();

    // Check if client was successfully initialized
    if (!supabase) {
      result.issues.push('Failed to initialize Supabase client. Check environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      return result;
    }

    // Query recent conversations (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, domain_id, metadata, created_at')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      result.issues.push(`Database query error: ${error.message}`);
      return result;
    }

    if (!conversations || conversations.length === 0) {
      // Try to find any conversations in a wider time range
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: olderConversations, error: olderError } = await supabase
        .from('conversations')
        .select('id, created_at')
        .gte('created_at', sevenDaysAgo)
        .limit(1);

      if (!olderError && olderConversations && olderConversations.length > 0) {
        result.issues.push(
          `No conversations found in the last hour. ` +
          `Found ${olderConversations.length > 0 ? 'conversations' : 'no conversations'} in the last 7 days. ` +
          `The verification requires recent conversation activity.`
        );
      } else {
        result.issues.push('No conversations found in the last hour or 7 days. Ensure chat widget is being used.');
      }
      return result;
    }

    result.conversationsChecked = conversations.length;

    // Validate each conversation's session metadata
    conversations.forEach((conv) => {
      const validation = validateSessionMetadata(conv.metadata);

      if (!conv.metadata || !conv.metadata.session_metadata) {
        result.missingMetadata++;
      } else if (!validation.valid) {
        result.invalidMetadata++;
        result.issues.push(
          `Conversation ${conv.id}: ${validation.issues.join(', ')}`
        );
      } else {
        result.validMetadata++;
        // Store first valid sample
        if (!result.sampleMetadata) {
          result.sampleMetadata = conv.metadata.session_metadata;
        }
      }
    });

    // Test analytics calculation
    try {
      const analyticsResult = calculateUserAnalytics(conversations, { days: 7 });

      if (analyticsResult && typeof analyticsResult === 'object') {
        result.analyticsTest = {
          success: true,
          dailyActiveUsers: analyticsResult.userMetrics?.dailyActiveUsers || 0,
          sessionMetrics: analyticsResult.sessionMetrics || {},
          shoppingBehavior: analyticsResult.shoppingBehavior || {},
        };
      } else {
        result.analyticsTest = {
          success: false,
          error: 'Analytics function returned invalid data',
        };
      }
    } catch (analyticsError: any) {
      result.analyticsTest = {
        success: false,
        error: analyticsError.message || 'Unknown analytics calculation error',
      };
    }

    // Determine overall success
    const successRate = result.conversationsChecked > 0
      ? (result.validMetadata / result.conversationsChecked) * 100
      : 0;

    result.success = successRate >= 80 && result.analyticsTest.success;

    return result;
  } catch (error: any) {
    result.issues.push(`Fatal error: ${error.message}`);
    return result;
  }
}

// Execute verification
verifySessionMetadataStorage().then((report) => {
  console.log('\n=== Session Metadata Storage Verification Report ===\n');

  console.log(`Conversations Checked: ${report.conversationsChecked}`);
  console.log(
    `Valid Session Metadata: ${report.validMetadata} (${
      report.conversationsChecked > 0
        ? Math.round((report.validMetadata / report.conversationsChecked) * 100)
        : 0
    }%)`
  );
  console.log(
    `Missing Metadata: ${report.missingMetadata} (${
      report.conversationsChecked > 0
        ? Math.round((report.missingMetadata / report.conversationsChecked) * 100)
        : 0
    }%)`
  );
  console.log(
    `Invalid Metadata: ${report.invalidMetadata} (${
      report.conversationsChecked > 0
        ? Math.round((report.invalidMetadata / report.conversationsChecked) * 100)
        : 0
    }%)`
  );

  if (report.sampleMetadata) {
    console.log('\nSample Session Metadata:');
    console.log(JSON.stringify(report.sampleMetadata, null, 2));
  }

  console.log('\nAnalytics Calculation Test:');
  if (report.analyticsTest.success) {
    console.log(`✅ Daily Active Users: ${report.analyticsTest.dailyActiveUsers}`);
    console.log(`✅ Session Metrics:`, report.analyticsTest.sessionMetrics);
    console.log(`✅ Shopping Behavior:`, report.analyticsTest.shoppingBehavior);
  } else {
    console.log(`❌ Analytics Test Failed: ${report.analyticsTest.error}`);
  }

  if (report.issues.length > 0) {
    console.log('\nIssues Found:');
    report.issues.forEach((issue) => console.log(`  - ${issue}`));
  }

  console.log(`\nStatus: ${report.success ? 'PASS ✅' : 'FAIL ❌'}\n`);

  process.exit(report.success ? 0 : 1);
});
