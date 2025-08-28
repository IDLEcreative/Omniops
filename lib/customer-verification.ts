import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export interface VerificationRequest {
  conversationId: string;
  email: string;
  method?: 'email' | 'order' | 'phone';
}

export interface VerificationResult {
  success: boolean;
  message: string;
  verificationId?: string;
  code?: string;
  expiresAt?: Date;
}

export interface VerifyCodeResult {
  verified: boolean;
  message: string;
  customerEmail?: string;
}

export class CustomerVerification {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly EXPIRY_MINUTES = 15;
  private static readonly RATE_LIMIT_MINUTES = 15;

  /**
   * Create a new verification request
   */
  static async createVerification(request: VerificationRequest): Promise<VerificationResult> {
    const supabase = await createServiceRoleClient();
    
    try {
      // Check for existing recent verifications (rate limiting)
      const { data: recentVerifications } = await supabase
        .from('customer_verifications')
        .select('id, attempts, created_at')
        .eq('conversation_id', request.conversationId)
        .eq('email', request.email)
        .gte('created_at', new Date(Date.now() - this.RATE_LIMIT_MINUTES * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentVerifications && recentVerifications.length > 0) {
        const recent = recentVerifications[0];
        if (recent && recent.attempts >= this.MAX_ATTEMPTS) {
          return {
            success: false,
            message: `Too many verification attempts. Please try again in ${this.RATE_LIMIT_MINUTES} minutes.`
          };
        }
      }

      // Call Supabase function to create verification
      const { data, error } = await supabase.rpc('create_verification_request', {
        p_conversation_id: request.conversationId,
        p_email: request.email,
        p_method: request.method || 'email'
      });

      if (error) {
        console.error('Error creating verification:', error);
        return {
          success: false,
          message: 'Failed to create verification request'
        };
      }

      if (data && data.length > 0) {
        const result = data[0];
        return {
          success: true,
          message: 'Verification code sent successfully',
          verificationId: result.verification_id,
          code: result.code, // In production, this would be sent via email
          expiresAt: new Date(result.expires_at)
        };
      }

      return {
        success: false,
        message: 'Failed to create verification request'
      };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        message: 'An error occurred during verification'
      };
    }
  }

