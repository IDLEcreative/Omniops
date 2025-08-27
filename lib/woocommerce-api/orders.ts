import {
  Order,
  OrderNote,
  Refund,
  OrderSchema,
  OrderNoteSchema,
  RefundSchema,
  BatchOperation,
  BatchResponse
} from '../woocommerce-full';

import {
  WooCommerceClient,
  OrderListParams,
  ListParams
} from '../woocommerce-types';

export class OrdersAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Get all orders with filtering
  async getOrders(params?: OrderListParams): Promise<Order[]> {
    const response = await this.getClient().get('orders', params);
    return (response.data as unknown[]).map((item) => OrderSchema.parse(item));
  }

  // Get single order
  async getOrder(id: number): Promise<Order> {
    const response = await this.getClient().get(`orders/${id}`);
    return OrderSchema.parse(response.data);
  }

  // Create order
  async createOrder(data: Partial<Order>): Promise<Order> {
    const response = await this.getClient().post('orders', data);
    return OrderSchema.parse(response.data);
  }

  // Update order
  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    const response = await this.getClient().put(`orders/${id}`, data);
    return OrderSchema.parse(response.data);
  }

  // Delete order
  async deleteOrder(id: number, force: boolean = false): Promise<Order> {
    const response = await this.getClient().delete(`orders/${id}`, { force });
    return OrderSchema.parse(response.data);
  }

  // Batch order operations
  async batchOrders(operations: BatchOperation<Order>): Promise<BatchResponse<Order>> {
    const response = await this.getClient().post('orders/batch', operations);
    return {
      create: response.data.create?.map((item: any) => OrderSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => OrderSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Get order notes
  async getOrderNotes(orderId: number, params?: ListParams): Promise<OrderNote[]> {
    const response = await this.getClient().get(`orders/${orderId}/notes`, params);
    return (response.data as unknown[]).map((item) => OrderNoteSchema.parse(item));
  }

  // Get single order note
  async getOrderNote(orderId: number, noteId: number): Promise<OrderNote> {
    const response = await this.getClient().get(`orders/${orderId}/notes/${noteId}`);
    return OrderNoteSchema.parse(response.data);
  }

  // Create order note
  async createOrderNote(orderId: number, data: Partial<OrderNote>): Promise<OrderNote> {
    const response = await this.getClient().post(`orders/${orderId}/notes`, data);
    return OrderNoteSchema.parse(response.data);
  }

  // Delete order note
  async deleteOrderNote(orderId: number, noteId: number, force: boolean = false): Promise<OrderNote> {
    const response = await this.getClient().delete(`orders/${orderId}/notes/${noteId}`, { force });
    return OrderNoteSchema.parse(response.data);
  }

  // Get order refunds
  async getOrderRefunds(orderId: number, params?: ListParams): Promise<Refund[]> {
    const response = await this.getClient().get(`orders/${orderId}/refunds`, params);
    return (response.data as unknown[]).map((item) => RefundSchema.parse(item));
  }

  // Get single refund
  async getOrderRefund(orderId: number, refundId: number): Promise<Refund> {
    const response = await this.getClient().get(`orders/${orderId}/refunds/${refundId}`);
    return RefundSchema.parse(response.data);
  }

  // Create refund
  async createOrderRefund(orderId: number, data: Partial<Refund>): Promise<Refund> {
    const response = await this.getClient().post(`orders/${orderId}/refunds`, data);
    return RefundSchema.parse(response.data);
  }

  // Delete refund
  async deleteOrderRefund(orderId: number, refundId: number, force: boolean = false): Promise<Refund> {
    const response = await this.getClient().delete(`orders/${orderId}/refunds/${refundId}`, { force });
    return RefundSchema.parse(response.data);
  }
}