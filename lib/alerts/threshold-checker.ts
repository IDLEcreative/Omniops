/**
 * Alert Threshold Checker
 * Monitors analytics metrics and triggers alerts when thresholds are violated
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { sendAlertNotifications } from './notification-handlers';

/**
 * Format metric name for display
 */
export function formatMetricName(metric: string): string {
  let formatted = metric
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Replace special acronyms (must be whole words)
  formatted = formatted.replace(/\bApi\b/g, 'API');
  formatted = formatted.replace(/\bCpu\b/g, 'CPU');
  formatted = formatted.replace(/\bRam\b/g, 'RAM');

  return formatted;
}

export interface AlertThreshold {
  id: string;
  organization_id: string;
  metric: string;
  condition: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  notification_channels: string[];
}

export interface MetricValues {
  response_time?: number;
  error_rate?: number;
  sentiment_score?: number;
  conversion_rate?: number;
  resolution_rate?: number;
  message_volume?: number;
  [key: string]: number | undefined;
}

export interface TriggeredAlert {
  threshold: AlertThreshold;
  value: number;
  timestamp: Date;
}

/**
 * Check all active thresholds against current metric values
 * Triggers alerts and notifications for violations
 */
export async function checkThresholds(
  organizationId: string,
  metrics: MetricValues
): Promise<TriggeredAlert[]> {
  const supabase = await createServiceRoleClient();

  // Get all active thresholds for this organization
  const { data: thresholds, error } = await supabase
    .from('alert_thresholds')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('enabled', true);

  if (error) {
    console.error('[Alert Threshold] Error fetching thresholds:', error);
    return [];
  }

  if (!thresholds || thresholds.length === 0) {
    return [];
  }

  const triggeredAlerts: TriggeredAlert[] = [];

  for (const threshold of thresholds as AlertThreshold[]) {
    const value = metrics[threshold.metric];

    // Skip if metric not provided
    if (value === undefined || value === null) {
      continue;
    }

    // Check if threshold is violated
    const isViolated =
      (threshold.condition === 'above' && value > threshold.threshold) ||
      (threshold.condition === 'below' && value < threshold.threshold);

    if (isViolated) {
      // Record alert in history
      const { error: historyError } = await supabase.from('alert_history').insert({
        threshold_id: threshold.id,
        organization_id: organizationId,
        metric: threshold.metric,
        value,
        threshold: threshold.threshold,
        condition: threshold.condition,
        notification_sent: false,
      });

      if (historyError) {
        console.error('[Alert Threshold] Error recording alert history:', historyError);
      }

      triggeredAlerts.push({
        threshold,
        value,
        timestamp: new Date(),
      });
    }
  }

  // Send notifications for all triggered alerts
  for (const alert of triggeredAlerts) {
    await sendAlertNotifications(alert, organizationId);
  }

  return triggeredAlerts;
}

/**
 * Get recent alert history for an organization
 */
export async function getAlertHistory(
  organizationId: string,
  options?: {
    limit?: number;
    onlyUnacknowledged?: boolean;
    metricFilter?: string;
  }
): Promise<any[]> {
  const supabase = await createServiceRoleClient();

  let query = supabase
    .from('alert_history')
    .select('*')
    .eq('organization_id', organizationId)
    .order('triggered_at', { ascending: false });

  if (options?.onlyUnacknowledged) {
    query = query.is('acknowledged_at', null);
  }

  if (options?.metricFilter) {
    query = query.eq('metric', options.metricFilter);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Alert Threshold] Error fetching alert history:', error);
    return [];
  }

  return data || [];
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from('alert_history')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', alertId);

  if (error) {
    console.error('[Alert Threshold] Error acknowledging alert:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all thresholds for an organization
 */
export async function getAlertThresholds(organizationId: string): Promise<AlertThreshold[]> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('alert_thresholds')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Alert Threshold] Error fetching thresholds:', error);
    return [];
  }

  return (data || []) as AlertThreshold[];
}

/**
 * Create or update an alert threshold
 */
export async function saveAlertThreshold(
  organizationId: string,
  threshold: {
    id?: string;
    metric: string;
    condition: 'above' | 'below';
    threshold: number;
    enabled?: boolean;
    notification_channels?: string[];
  }
): Promise<{ success: boolean; data?: AlertThreshold; error?: string }> {
  const supabase = await createServiceRoleClient();

  const thresholdData = {
    organization_id: organizationId,
    metric: threshold.metric,
    condition: threshold.condition,
    threshold: threshold.threshold,
    enabled: threshold.enabled !== false,
    notification_channels: threshold.notification_channels || ['email'],
  };

  if (threshold.id) {
    // Update existing threshold
    const { data, error } = await supabase
      .from('alert_thresholds')
      .update(thresholdData)
      .eq('id', threshold.id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('[Alert Threshold] Error updating threshold:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AlertThreshold };
  } else {
    // Create new threshold
    const { data, error } = await supabase
      .from('alert_thresholds')
      .insert(thresholdData)
      .select()
      .single();

    if (error) {
      console.error('[Alert Threshold] Error creating threshold:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AlertThreshold };
  }
}

/**
 * Delete an alert threshold
 */
export async function deleteAlertThreshold(
  organizationId: string,
  thresholdId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from('alert_thresholds')
    .delete()
    .eq('id', thresholdId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[Alert Threshold] Error deleting threshold:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

