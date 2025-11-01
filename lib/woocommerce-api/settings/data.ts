/**
 * WooCommerce Data API (Countries, Currencies, Continents)
 */

import type { WooCommerceClient, CountryData, CurrencyData, ContinentData } from '@/lib/woocommerce-types';

export class DataAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async get(endpoint: string): Promise<any> {
    const response = await this.getClient().get<any>(endpoint);
    return response.data;
  }

  async getCountries(): Promise<CountryData[]> {
    const response = await this.getClient().get<CountryData[]>('data/countries');
    return response.data;
  }

  async getCurrencies(): Promise<CurrencyData[]> {
    const response = await this.getClient().get<CurrencyData[]>('data/currencies');
    return response.data;
  }

  async getCurrentCurrency(): Promise<CurrencyData> {
    const response = await this.getClient().get<CurrencyData>('data/currencies/current');
    return response.data;
  }

  async getContinents(): Promise<ContinentData[]> {
    const response = await this.getClient().get<ContinentData[]>('data/continents');
    return response.data;
  }
}
