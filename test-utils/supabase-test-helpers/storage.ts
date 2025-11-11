export function createMockStorageBucket() {
  return {
    upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
    download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
    remove: jest.fn().mockResolvedValue({ data: null, error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/public-url' },
    }),
    list: jest.fn().mockResolvedValue({ data: [], error: null }),
    move: jest.fn().mockResolvedValue({ data: null, error: null }),
    copy: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}
