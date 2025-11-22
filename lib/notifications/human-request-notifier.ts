/**
 * Human Request Notifier
 *
 * @purpose Send notifications to support team when users request human assistance
 * @flow User requests human → API calls notifyHumanRequest() → Send email + in-app notification
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

export interface HumanRequestNotification {
  conversationId: string;
  domainId: string;
  customerName?: string;
  lastMessage?: string;
  reason?: string;
  requestedAt: string;
}

/**
 * Send notification to support team when user requests human help
 */
export async function notifyHumanRequest(params: HumanRequestNotification): Promise<{
  success: boolean;
  error?: string;
}> {
  const { conversationId, domainId, customerName, lastMessage, reason, requestedAt } = params;

  console.log('[HumanRequestNotifier] Sending notification for conversation:', conversationId);

  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    // Get domain/customer config to find support email
    const { data: customerConfig, error: configError } = await supabase
      .from('customer_configs')
      .select('domain, business_name, organization_id')
      .eq('id', domainId)
      .single();

    if (configError || !customerConfig) {
      console.error('[HumanRequestNotifier] Failed to get customer config:', configError);
      return { success: false, error: 'Customer config not found' };
    }

    // Get organization members who should be notified
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, users(email)')
      .eq('organization_id', customerConfig.organization_id);

    if (membersError) {
      console.error('[HumanRequestNotifier] Failed to get organization members:', membersError);
    }

    // TODO: Send email notifications
    // For now, we'll create in-app notifications in the notifications table

    // Create in-app notifications for all organization members
    if (members && members.length > 0) {
      const notifications = members.map((member: any) => ({
        user_id: member.user_id,
        type: 'human_request',
        title: '🚨 Human Help Requested',
        message: `Customer needs assistance${customerName ? ` (${customerName})` : ''}`,
        data: {
          conversationId,
          domainId,
          domain: customerConfig.domain,
          businessName: customerConfig.business_name,
          lastMessage,
          reason,
          requestedAt,
          dashboardUrl: `/dashboard/conversations?id=${conversationId}`,
        },
        read: false,
        created_at: new Date().toISOString(),
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('[HumanRequestNotifier] Failed to create notifications:', notifError);
        return { success: false, error: notifError.message };
      }

      console.log(`[HumanRequestNotifier] Created ${notifications.length} in-app notifications`);
    }

    // TODO Phase 3: Send email notifications
    // await sendEmailNotification({
    //   to: supportEmails,
    //   subject: `🚨 Human Help Requested - ${customerConfig.domain}`,
    //   template: 'human-request',
    //   data: { conversationId, customerName, lastMessage, dashboardUrl }
    // });

    console.log('[HumanRequestNotifier] Notifications sent successfully');
    return { success: true };

  } catch (error) {
    console.error('[HumanRequestNotifier] Error sending notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get unread human request notifications for a user
 */
export async function getUnreadHumanRequests(userId: string): Promise<{
  count: number;
  notifications: any[];
}> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'human_request')
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HumanRequestNotifier] Failed to get unread notifications:', error);
      return { count: 0, notifications: [] };
    }

    return {
      count: data?.length || 0,
      notifications: data || [],
    };
  } catch (error) {
    console.error('[HumanRequestNotifier] Error getting unread requests:', error);
    return { count: 0, notifications: [] };
  }
}

/**
 * Mark human request notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('[HumanRequestNotifier] Failed to mark notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[HumanRequestNotifier] Error marking notification as read:', error);
    return false;
  }
}
