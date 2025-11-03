/**
 * Feature Flags Admin API
 *
 * Purpose: API endpoints for managing feature flags via admin UI
 *
 * Endpoints:
 * - GET: Retrieve feature flags for customer/organization
 * - POST: Update feature flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlagManager } from '@/lib/feature-flags';
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';
import { FeatureFlags } from '@/lib/chat-widget/default-config';

/**
 * GET /api/admin/feature-flags
 *
 * Retrieve all feature flags with their current status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId') || undefined;
    const organizationId = searchParams.get('organizationId') || undefined;

    const flagManager = getFeatureFlagManager();
    const rolloutManager = getPilotRolloutManager();

    // Get current flags
    const evaluation = await flagManager.getFlags({ customerId, organizationId });
    const config = evaluation.config;

    // Get rollout configurations and stats
    const features = [
      // Phase 1
      {
        name: 'phase1_parent_storage',
        displayName: 'Parent Window Storage',
        description: 'Store conversation data in parent window localStorage',
        enabled: config.sessionPersistence.phase1.parentStorage,
        phase: 1 as const,
        rollout: await rolloutManager.getRolloutConfig('phase1_parent_storage'),
        stats: await rolloutManager.getRolloutStats('phase1_parent_storage'),
      },
      {
        name: 'phase1_cross_domain',
        displayName: 'Cross-Domain Messaging',
        description: 'Enable iframe-parent communication across domains',
        enabled: config.sessionPersistence.phase1.crossDomainMessaging,
        phase: 1 as const,
        rollout: await rolloutManager.getRolloutConfig('phase1_cross_domain'),
        stats: await rolloutManager.getRolloutStats('phase1_cross_domain'),
      },

      // Phase 2
      {
        name: 'phase2_enhanced_storage',
        displayName: 'Enhanced Storage',
        description: 'Advanced storage with compression and versioning',
        enabled: config.sessionPersistence.phase2.enhancedStorage,
        phase: 2 as const,
        rollout: await rolloutManager.getRolloutConfig('phase2_enhanced_storage'),
        stats: await rolloutManager.getRolloutStats('phase2_enhanced_storage'),
      },
      {
        name: 'phase2_connection_monitoring',
        displayName: 'Connection Monitoring',
        description: 'Monitor connection health and auto-reconnect',
        enabled: config.sessionPersistence.phase2.connectionMonitoring,
        phase: 2 as const,
        rollout: await rolloutManager.getRolloutConfig('phase2_connection_monitoring'),
        stats: await rolloutManager.getRolloutStats('phase2_connection_monitoring'),
      },
      {
        name: 'phase2_retry_logic',
        displayName: 'Retry Logic',
        description: 'Auto-retry failed operations with exponential backoff',
        enabled: config.sessionPersistence.phase2.retryLogic,
        phase: 2 as const,
        rollout: await rolloutManager.getRolloutConfig('phase2_retry_logic'),
        stats: await rolloutManager.getRolloutStats('phase2_retry_logic'),
      },

      // Phase 3
      {
        name: 'phase3_tab_sync',
        displayName: 'Multi-Tab Synchronization',
        description: 'Real-time sync across browser tabs via BroadcastChannel',
        enabled: config.sessionPersistence.phase3.tabSync,
        phase: 3 as const,
        rollout: await rolloutManager.getRolloutConfig('phase3_tab_sync'),
        stats: await rolloutManager.getRolloutStats('phase3_tab_sync'),
      },
      {
        name: 'phase3_performance_mode',
        displayName: 'Performance Optimization',
        description: 'Virtual scrolling and memory management for 500+ messages',
        enabled: config.sessionPersistence.phase3.performanceMode,
        phase: 3 as const,
        rollout: await rolloutManager.getRolloutConfig('phase3_performance_mode'),
        stats: await rolloutManager.getRolloutStats('phase3_performance_mode'),
      },
      {
        name: 'phase3_analytics',
        displayName: 'Session Analytics',
        description: 'Track session metrics and usage patterns',
        enabled: config.sessionPersistence.phase3.analytics,
        phase: 3 as const,
        rollout: await rolloutManager.getRolloutConfig('phase3_analytics'),
        stats: await rolloutManager.getRolloutStats('phase3_analytics'),
      },
    ];

    return NextResponse.json({
      success: true,
      features,
      evaluation: {
        source: evaluation.source,
        evaluatedAt: evaluation.evaluatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting feature flags:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags
 *
 * Update feature flag for customer or organization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureName, enabled, customerId, organizationId, changedBy, reason } = body;

    if (!featureName) {
      return NextResponse.json(
        { success: false, error: 'featureName is required' },
        { status: 400 }
      );
    }

    const flagManager = getFeatureFlagManager();

    // Map feature name to config path
    const flagUpdate = mapFeatureNameToConfig(featureName, enabled);

    // Update flags
    let result;
    if (customerId) {
      result = await flagManager.setCustomerFlags(
        customerId,
        flagUpdate,
        changedBy,
        reason
      );
    } else if (organizationId) {
      result = await flagManager.setOrganizationFlags(
        organizationId,
        flagUpdate,
        changedBy,
        reason
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'customerId or organizationId is required' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating feature flags:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Map feature name to configuration structure
 */
function mapFeatureNameToConfig(featureName: string, enabled: boolean): any {
  const mapping: Record<string, any> = {
    phase1_parent_storage: {
      sessionPersistence: { phase1: { parentStorage: enabled } },
    },
    phase1_cross_domain: {
      sessionPersistence: { phase1: { crossDomainMessaging: enabled } },
    },
    phase2_enhanced_storage: {
      sessionPersistence: { phase2: { enhancedStorage: enabled } },
    },
    phase2_connection_monitoring: {
      sessionPersistence: { phase2: { connectionMonitoring: enabled } },
    },
    phase2_retry_logic: {
      sessionPersistence: { phase2: { retryLogic: enabled } },
    },
    phase3_tab_sync: {
      sessionPersistence: { phase3: { tabSync: enabled } },
    },
    phase3_performance_mode: {
      sessionPersistence: { phase3: { performanceMode: enabled } },
    },
    phase3_analytics: {
      sessionPersistence: { phase3: { analytics: enabled } },
    },
  };

  return mapping[featureName] || {};
}
