interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('citydir_token');
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;
  const token = getToken();

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  if (signal) {
    config.signal = signal;
  }

  const res = await fetch(endpoint, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(endpoint, { ...options, method: 'PUT', body }),
  del: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};