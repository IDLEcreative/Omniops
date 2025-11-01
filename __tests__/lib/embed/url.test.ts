import { createServerUrlCandidates } from '@/lib/embed/url';

describe('createServerUrlCandidates', () => {
  it('prefers canonical www host when starting with bare domain', () => {
    const result = createServerUrlCandidates('https://omniops.co.uk');
    expect(result[0]).toBe('https://www.omniops.co.uk');
    expect(result).toContain('https://omniops.co.uk');
  });

  it('includes bare host when input already uses www', () => {
    const result = createServerUrlCandidates('https://www.omniops.co.uk');
    expect(result).toContain('https://www.omniops.co.uk');
    expect(result).toContain('https://omniops.co.uk');
    expect(result.indexOf('https://www.omniops.co.uk')).toBeLessThan(result.indexOf('https://omniops.co.uk'));
  });

  it('handles host without scheme', () => {
    const result = createServerUrlCandidates('omniops.co.uk');
    expect(result).toContain('omniops.co.uk');
    expect(result).toContain('https://www.omniops.co.uk');
  });

  it('returns empty array for missing input', () => {
    expect(createServerUrlCandidates(undefined)).toEqual([]);
    expect(createServerUrlCandidates('')).toEqual([]);
  });
});

