/**
 * WooCommerce Webhooks API
 */

import type { WooCommerceClient, ListParams } from '@/lib/woocommerce-types';
import type { Webhook, BatchOperation, BatchResponse } from '@/lib/woocommerce-full';
import { parseWebhook } from './parsers';

export class WebhooksAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getWebhooks(params?: ListParams): Promise<Webhook[]> {
    const response = await this.getClient().get<unknown[]>('webhooks', params);
    return response.data.map((item) => parseWebhook(item));
  }

  async getWebhook(id: number): Promise<Webhook> {
    const response = await this.getClient().get<unknown>(`webhooks/${id}`);
    return parseWebhook(response.data);
  }

  async createWebhook(data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.getClient().post<unknown>('webhooks', data);
    return parseWebhook(response.data);
  }

  async updateWebhook(id: number, data: Partial<Webhook>): Promise<Webhook> {
    const response = await this.getClient().put<unknown>(`webhooks/${id}`, data);
    return parseWebhook(response.data);
  }

  async deleteWebhook(id: number, force: boolean = false): Promise<Webhook> {
    const response = await this.getClient().delete<unknown>(`webhooks/${id}`, { force });
    return parseWebhook(response.data);
  }

  async batchWebhooks(operations: BatchOperation<Webhook>): Promise<BatchResponse<Webhook>> {
    const response = await this.getClient().post<any>('webhooks/batch', operations);
    return {
      create: response.data.create?.map((item: any) => parseWebhook(item)) || [],
      update: response.data.update?.map((item: any) => parseWebhook(item)) || [],
      delete: response.data.delete || []
    };
  }
}
