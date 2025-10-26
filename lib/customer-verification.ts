import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  VerificationRequest,
  VerificationResult,
  VerifyCodeResult,
  VerificationStatusResult,
  DataType,
  CacheOptions,
  AccessLogOptions,
  VERIFICATION_CONFIG,
} from './customer-verification-types';
import { VerificationStorage } from './customer-verification-storage';

export class CustomerVerification {
  private static readonly MAX_ATTEMPTS = VERIFICATION_CONFIG.MAX_ATTEMPTS;
  private static readonly EXPIRY_MINUTES = VERIFICATION_CONFIG.EXPIRY_MINUTES;
  private static readonly RATE_LIMIT_MINUTES = VERIFICATION_CONFIG.RATE_LIMIT_MINUTES;

  /**
   * Create a new verification request
   */
  static async createVerification(request: VerificationRequest): Promise<VerificationResult> {
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }
    
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
    
    if (!supabase) {
      return {
        verified: false,
        message: 'Database connection unavailable'
      };
    }
    
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
  static async checkVerificationStatus(conversationId: string): Promise<VerificationStatusResult> {
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      return { isVerified: false };
    }
    
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
   * @deprecated Use VerificationStorage.logAccess instead
   */
  static async logAccess(
    conversationId: string,
    customerEmail: string,
    wooCustomerId: number | null,
    accessedData: string[],
    reason: string,
    verifiedVia: string
  ): Promise<void> {
    return VerificationStorage.logAccess(
      conversationId,
      customerEmail,
      wooCustomerId,
      accessedData,
      reason,
      verifiedVia
    );
  }

  /**
   * Cache customer data for quick retrieval
   * @deprecated Use VerificationStorage.cacheCustomerData instead
   */
  static async cacheCustomerData(
    conversationId: string,
    customerEmail: string,
    wooCustomerId: number,
    data: any,
    dataType: DataType
  ): Promise<void> {
    return VerificationStorage.cacheCustomerData(
      conversationId,
      customerEmail,
      wooCustomerId,
      data,
      dataType
    );
  }

  /**
   * Get cached customer data
   * @deprecated Use VerificationStorage.getCachedData instead
   */
  static async getCachedData(
    conversationId: string,
    dataType?: string
  ): Promise<any | null> {
    return VerificationStorage.getCachedData(conversationId, dataType);
  }

  /**
   * Clean expired verification data
   * @deprecated Use VerificationStorage.cleanExpiredData instead
   */
  static async cleanExpiredData(): Promise<void> {
    return VerificationStorage.cleanExpiredData();
  }
}

// Re-export types, validators, and storage for backward compatibility
export {
  VerificationRequest,
  VerificationResult,
  VerifyCodeResult,
  VerificationStatusResult,
  DataType,
  CacheOptions,
  AccessLogOptions,
  VERIFICATION_CONFIG,
} from './customer-verification-types';

export { DataMasker } from './customer-verification-validators';
export { VerificationStorage } from './customer-verification-storage';