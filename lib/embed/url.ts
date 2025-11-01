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
    if (!url.hostname.startsWith('www.')) {
      add(`${url.protocol}//www.${bareHost}`);
    }
    add(url.origin);
    if (url.hostname.startsWith('www.')) {
      add(`${url.protocol}//${bareHost}`);
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

