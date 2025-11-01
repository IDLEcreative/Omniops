/**
 * WooCommerce Coupons API
 */

import type { WooCommerceClient, CouponListParams } from '@/lib/woocommerce-types';
import type { Coupon, BatchOperation, BatchResponse } from '@/lib/woocommerce-full';
import { parseCoupon } from './parsers';

export class CouponsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  async getCoupons(params?: CouponListParams): Promise<Coupon[]> {
    const response = await this.getClient().get<unknown[]>('coupons', params);
    return response.data.map((item) => parseCoupon(item));
  }

  async getCoupon(id: number): Promise<Coupon> {
    const response = await this.getClient().get<unknown>(`coupons/${id}`);
    return parseCoupon(response.data);
  }

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    const response = await this.getClient().post<unknown>('coupons', data);
    return parseCoupon(response.data);
  }

  async updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon> {
    const response = await this.getClient().put<unknown>(`coupons/${id}`, data);
    return parseCoupon(response.data);
  }

  async deleteCoupon(id: number, force: boolean = false): Promise<Coupon> {
    const response = await this.getClient().delete<unknown>(`coupons/${id}`, { force });
    return parseCoupon(response.data);
  }

  async batchCoupons(operations: BatchOperation<Coupon>): Promise<BatchResponse<Coupon>> {
    const response = await this.getClient().post<any>('coupons/batch', operations);
    return {
      create: response.data.create?.map((item: any) => parseCoupon(item)) || [],
      update: response.data.update?.map((item: any) => parseCoupon(item)) || [],
      delete: response.data.delete || []
    };
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const response = await this.getClient().get<unknown[]>('coupons', { code });
    const coupons = response.data.map((item) => parseCoupon(item));
    return coupons.length > 0 ? coupons[0]! : null;
  }
}
