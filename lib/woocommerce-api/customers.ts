import type {
  Customer,
  BatchOperation,
  BatchResponse
} from '@/lib/woocommerce-full';

import type {
  CustomerDownload,
  WooCommerceClient,
  CustomerListParams,
  ListParams
} from '@/lib/woocommerce-types';
import { getWooCommerceModule } from './woo-module';

const parseCustomer = (data: unknown) => getWooCommerceModule().CustomerSchema.parse(data);

export class CustomersAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Get all customers with filtering
  async getCustomers(params?: CustomerListParams): Promise<Customer[]> {
    const response = await this.getClient().get<unknown[]>('customers', params);
    return response.data.map((item) => parseCustomer(item));
  }

  // Get single customer
  async getCustomer(id: number): Promise<Customer> {
    const response = await this.getClient().get<unknown>(`customers/${id}`);
    return parseCustomer(response.data);
  }

  // Create customer
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await this.getClient().post<unknown>('customers', data);
    return parseCustomer(response.data);
  }

  // Update customer
  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await this.getClient().put<unknown>(`customers/${id}`, data);
    return parseCustomer(response.data);
  }

  // Delete customer
  async deleteCustomer(id: number, force: boolean = false): Promise<Customer> {
    const response = await this.getClient().delete<unknown>(`customers/${id}`, { force });
    return parseCustomer(response.data);
  }

  // Batch customer operations
  async batchCustomers(operations: BatchOperation<Customer>): Promise<BatchResponse<Customer>> {
    const response = await this.getClient().post<any>('customers/batch', operations);
    return {
      create: response.data.create?.map((item: any) => parseCustomer(item)) || [],
      update: response.data.update?.map((item: any) => parseCustomer(item)) || [],
      delete: response.data.delete || []
    };
  }

  // Get customer downloads
  async getCustomerDownloads(customerId: number, params?: ListParams): Promise<CustomerDownload[]> {
    const response = await this.getClient().get<CustomerDownload[]>(`customers/${customerId}/downloads`, params);
    return response.data;
  }

  // Get customer by email
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const response = await this.getClient().get<unknown[]>('customers', { email });
    const customers = response.data.map((item) => parseCustomer(item));
    return customers.length > 0 ? customers[0]! : null;
  }
}
