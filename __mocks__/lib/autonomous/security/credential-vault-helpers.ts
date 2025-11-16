// Manual mock for credential-vault-helpers
import { jest } from '@jest/globals';

export const getCredential = jest.fn();
export const storeCredential = jest.fn();
export const deleteCredential = jest.fn();
