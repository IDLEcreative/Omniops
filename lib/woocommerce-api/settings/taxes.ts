/**
 * WooCommerce Taxes API
 */

import type { WooCommerceClient, ListParams } from '@/lib/woocommerce-types';
import type { TaxRate, TaxClass } from '@/lib/woocommerce-full';
import { parseTaxRate, parseTaxClass } from './parsers';

export class TaxesAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getTaxRates(params?: ListParams): Promise<TaxRate[]> {
    const response = await this.getClient().get<unknown[]>('taxes', params);
    return response.data.map((item) => parseTaxRate(item));
  }

  async getTaxRate(id: number): Promise<TaxRate> {
    const response = await this.getClient().get<unknown>(`taxes/${id}`);
    return parseTaxRate(response.data);
  }

  async createTaxRate(data: Partial<TaxRate>): Promise<TaxRate> {
    const response = await this.getClient().post<unknown>('taxes', data);
    return parseTaxRate(response.data);
  }

  async updateTaxRate(id: number, data: Partial<TaxRate>): Promise<TaxRate> {
    const response = await this.getClient().put<unknown>(`taxes/${id}`, data);
    return parseTaxRate(response.data);
  }

  async deleteTaxRate(id: number, force: boolean = false): Promise<TaxRate> {
    const response = await this.getClient().delete<unknown>(`taxes/${id}`, { force });
    return parseTaxRate(response.data);
  }

  async getTaxClasses(): Promise<TaxClass[]> {
    const response = await this.getClient().get<unknown[]>('taxes/classes');
    return response.data.map((item) => parseTaxClass(item));
  }

  async createTaxClass(data: Partial<TaxClass>): Promise<TaxClass> {
    const response = await this.getClient().post<unknown>('taxes/classes', data);
    return parseTaxClass(response.data);
  }

  async deleteTaxClass(slug: string, force: boolean = false): Promise<TaxClass> {
    const response = await this.getClient().delete<unknown>(`taxes/classes/${slug}`, { force });
    return parseTaxClass(response.data);
  }
}
