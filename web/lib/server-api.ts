import 'server-only';

type ServerQueryValue = string | number | boolean | null | undefined;
type ServerQueryParams = Record<string, ServerQueryValue | ServerQueryValue[]>;

export class ServerApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const configuredBackendUrl =
  process.env.SERVER_BACKEND_URL ||
  process.env.BACKEND_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api.hapurpilikhuwaproperty.in';
const backendUrl = /^https?:\/\//.test(configuredBackendUrl)
  ? configuredBackendUrl
  : process.env.BACKEND_PROXY_TARGET || 'https://api.hapurpilikhuwaproperty.in';
const serverApiTimeoutMs = Number(process.env.SERVER_API_TIMEOUT_MS || 3000);

const appendQueryValue = (searchParams: URLSearchParams, key: string, value: ServerQueryValue) => {
  if (value === undefined || value === null || value === '') return;
  searchParams.append(key, String(value));
};

export async function getServerJson<T>(
  path: string,
  options: { params?: ServerQueryParams; revalidate?: number } = {},
): Promise<T> {
  const url = new URL(path, backendUrl);
  const { params, revalidate = 300 } = options;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach((item) => appendQueryValue(url.searchParams, key, item));
      } else {
        appendQueryValue(url.searchParams, key, value);
      }
    }
  }

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new ServerApiError(504, `Backend request timed out after ${serverApiTimeoutMs}ms`));
    }, serverApiTimeoutMs);
  });

  const response = await Promise.race([
    fetch(url, {
      next: { revalidate },
      signal: controller.signal,
    }),
    timeoutPromise,
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      message = errorBody.message || message;
    } catch {
      // Fall back to the HTTP status text.
    }
    throw new ServerApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}
