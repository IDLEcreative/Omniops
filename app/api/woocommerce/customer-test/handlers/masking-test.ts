/**
 * Data masking test handler
 */

import { DataMasker } from '@/lib/customer-verification';
import type { TestResult } from '../types';

export async function runMaskingTest(): Promise<TestResult> {
  const testData = {
    email: 'johndoe@example.com',
    phone: '+1234567890',
    address: {
      city: 'New York',
      state: 'NY',
      country: 'US',
      postcode: '10001',
    },
    card: '4111111111111111',
  };

  return {
    success: true,
    original: testData,
    masked: {
      email: DataMasker.maskEmail(testData.email),
      phone: DataMasker.maskPhone(testData.phone),
      address: DataMasker.maskAddress(testData.address),
      card: DataMasker.maskCard(testData.card),
    },
  };
}
