import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';

export interface CustomerCredentials {
  customerId: string;
  domain: string;
  platform: string;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    shopDomain?: string;
    [key: string]: any;
  };
}

/**
 * Retrieve and decrypt credentials for a customer
 */
export async function getCustomerCredentials(
  customerId: string,
  platform: string
): Promise<CustomerCredentials | null> {
  try {
    const supabase = await createClient();

    if (!supabase) {
      console.error('Supabase client unavailable');
      return null;
    }

    const { data, error } = await supabase
      .from('customer_configs')
      .select('id, domain, platform, encrypted_credentials')
      .eq('id', customerId)
      .eq('platform', platform)
      .single();

    if (error || !data) {
      return null;
    }

    // Decrypt credentials
    const decryptedCredentials = await decrypt(data.encrypted_credentials);

    return {
      customerId: data.id,
      domain: data.domain,
      platform: data.platform,
      credentials: JSON.parse(decryptedCredentials)
    };
  } catch (error) {
    console.error('Failed to get customer credentials:', error);
    return null;
  }
}
