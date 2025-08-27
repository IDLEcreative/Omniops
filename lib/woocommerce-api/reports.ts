import {
  SalesReport,
  TopSellersReport,
  CouponsReport,
  CustomersReport,
  StockReport,
  ReviewsReport,
  SalesReportSchema,
  TopSellersReportSchema,
  CouponsReportSchema,
  CustomersReportSchema,
  StockReportSchema,
  ReviewsReportSchema
} from '../woocommerce-full';

import {
  OrdersReportData,
  ProductsReportData,
  WooCommerceClient,
  ReportParams
} from '../woocommerce-types';

export class ReportsAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Get sales report
  async getSalesReport(params?: ReportParams): Promise<SalesReport[]> {
    const response = await this.getClient().get('reports/sales', params);
    return (response.data as unknown[]).map((item) => SalesReportSchema.parse(item));
  }

  // Get top sellers report
  async getTopSellersReport(params?: ReportParams): Promise<TopSellersReport[]> {
    const response = await this.getClient().get('reports/top_sellers', params);
    return (response.data as unknown[]).map((item) => TopSellersReportSchema.parse(item));
  }

  // Get coupons report
  async getCouponsReport(params?: ReportParams): Promise<CouponsReport[]> {
    const response = await this.getClient().get('reports/coupons/totals', params);
    return (response.data as unknown[]).map((item) => CouponsReportSchema.parse(item));
  }

  // Get customers report
  async getCustomersReport(params?: ReportParams): Promise<CustomersReport[]> {
    const response = await this.getClient().get('reports/customers/totals', params);
    return (response.data as unknown[]).map((item) => CustomersReportSchema.parse(item));
  }

  // Get stock report
  async getStockReport(params?: ReportParams): Promise<StockReport[]> {
    const response = await this.getClient().get('reports/stock', params);
    return (response.data as unknown[]).map((item) => StockReportSchema.parse(item));
  }

  // Get reviews report
  async getReviewsReport(params?: ReportParams): Promise<ReviewsReport[]> {
    const response = await this.getClient().get('reports/reviews/totals', params);
    return (response.data as unknown[]).map((item) => ReviewsReportSchema.parse(item));
  }

  // Get orders report
  async getOrdersReport(params?: ReportParams): Promise<OrdersReportData[]> {
    const response = await this.getClient().get('reports/orders/totals', params);
    return response.data;
  }

  // Get products report
  async getProductsReport(params?: ReportParams): Promise<ProductsReportData[]> {
    const response = await this.getClient().get('reports/products/totals', params);
    return response.data;
  }
}