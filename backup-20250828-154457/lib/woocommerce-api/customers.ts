import {
  Customer,
  CustomerSchema,
  BatchOperation,
  BatchResponse
} from '../woocommerce-full';

import {
  CustomerDownload,
  WooCommerceClient,
  CustomerListParams,
  ListParams
} from '../woocommerce-types';

export class CustomersAPI {
  constructor(private getClient: () => WooCommerceClient) {}

  // Get all customers with filtering
  async getCustomers(params?: CustomerListParams): Promise<Customer[]> {
    const response = await this.getClient().get<unknown[]>('customers', params);
    return response.data.map((item) => CustomerSchema.parse(item));
  }

  // Get single customer
  async getCustomer(id: number): Promise<Customer> {
    const response = await this.getClient().get<unknown>(`customers/${id}`);
    return CustomerSchema.parse(response.data);
  }

  // Create customer
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await this.getClient().post<unknown>('customers', data);
    return CustomerSchema.parse(response.data);
  }

  // Update customer
  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await this.getClient().put<unknown>(`customers/${id}`, data);
    return CustomerSchema.parse(response.data);
  }

  // Delete customer
  async deleteCustomer(id: number, force: boolean = false): Promise<Customer> {
    const response = await this.getClient().delete<unknown>(`customers/${id}`, { force });
    return CustomerSchema.parse(response.data);
  }

  // Batch customer operations
  async batchCustomers(operations: BatchOperation<Customer>): Promise<BatchResponse<Customer>> {
    const response = await this.getClient().post<any>('customers/batch', operations);
    return {
      create: response.data.create?.map((item: any) => CustomerSchema.parse(item)) || [],
      update: response.data.update?.map((item: any) => CustomerSchema.parse(item)) || [],
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
    const customers = response.data.map((item) => CustomerSchema.parse(item));
    return customers.length > 0 ? customers[0]! : null;
  }
}