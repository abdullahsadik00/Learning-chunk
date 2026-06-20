class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestConfig {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number; // ms, default 10000
}

// anySignal helper — aborts when ANY signal fires
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  signals.forEach(s =>
    s.addEventListener('abort', () => controller.abort(), { once: true })
  );
  return controller.signal;
}

class ApiClient {
  constructor(private baseURL: string, private defaultTimeout = 10_000) {}

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = config?.timeout ?? this.defaultTimeout;
    const timer = setTimeout(() => controller.abort(), timeout);

    // merge signals if caller passed one
    const signal = config?.signal
      ? anySignal([controller.signal, config.signal])
      : controller.signal;

    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${this.baseURL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal,
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new ApiError(res.status, msg);
      }
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  post<T>(url: string, data: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  patch<T>(url: string, data: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }
}

export const api = new ApiClient('https://jsonplaceholder.typicode.com');
export { ApiClient, ApiError };
