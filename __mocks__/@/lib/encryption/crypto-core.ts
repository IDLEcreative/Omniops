// Mock for @/lib/encryption/crypto-core

export const encrypt = jest.fn((text: string) =>
  Buffer.from(`encrypted_${text}`).toString('base64')
);

export const decrypt = jest.fn((encrypted: string) => {
  const decoded = Buffer.from(encrypted, 'base64').toString();
  return decoded.replace('encrypted_', '');
});