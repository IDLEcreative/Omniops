/**
 * WooCommerce Shipping API
 */

import type { WooCommerceClient, ListParams, ShippingZoneLocation, ShippingZoneMethod } from '@/lib/woocommerce-types';
import type { ShippingZone, ShippingMethod } from '@/lib/woocommerce-full';
import { parseShippingZone, parseShippingMethod } from './parsers';

export class ShippingAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Shipping Zones
  async getShippingZones(params?: ListParams): Promise<ShippingZone[]> {
    const response = await this.getClient().get<unknown[]>('shipping/zones', params);
    return response.data.map((item) => parseShippingZone(item));
  }

  async getShippingZone(id: number): Promise<ShippingZone> {
    const response = await this.getClient().get<unknown>(`shipping/zones/${id}`);
    return parseShippingZone(response.data);
  }

  async createShippingZone(data: Partial<ShippingZone>): Promise<ShippingZone> {
    const response = await this.getClient().post<unknown>('shipping/zones', data);
    return parseShippingZone(response.data);
  }

  async updateShippingZone(id: number, data: Partial<ShippingZone>): Promise<ShippingZone> {
    const response = await this.getClient().put<unknown>(`shipping/zones/${id}`, data);
    return parseShippingZone(response.data);
  }

  async deleteShippingZone(id: number, force: boolean = false): Promise<ShippingZone> {
    const response = await this.getClient().delete<unknown>(`shipping/zones/${id}`, { force });
    return parseShippingZone(response.data);
  }

  // Shipping Zone Locations
  async getShippingZoneLocations(zoneId: number): Promise<ShippingZoneLocation[]> {
    const response = await this.getClient().get<ShippingZoneLocation[]>(`shipping/zones/${zoneId}/locations`);
    return response.data;
  }

  async updateShippingZoneLocations(zoneId: number, locations: ShippingZoneLocation[]): Promise<ShippingZoneLocation[]> {
    const response = await this.getClient().put<ShippingZoneLocation[]>(`shipping/zones/${zoneId}/locations`, locations);
    return response.data;
  }

  // Shipping Zone Methods
  async getShippingZoneMethods(zoneId: number): Promise<ShippingZoneMethod[]> {
    const response = await this.getClient().get<ShippingZoneMethod[]>(`shipping/zones/${zoneId}/methods`);
    return response.data;
  }

  async createShippingZoneMethod(zoneId: number, data: Partial<ShippingZoneMethod>): Promise<ShippingZoneMethod> {
    const response = await this.getClient().post<ShippingZoneMethod>(`shipping/zones/${zoneId}/methods`, data);
    return response.data;
  }

  async updateShippingZoneMethod(zoneId: number, methodId: number, data: Partial<ShippingZoneMethod>): Promise<ShippingZoneMethod> {
    const response = await this.getClient().put<ShippingZoneMethod>(`shipping/zones/${zoneId}/methods/${methodId}`, data);
    return response.data;
  }

  async deleteShippingZoneMethod(zoneId: number, methodId: number, force: boolean = false): Promise<ShippingZoneMethod> {
    const response = await this.getClient().delete<ShippingZoneMethod>(`shipping/zones/${zoneId}/methods/${methodId}`, { force });
    return response.data;
  }

  // Shipping Methods
  async getShippingMethods(params?: ListParams): Promise<ShippingMethod[]> {
    const response = await this.getClient().get<unknown[]>('shipping_methods', params);
    return response.data.map((item) => parseShippingMethod(item));
  }

  async getShippingMethod(id: string): Promise<ShippingMethod> {
    const response = await this.getClient().get<unknown>(`shipping_methods/${id}`);
    return parseShippingMethod(response.data);
  }
}
