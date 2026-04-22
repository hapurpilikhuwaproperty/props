export const DEFAULT_AUTH_REDIRECT = '/dashboard';

export function sanitizeNextPath(value: string | null | undefined, fallback = DEFAULT_AUTH_REDIRECT) {
  if (!value) return fallback;

  try {
    const candidate = decodeURIComponent(value).trim();
    if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\') || candidate.includes('://')) {
      return fallback;
    }

    const parsed = new URL(candidate, 'http://localhost');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getNextPathFromWindow(fallback = DEFAULT_AUTH_REDIRECT) {
  if (typeof window === 'undefined') return fallback;
  return sanitizeNextPath(new URLSearchParams(window.location.search).get('next'), fallback);
}
