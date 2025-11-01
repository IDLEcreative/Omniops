/**
 * WooCommerce System Status API
 */

import type { WooCommerceClient, SystemStatusTool } from '@/lib/woocommerce-types';
import type { SystemStatus } from '@/lib/woocommerce-full';
import { parseSystemStatus } from './parsers';

export class SystemStatusAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getSystemStatus(): Promise<SystemStatus> {
    const response = await this.getClient().get<unknown>('system_status');
    return parseSystemStatus(response.data);
  }

  async getSystemStatusTools(): Promise<SystemStatusTool[]> {
    const response = await this.getClient().get<SystemStatusTool[]>('system_status/tools');
    return response.data;
  }

  async getSystemStatusTool(id: string): Promise<SystemStatusTool> {
    const response = await this.getClient().get<SystemStatusTool>(`system_status/tools/${id}`);
    return response.data;
  }

  async runSystemStatusTool(id: string): Promise<SystemStatusTool> {
    const response = await this.getClient().put<SystemStatusTool>(`system_status/tools/${id}`, { confirm: true });
    return response.data;
  }
}
