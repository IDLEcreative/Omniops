/**
 * Sample file C - standalone module with no circular dependencies
 */

import { validateData } from './utils';
import fetch from 'node-fetch';

interface DataLoader {
  getData(): Promise<any[]>;
  validateResponse(data: any): boolean;
}

export class DefaultDataLoader implements DataLoader {
  private apiUrl = 'https://api.example.com/data';

  async getData(): Promise<any[]> {
    try {
      const response = await fetch(this.apiUrl);
      const data = await response.json();
      
      if (this.validateResponse(data)) {
        return data;
      }
      
      throw new Error('Invalid data received');
    } catch (error) {
      console.error('Failed to load data:', error);
      return [];
    }
  }

  validateResponse(data: any): boolean {
    return validateData(data);
  }
}

// Default export
export default DefaultDataLoader;

// Additional named exports
export const API_VERSION = 'v1';
export const TIMEOUT = 5000;

// Function exports
export function createLoader(apiUrl?: string): DataLoader {
  const loader = new DefaultDataLoader();
  if (apiUrl) {
    (loader as any).apiUrl = apiUrl;
  }
  return loader;
}

export async function quickLoad(): Promise<any[]> {
  const loader = new DefaultDataLoader();
  return loader.getData();
}