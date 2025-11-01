/**
 * WooCommerce Store Settings API
 */

import type { WooCommerceClient, SettingsGroup, SettingOption, SettingUpdateData } from '@/lib/woocommerce-types';

export class StoreSettingsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getSettingsGroups(): Promise<SettingsGroup[]> {
    const response = await this.getClient().get<SettingsGroup[]>('settings');
    return response.data;
  }

  async getSettings(group: string): Promise<SettingOption[]> {
    const response = await this.getClient().get<SettingOption[]>(`settings/${group}`);
    return response.data;
  }

  async getSetting(group: string, id: string): Promise<SettingOption> {
    const response = await this.getClient().get<SettingOption>(`settings/${group}/${id}`);
    return response.data;
  }

  async updateSetting(group: string, id: string, value: any): Promise<SettingOption> {
    const response = await this.getClient().put<SettingOption>(`settings/${group}/${id}`, { value });
    return response.data;
  }

  async batchUpdateSettings(group: string, updates: SettingUpdateData[]): Promise<SettingOption[]> {
    const response = await this.getClient().post<SettingOption[]>(`settings/${group}/batch`, { update: updates });
    return response.data;
  }

  // Aliases for backward compatibility
  async getSettingsOptions(group: string): Promise<SettingOption[]> {
    return this.getSettings(group);
  }

  async getSettingOption(group: string, id: string): Promise<SettingOption> {
    return this.getSetting(group, id);
  }

  async updateSettingOption(group: string, id: string, value: any): Promise<SettingOption> {
    return this.updateSetting(group, id, value);
  }
}
