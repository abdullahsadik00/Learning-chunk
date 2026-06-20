import type { ApiError, AuthTokens } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// In-memory access token — intentionally NOT stored in localStorage/sessionStorage
// to prevent XSS token theft. Refresh tokens live in httpOnly cookies.
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

export function setAccessToken(token: string, expiresIn: number): void {
  accessToken = token;
  tokenExpiresAt = Date.now() + expiresIn * 1000;
}

export function clearAccessToken(): void {
  accessToken = null;
  tokenExpiresAt = null;
}

function isTokenExpired(): boolean {
  if (!tokenExpiresAt) return true;
  // Treat as expired 30s early so we don't race with actual expiry
  return Date.now() > tokenExpiresAt - 30_000;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // sends the httpOnly refresh-token cookie
    });
    if (!res.ok) return false;
    const data = (await res.json()) as AuthTokens;
    setAccessToken(data.accessToken, data.expiresIn);
    return true;
  } catch {
    return false;
  }
}

async function buildHeaders(init?: HeadersInit): Promise<Headers> {
  const headers = new Headers(init);
  headers.set('Content-Type', 'application/json');

  // Silently refresh if the token is missing or close to expiry
  if (!accessToken || isTokenExpired()) {
    await refreshAccessToken();
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

class ApiClient {
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    const headers = await buildHeaders(options?.headers);
    const url = `${BASE_URL}${path}`;

    const res = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // On 401, attempt one silent refresh and retry
    if (res.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryHeaders = await buildHeaders();
        const retryRes = await fetch(url, {
          ...options,
          method,
          headers: retryHeaders,
          credentials: 'include',
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.parseResponse<T>(retryRes);
      }
      // Refresh failed — clear state; caller will handle the thrown error
      clearAccessToken();
    }

    return this.parseResponse<T>(res);
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    if (res.status === 204) {
      // No content — return undefined cast as T (callers should use delete<void>)
      return undefined as T;
    }

    let data: unknown;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const err = data as Partial<ApiError>;
      const error = new Error(err.message ?? `Request failed with status ${res.status}`);
      (error as Error & { code?: string }).code = err.code;
      throw error;
    }

    return data as T;
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete(path: string): Promise<void> {
    return this.request<void>('DELETE', path);
  }
}

export const api = new ApiClient();
