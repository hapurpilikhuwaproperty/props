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
  'http://localhost:4000';
const backendUrl = /^https?:\/\//.test(configuredBackendUrl)
  ? configuredBackendUrl
  : process.env.BACKEND_PROXY_TARGET || 'https://api.hapurpilikhuwaproperty.in';
const serverApiTimeoutMs = Number(process.env.SERVER_API_TIMEOUT_MS || 8000);

const createTimeoutSignal = () => {
  const timeout = (AbortSignal as typeof AbortSignal & { timeout?: (milliseconds: number) => AbortSignal }).timeout;
  return timeout ? timeout(serverApiTimeoutMs) : undefined;
};

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

  const response = await fetch(url, {
    next: { revalidate },
    signal: createTimeoutSignal(),
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
