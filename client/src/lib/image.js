const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  try {
    const source = new URL(rawUrl);
    const apiOrigin = new URL(API_ORIGIN).origin;

    // Some posts store localhost URLs even when accessed from a different host.
    if ((source.hostname === 'localhost' || source.hostname === '127.0.0.1') && source.origin !== apiOrigin) {
      return `${apiOrigin}${source.pathname}`;
    }

    return rawUrl;
  } catch {
    if (rawUrl.startsWith('/')) {
      return `${API_ORIGIN}${rawUrl}`;
    }

    return rawUrl;
  }
}
