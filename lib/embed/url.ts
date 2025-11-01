export function createServerUrlCandidates(urlString: string | undefined | null): string[] {
  const trimmed = (urlString || '').trim();
  if (!trimmed) return [];

  const candidates: string[] = [];
  const add = (value: string | undefined | null) => {
    if (value && !candidates.includes(value)) {
      candidates.push(value);
    }
  };

  try {
    const url = new URL(trimmed);
    const bareHost = url.hostname.replace(/^www\./, '');
    const isLocalhost = bareHost === 'localhost' || bareHost === '127.0.0.1';

    // Don't add www variants for localhost
    if (!isLocalhost && !url.hostname.startsWith('www.')) {
      // Preserve port when creating www variant
      const port = url.port ? `:${url.port}` : '';
      add(`${url.protocol}//www.${bareHost}${port}`);
    }

    add(url.origin);

    if (!isLocalhost && url.hostname.startsWith('www.')) {
      // Preserve port when removing www
      const port = url.port ? `:${url.port}` : '';
      add(`${url.protocol}//${bareHost}${port}`);
    }
  } catch {
    const stripped = trimmed.replace(/\/$/, '');
    add(stripped);
    if (!stripped.includes('://')) {
      add(`https://www.${stripped.replace(/^www\./, '')}`);
    }
  }

  return candidates;
}

