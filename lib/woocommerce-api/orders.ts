import type {
  Order,
  OrderNote,
  Refund,
  BatchOperation,
  BatchResponse
} from '@/lib/woocommerce-full';
import type {
  WooCommerceClient,
  OrderListParams,
  ListParams
} from '@/lib/woocommerce-types';
import { getWooCommerceModule } from './woo-module';

export class OrdersAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Get all orders with filtering
  async getOrders(params?: OrderListParams): Promise<Order[]> {
    const response = await this.getClient().get<unknown[]>('orders', params);
    const { OrderSchema } = getWooCommerceModule();
    return response.data.map((item) => OrderSchema.parse(item));
  }

  // Get single order
  async getOrder(id: number): Promise<Order> {
    const response = await this.getClient().get<unknown>(`orders/${id}`);
    const { OrderSchema } = getWooCommerceModule();
    return OrderSchema.parse(response.data);
  }

  // Create order
  async createOrder(data: Partial<Order>): Promise<Order> {
    const response = await this.getClient().post<unknown>('orders', data);
    const { OrderSchema } = getWooCommerceModule();
    return OrderSchema.parse(response.data);
  }

  // Update order
  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    const response = await this.getClient().put<unknown>(`orders/${id}`, data);
    const { OrderSchema } = getWooCommerceModule();
    return OrderSchema.parse(response.data);
  }

  // Delete order
  async deleteOrder(id: number, force: boolean = false): Promise<Order> {
    const response = await this.getClient().delete<unknown>(`orders/${id}`, { force });
    const { OrderSchema } = getWooCommerceModule();
    return OrderSchema.parse(response.data);
  }

  // Batch order operations
  async batchOrders(operations: BatchOperation<Order>): Promise<BatchResponse<Order>> {
    const response = await this.getClient().post<any>('orders/batch', operations);
    const { OrderSchema } = getWooCommerceModule();
    return {
      create: response.data.create?.map((item: any) => OrderSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => OrderSchema.parse(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Get order notes
  async getOrderNotes(orderId: number, params?: ListParams): Promise<OrderNote[]> {
    const response = await this.getClient().get<unknown[]>(`orders/${orderId}/notes`, params);
    const { OrderNoteSchema } = getWooCommerceModule();
    return response.data.map((item) => OrderNoteSchema.parse(item));
  }

  // Get single order note
  async getOrderNote(orderId: number, noteId: number): Promise<OrderNote> {
    const response = await this.getClient().get<unknown>(`orders/${orderId}/notes/${noteId}`);
    const { OrderNoteSchema } = getWooCommerceModule();
    return OrderNoteSchema.parse(response.data);
  }

  // Create order note
  async createOrderNote(orderId: number, data: Partial<OrderNote>): Promise<OrderNote> {
    const response = await this.getClient().post<unknown>(`orders/${orderId}/notes`, data);
    const { OrderNoteSchema } = getWooCommerceModule();
    return OrderNoteSchema.parse(response.data);
  }

  // Delete order note
  async deleteOrderNote(orderId: number, noteId: number, force: boolean = false): Promise<OrderNote> {
    const response = await this.getClient().delete<unknown>(`orders/${orderId}/notes/${noteId}`, { force });
    const { OrderNoteSchema } = getWooCommerceModule();
    return OrderNoteSchema.parse(response.data);
  }

  // Get order refunds
  async getOrderRefunds(orderId: number, params?: ListParams): Promise<Refund[]> {
    const response = await this.getClient().get<unknown[]>(`orders/${orderId}/refunds`, params);
    const { RefundSchema } = getWooCommerceModule();
    return response.data.map((item) => RefundSchema.parse(item));
  }

  // Get single refund
  async getOrderRefund(orderId: number, refundId: number): Promise<Refund> {
    const response = await this.getClient().get<unknown>(`orders/${orderId}/refunds/${refundId}`);
    const { RefundSchema } = getWooCommerceModule();
    return RefundSchema.parse(response.data);
  }

  // Create refund
  async createOrderRefund(orderId: number, data: Partial<Refund>): Promise<Refund> {
    const response = await this.getClient().post<unknown>(`orders/${orderId}/refunds`, data);
    const { RefundSchema } = getWooCommerceModule();
    return RefundSchema.parse(response.data);
  }

  // Delete refund
  async deleteOrderRefund(orderId: number, refundId: number, force: boolean = false): Promise<Refund> {
    const response = await this.getClient().delete<unknown>(`orders/${orderId}/refunds/${refundId}`, { force });
    const { RefundSchema } = getWooCommerceModule();
    return RefundSchema.parse(response.data);
  }

  // Get all refunds (across all orders)
  async getRefunds(params?: ListParams): Promise<Refund[]> {
    const response = await this.getClient().get<unknown[]>('refunds', params);
    const { RefundSchema } = getWooCommerceModule();
    return response.data.map((item) => RefundSchema.parse(item));
  }
}
