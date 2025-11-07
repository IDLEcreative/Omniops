/**
 * Custom Funnels Library
 * Manages organization-specific conversion funnel configurations
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

export interface FunnelStage {
  id: string;
  name: string;
  order: number;
}

export interface CustomFunnel {
  id?: string;
  organization_id: string;
  domain_id?: string | null;
  name: string;
  stages: FunnelStage[];
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get custom funnel for organization/domain
 * Falls back to default if no custom funnel exists
 */
export async function getCustomFunnel(
  organizationId: string,
  domainId?: string
): Promise<CustomFunnel> {
  const supabase = await createServiceRoleClient();

  // Try to get domain-specific funnel first
  if (domainId) {
    const { data: domainFunnel } = await supabase
      .from('custom_funnels')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('domain_id', domainId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (domainFunnel) {
      return domainFunnel as CustomFunnel;
    }
  }

  // Try to get organization default funnel
  const { data: orgFunnel } = await supabase
    .from('custom_funnels')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_default', true)
    .is('domain_id', null)
    .limit(1)
    .single();

  if (orgFunnel) {
    return orgFunnel as CustomFunnel;
  }

  // Return system default funnel
  return getDefaultFunnel(organizationId);
}

/**
 * Get all funnels for an organization
 */
export async function getAllFunnels(organizationId: string): Promise<CustomFunnel[]> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('custom_funnels')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Custom Funnels] Error fetching funnels:', error);
    return [];
  }

  return (data || []) as CustomFunnel[];
}

/**
 * Save or update a custom funnel
 */
export async function saveCustomFunnel(
  organizationId: string,
  funnel: {
    id?: string;
    domainId?: string | null;
    name: string;
    stages: FunnelStage[];
    isDefault?: boolean;
  }
): Promise<{ success: boolean; data?: CustomFunnel; error?: string }> {
  const supabase = await createServiceRoleClient();

  // Validate stages
  if (!funnel.stages || funnel.stages.length === 0) {
    return { success: false, error: 'Funnel must have at least one stage' };
  }

  // Ensure stages have proper order
  const sortedStages = funnel.stages.map((stage, index) => ({
    ...stage,
    order: index + 1,
  }));

  const funnelData = {
    organization_id: organizationId,
    domain_id: funnel.domainId || null,
    name: funnel.name,
    stages: sortedStages,
    is_default: funnel.isDefault || false,
  };

  if (funnel.id) {
    // Update existing funnel
    const { data, error } = await supabase
      .from('custom_funnels')
      .update(funnelData)
      .eq('id', funnel.id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('[Custom Funnels] Error updating funnel:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CustomFunnel };
  } else {
    // Create new funnel
    const { data, error } = await supabase
      .from('custom_funnels')
      .insert(funnelData)
      .select()
      .single();

    if (error) {
      console.error('[Custom Funnels] Error creating funnel:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as CustomFunnel };
  }
}

/**
 * Delete a custom funnel
 */
export async function deleteCustomFunnel(
  organizationId: string,
  funnelId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from('custom_funnels')
    .delete()
    .eq('id', funnelId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[Custom Funnels] Error deleting funnel:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get system default funnel (fallback)
 */
export function getDefaultFunnel(organizationId: string): CustomFunnel {
  return {
    organization_id: organizationId,
    name: 'Default Sales Funnel',
    stages: [
      { id: 'awareness', name: 'Awareness', order: 1 },
      { id: 'interest', name: 'Interest', order: 2 },
      { id: 'consideration', name: 'Consideration', order: 3 },
      { id: 'intent', name: 'Intent', order: 4 },
      { id: 'evaluation', name: 'Evaluation', order: 5 },
      { id: 'purchase', name: 'Purchase', order: 6 },
    ],
    is_default: true,
  };
}

/**
 * Map conversation metadata to funnel stage
 * Uses conversation metadata to determine current stage
 */
export function mapConversationToStage(
  metadata: any,
  funnel: CustomFunnel
): string | null {
  if (!metadata || !funnel.stages.length) return null;

  // Check for explicit stage in metadata
  if (metadata.funnel_stage) {
    const stage = funnel.stages.find((s) => s.id === metadata.funnel_stage);
    if (stage) return stage.id;
  }

  // Infer stage from conversation characteristics
  const hasProductInquiry = metadata.product_inquiry === true;
  const hasPriceCheck = metadata.price_check === true;
  const hasOrderLookup = metadata.order_lookup === true;
  const hasConversion = metadata.converted === true;

  if (hasConversion) {
    return funnel.stages[funnel.stages.length - 1].id; // Last stage = conversion
  }

  if (hasOrderLookup) {
    return funnel.stages[Math.min(4, funnel.stages.length - 2)].id; // Near end
  }

  if (hasPriceCheck) {
    return funnel.stages[Math.min(3, funnel.stages.length - 3)].id; // Mid-late
  }

  if (hasProductInquiry) {
    return funnel.stages[Math.min(2, funnel.stages.length - 4)].id; // Mid
  }

  // Default to first stage (awareness/contact)
  return funnel.stages[0].id;
}

/**
 * Calculate funnel metrics using custom stages
 */
export async function calculateFunnelMetrics(
  organizationId: string,
  domainId?: string,
  timeRange?: { start: Date; end: Date }
): Promise<{
  funnel: CustomFunnel;
  stageMetrics: Array<{
    stage: FunnelStage;
    count: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
}> {
  const funnel = await getCustomFunnel(organizationId, domainId);
  const supabase = await createServiceRoleClient();

  // Get conversations with metadata
  let query = supabase
    .from('conversations')
    .select('id, metadata, created_at, domain')
    .eq('domain', domainId || '');

  if (timeRange) {
    query = query
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());
  }

  const { data: conversations } = await query;

  if (!conversations || conversations.length === 0) {
    return {
      funnel,
      stageMetrics: funnel.stages.map((stage) => ({
        stage,
        count: 0,
        conversionRate: 0,
        dropOffRate: 0,
      })),
    };
  }

  // Map conversations to stages
  const stageCounts: Record<string, number> = {};
  funnel.stages.forEach((stage) => {
    stageCounts[stage.id] = 0;
  });

  conversations.forEach((conv) => {
    const stage = mapConversationToStage(conv.metadata, funnel);
    if (stage && stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }
  });

  // Calculate metrics
  const totalConversations = conversations.length;
  let previousCount = totalConversations;

  const stageMetrics = funnel.stages.map((stage, index) => {
    const count = stageCounts[stage.id] || 0;
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 0;
    const dropOffRate = 100 - conversionRate;

    previousCount = count;

    return {
      stage,
      count,
      conversionRate: Math.round(conversionRate * 100) / 100,
      dropOffRate: Math.round(dropOffRate * 100) / 100,
    };
  });

  return {
    funnel,
    stageMetrics,
  };
}
