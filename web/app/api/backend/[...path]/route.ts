export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const targetBase = process.env.BACKEND_PROXY_TARGET || 'https://api.hapurpilikhuwaproperty.in';

const hopByHopHeaders = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const splitSetCookie = (value: string) =>
  value.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((cookie) => cookie.trim()).filter(Boolean);

const getSetCookies = (headers: Headers) => {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = withGetter.getSetCookie?.();
  if (cookies?.length) return cookies;
  const cookie = headers.get('set-cookie');
  return cookie ? splitSetCookie(cookie) : [];
};

const rewriteSetCookieForLocalhost = (cookie: string) =>
  cookie
    .replace(/;\s*Domain=[^;]*/gi, '')
    .replace(/;\s*Secure/gi, '')
    .replace(/;\s*SameSite=None/gi, '; SameSite=Lax');

async function proxy(request: Request, context: { params: Promise<{ path?: string[] }> | { path?: string[] } }) {
  const params = await Promise.resolve(context.params);
  const requestUrl = new URL(request.url);
  const targetUrl = new URL(`/${(params.path || []).join('/')}`, targetBase);
  targetUrl.search = requestUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');
  requestHeaders.delete('content-length');
  requestHeaders.delete('accept-encoding');

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: requestHeaders,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
    cache: 'no-store',
    ...(hasBody ? { duplex: 'half' } : {}),
  } as RequestInit & { duplex?: 'half' });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'set-cookie' || hopByHopHeaders.has(lowerKey)) return;
    responseHeaders.set(key, value);
  });

  for (const cookie of getSetCookies(upstream.headers)) {
    responseHeaders.append('set-cookie', rewriteSetCookieForLocalhost(cookie));
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
