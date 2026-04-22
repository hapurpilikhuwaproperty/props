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

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

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
