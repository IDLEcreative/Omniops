/**
 * WooCommerce Payment Gateways API
 */

import type { WooCommerceClient } from '@/lib/woocommerce-types';
import type { PaymentGateway } from '@/lib/woocommerce-full';
import { parsePaymentGateway } from './parsers';

export class PaymentGatewaysAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getPaymentGateways(): Promise<PaymentGateway[]> {
    const response = await this.getClient().get<unknown[]>('payment_gateways');
    return response.data.map((item) => parsePaymentGateway(item));
  }

  async getPaymentGateway(id: string): Promise<PaymentGateway> {
    const response = await this.getClient().get<unknown>(`payment_gateways/${id}`);
    return parsePaymentGateway(response.data);
  }

  async updatePaymentGateway(id: string, data: Partial<PaymentGateway>): Promise<PaymentGateway> {
    const response = await this.getClient().put<unknown>(`payment_gateways/${id}`, data);
    return parsePaymentGateway(response.data);
  }
}
