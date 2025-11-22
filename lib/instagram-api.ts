import { decrypt } from './encryption';
import { createClient } from './supabase/server';

export interface InstagramCredentials {
  accessToken: string;
  pageId: string;
  instagramAccountId: string;
}

/**
 * Instagram Messaging API Client
 * Handles sending messages and fetching user profiles
 */
export class InstagramAPI {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(private credentials: InstagramCredentials) {}

  /**
   * Send a text message to Instagram user
   * @param recipientId - Instagram user ID (IGSID)
   * @param message - Text message to send
   * @returns Message ID of sent message
   */
  async sendMessage(recipientId: string, message: string): Promise<string> {
    const url = `${this.baseUrl}/me/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Instagram API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.message_id;
  }

  /**
   * Get Instagram user profile information
   * @param userId - Instagram user ID (IGSID)
   * @returns User profile data
   */
  async getUserProfile(userId: string): Promise<{
    id: string;
    username: string;
    name: string;
  }> {
    const url = `${this.baseUrl}/${userId}?fields=id,username,name&access_token=${this.credentials.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch Instagram user profile: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }
}

/**
 * Load Instagram credentials for an organization from database
 * @param organizationId - Organization UUID (parameter named customerId for backward compatibility)
 * @returns Decrypted Instagram credentials or null if not found
 */
export async function getInstagramCredentials(
  customerId: string // Keep parameter name for backward compatibility, but treat as organizationId
): Promise<InstagramCredentials | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('instagram_credentials')
    .select('*')
    .eq('organization_id', customerId) // Use organization_id (column will be added in migration)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    accessToken: decrypt(data.encrypted_access_token),
    pageId: decrypt(data.encrypted_page_id),
    instagramAccountId: decrypt(data.encrypted_instagram_account_id),
  };
}
