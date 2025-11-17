import crypto from 'crypto';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scopes?: string[];
}

interface InstagramAccount {
  instagramAccountId: string;
  username: string;
  name: string;
  pageId: string;
}

/**
 * Instagram OAuth 2.0 Client
 * Handles OAuth flow and webhook signature verification for Instagram Business API
 */
export class InstagramOAuth {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from OAuth callback
   * @returns Token response with access token
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
      code,
    });

    const response = await fetch(
      `${this.baseUrl}/oauth/access_token?${params}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Exchange short-lived token for long-lived token (60 days)
    return this.exchangeForLongLivedToken(data.access_token);
  }

  /**
   * Exchange short-lived token for long-lived token (60 days validity)
   * @param shortLivedToken - Short-lived access token from initial OAuth
   * @returns Long-lived token response
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${this.baseUrl}/oauth/access_token?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Long-lived token exchange failed: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Get Instagram Business Account details from access token
   * Retrieves the user's Facebook pages and finds linked Instagram Business account
   * @param accessToken - Valid access token
   * @returns Instagram account information
   */
  async getInstagramAccount(accessToken: string): Promise<InstagramAccount> {
    // First, get the user's Facebook pages
    const pagesResponse = await fetch(
      `${this.baseUrl}/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      const error = await pagesResponse.json();
      throw new Error(`Failed to fetch pages: ${error.error?.message || 'Unknown error'}`);
    }

    const pagesData = await pagesResponse.json();
    const page = pagesData.data?.[0]; // Use first page

    if (!page) {
      throw new Error(
        'No Facebook page found. User must have a page connected to Instagram Business account.'
      );
    }

    // Get Instagram Business Account linked to the page
    const igResponse = await fetch(
      `${this.baseUrl}/${page.id}?fields=instagram_business_account{id,username,name}&access_token=${accessToken}`
    );

    if (!igResponse.ok) {
      const error = await igResponse.json();
      throw new Error(`Failed to fetch Instagram account: ${error.error?.message || 'Unknown error'}`);
    }

    const igData = await igResponse.json();

    if (!igData.instagram_business_account) {
      throw new Error(
        'No Instagram Business account linked to this page. Convert to Business account first.'
      );
    }

    return {
      instagramAccountId: igData.instagram_business_account.id,
      username: igData.instagram_business_account.username,
      name: igData.instagram_business_account.name,
      pageId: page.id,
    };
  }

  /**
   * Subscribe page to Instagram webhooks
   * @param pageId - Facebook page ID
   * @param accessToken - Valid access token
   */
  async subscribeToWebhooks(pageId: string, accessToken: string): Promise<void> {
    const params = new URLSearchParams({
      subscribed_fields: 'messages,messaging_postbacks',
      access_token: accessToken,
    });

    const response = await fetch(
      `${this.baseUrl}/${pageId}/subscribed_apps?${params}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Webhook subscription failed: ${error.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Subscribed to Instagram webhooks');
  }

  /**
   * Verify webhook signature for security
   * Uses timing-safe comparison to prevent timing attacks
   * @param payload - Raw request body as string
   * @param signature - x-hub-signature-256 header value
   * @param appSecret - Instagram app secret
   * @returns True if signature is valid
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    appSecret: string
  ): boolean {
    // Remove 'sha256=' prefix if present
    const signatureHash = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHash),
        Buffer.from(expectedSignature)
      );
    } catch {
      // Buffers have different lengths
      return false;
    }
  }
}
