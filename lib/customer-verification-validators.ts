/**
 * Customer Verification Validators
 *
 * Data masking and validation utilities for customer verification.
 * Part of the customer verification module refactoring.
 */

/**
 * Data masking utilities for sensitive customer information
 */
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
