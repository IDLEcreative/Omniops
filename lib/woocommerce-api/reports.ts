import type {
  SalesReport,
  TopSellersReport,
  CouponsReport,
  CustomersReport,
  StockReport,
  ReviewsReport
} from '@/lib/woocommerce-full';

import type {
  OrdersReportData,
  ProductsReportData,
  WooCommerceClient,
  ReportParams
} from '@/lib/woocommerce-types';
import { getWooCommerceModule } from './woo-module';

const parseSalesReport = (data: unknown) => getWooCommerceModule().SalesReportSchema.parse(data);
const parseTopSellersReport = (data: unknown) => getWooCommerceModule().TopSellersReportSchema.parse(data);
const parseCouponsReport = (data: unknown) => getWooCommerceModule().CouponsReportSchema.parse(data);
const parseCustomersReport = (data: unknown) => getWooCommerceModule().CustomersReportSchema.parse(data);
const parseStockReport = (data: unknown) => getWooCommerceModule().StockReportSchema.parse(data);
const parseReviewsReport = (data: unknown) => getWooCommerceModule().ReviewsReportSchema.parse(data);

export class ReportsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Get sales report
  async getSalesReport(params?: ReportParams): Promise<SalesReport[]> {
    const response = await this.getClient().get<unknown[]>('reports/sales', params);
    return response.data.map((item) => parseSalesReport(item));
  }

  // Get top sellers report
  async getTopSellersReport(params?: ReportParams): Promise<TopSellersReport[]> {
    const response = await this.getClient().get<unknown[]>('reports/top_sellers', params);
    return response.data.map((item) => parseTopSellersReport(item));
  }

  // Get coupons report
  async getCouponsReport(params?: ReportParams): Promise<CouponsReport[]> {
    const response = await this.getClient().get<unknown[]>('reports/coupons/totals', params);
    return response.data.map((item) => parseCouponsReport(item));
  }

  // Get customers report
  async getCustomersReport(params?: ReportParams): Promise<CustomersReport[]> {
    const response = await this.getClient().get<unknown[]>('reports/customers/totals', params);
    return response.data.map((item) => parseCustomersReport(item));
  }

  // Get stock report
  async getStockReport(params?: ReportParams): Promise<StockReport[]> {
    const response = await this.getClient().get<unknown[]>('reports/stock', params);
    return response.data.map((item) => parseStockReport(item));
  }

  // Get reviews report
  async getReviewsReport(params?: ReportParams): Promise<ReviewsReport[]> {
    const response = await this.getClient().get<unknown[]>('reports/reviews/totals', params);
    return response.data.map((item) => parseReviewsReport(item));
  }

  // Get orders report
  async getOrdersReport(params?: ReportParams): Promise<OrdersReportData[]> {
    const response = await this.getClient().get<OrdersReportData[]>('reports/orders/totals', params);
    return response.data;
  }

  // Get products report
  async getProductsReport(params?: ReportParams): Promise<ProductsReportData[]> {
    const response = await this.getClient().get<ProductsReportData[]>('reports/products/totals', params);
    return response.data;
  }
}