  /**
   * Verify a code submitted by the user
   */
  static async verifyCode(
    conversationId: string,
    email: string,
    code: string
  ): Promise<VerifyCodeResult> {
    const supabase = await createServiceRoleClient();
    
    try {
      // Call Supabase function to verify code
      const { data, error } = await supabase.rpc('verify_customer_code', {
        p_conversation_id: conversationId,
        p_email: email,
        p_code: code
      });

      if (error) {
        console.error('Error verifying code:', error);
        return {
          verified: false,
          message: 'Failed to verify code'
        };
      }

      if (data && data.length > 0) {
        const result = data[0];
        return {
          verified: result.verified,
          message: result.message,
          customerEmail: result.customer_email
        };
      }

      return {
        verified: false,
        message: 'Verification failed'
      };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        verified: false,
        message: 'An error occurred during verification'
      };
    }
  }

  /**
   * Check if a conversation has a verified customer
   */
  static async checkVerificationStatus(conversationId: string): Promise<{
    isVerified: boolean;
    customerEmail?: string;
    verifiedAt?: Date;
  }> {
    const supabase = await createServiceRoleClient();
    
    try {
      const { data } = await supabase
        .from('conversations')
        .select('verified_customer_email, verification_status')
        .eq('id', conversationId)
        .single();

      if (data && data.verification_status === 'verified') {
        return {
          isVerified: true,
          customerEmail: data.verified_customer_email
        };
      }

      // Also check for recent valid verifications
      const { data: verifications } = await supabase
        .from('customer_verifications')
        .select('email, verified_at')
        .eq('conversation_id', conversationId)
        .not('verified_at', 'is', null)
        .gte('verified_at', new Date(Date.now() - this.EXPIRY_MINUTES * 60 * 1000).toISOString())
        .order('verified_at', { ascending: false })
        .limit(1);

      if (verifications && verifications.length > 0) {
        const verification = verifications[0];
        if (verification) {
          return {
            isVerified: true,
            customerEmail: verification.email,
            verifiedAt: new Date(verification.verified_at)
          };
        }
      }

      return { isVerified: false };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { isVerified: false };
    }
  }

  /**
   * Verify by order number and email/postal code
   */
  static async verifyByOrder(
    conversationId: string,
    orderNumber: string,
    emailOrPostalCode: string
  ): Promise<VerifyCodeResult> {
    // This would integrate with WooCommerce to verify the order
    // For now, returning a placeholder
    return {
      verified: false,
      message: 'Order verification not yet implemented'
    };
  }

  /**
   * Log customer data access for audit
   */
  static async logAccess(
    conversationId: string,
    customerEmail: string,
    wooCustomerId: number | null,
    accessedData: string[],
    reason: string,
    verifiedVia: string
  ): Promise<void> {
    const supabase = await createServiceRoleClient();
    
    try {
      await supabase.rpc('log_customer_access', {
        p_conversation_id: conversationId,
        p_customer_email: customerEmail,
        p_woo_customer_id: wooCustomerId,
        p_accessed_data: accessedData,
        p_reason: reason,
        p_verified_via: verifiedVia
      });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  /**
   * Cache customer data for quick retrieval
   */
  static async cacheCustomerData(
    conversationId: string,
    customerEmail: string,
    wooCustomerId: number,
    data: any,
    dataType: 'profile' | 'orders' | 'recent_purchases' | 'order_detail'
  ): Promise<void> {
    const supabase = await createServiceRoleClient();
    
    try {
      await supabase
        .from('customer_data_cache')
        .upsert({
          conversation_id: conversationId,
          customer_email: customerEmail,
          woo_customer_id: wooCustomerId,
          cached_data: data,
          data_type: dataType,
          expires_at: new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000).toISOString()
        });
    } catch (error) {
      console.error('Error caching customer data:', error);
    }
  }

  /**
   * Get cached customer data
   */
  static async getCachedData(
    conversationId: string,
    dataType?: string
  ): Promise<any | null> {
    const supabase = await createServiceRoleClient();
    
    try {
      let query = supabase
        .from('customer_data_cache')
        .select('cached_data, data_type')
        .eq('conversation_id', conversationId)
        .gte('expires_at', new Date().toISOString());

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(1);

      if (data && data.length > 0) {
        const firstItem = data[0];
        if (firstItem) {
          return firstItem.cached_data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clean expired verification data
   */
  static async cleanExpiredData(): Promise<void> {
    const supabase = await createServiceRoleClient();
    
    try {
      await supabase.rpc('clean_expired_customer_data');
    } catch (error) {
      console.error('Error cleaning expired data:', error);
    }
  }
}

// Data masking utilities
export class DataMasker {
  /**
   * Mask email address (show first 2 and last 2 characters before @)
   */
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return email; // Return original if not a valid email format
    }
    if (local.length <= 4) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 2)}***${local.slice(-2)}@${domain}`;
  }

  /**
   * Mask phone number (show last 4 digits)
   */
  static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      return '***';
    }
    return `***-***-${cleaned.slice(-4)}`;
  }

  /**
   * Mask address (show city and state/country only)
   */
  static maskAddress(address: any): string {
    return `${address.city || '***'}, ${address.state || address.country || '***'}`;
  }

  /**
   * Mask credit card (show last 4 digits)
   */
  static maskCard(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      return '****';
    }
    return `****-****-****-${cleaned.slice(-4)}`;
  }

  /**
   * Mask sensitive customer data
   */
  static maskCustomerData(customer: any): any {
    return {
      id: customer.id,
      email: this.maskEmail(customer.email),
      first_name: customer.first_name,
      last_name: customer.last_name ? `${customer.last_name[0]}***` : undefined,
      billing: customer.billing ? {
        city: customer.billing.city,
        state: customer.billing.state,
        country: customer.billing.country,
        postcode: customer.billing.postcode ? `***${customer.billing.postcode.slice(-2)}` : undefined
      } : undefined,
      shipping: customer.shipping ? {
        city: customer.shipping.city,
        state: customer.shipping.state,
        country: customer.shipping.country,
        postcode: customer.shipping.postcode ? `***${customer.shipping.postcode.slice(-2)}` : undefined
      } : undefined,
      date_created: customer.date_created,
      orders_count: customer.orders_count,
      total_spent: customer.total_spent
    };
  }
}