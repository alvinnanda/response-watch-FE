import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  token?: string | null;
}

// Cookie helpers
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days = 7) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
}

export function removeCookie(name: string) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

/**
 * Common fetch wrapper that handles base URL and error parsing.
 * Now defaults to credentials: 'include' for cookie support.
 */
export async function commonFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { headers = {}, ...rest } = options;

  const config: RequestInit = {
    credentials: 'include', // Ensure cookies are sent with requests
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  let response: Response;
  let slowNetworkTimeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutId = setTimeout(() => {
    toast.warning("Server is waking up... Upgrade to Pro for zero downtime.");
  }, 8000); // 10s timeout for cold start detection

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } finally {
    clearTimeout(timeoutId);
    if (slowNetworkTimeout) clearTimeout(slowNetworkTimeout);
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData = null;

    try {
      const data = await response.json();
      errorData = data;
      errorMessage = data.message || data.error || errorMessage;
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = response.statusText;
    }

    // Redirect to 404 page if resource not found, but exclude auth checks
    if (response.status === 404 && !endpoint.includes('/auth/me')) {
      window.location.href = '/not-found';
      throw new ApiError(response.status, errorMessage, errorData);
    }

    throw new ApiError(response.status, errorMessage, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch (e) {
    return {} as T; // Fallback for empty responses that aren't 204
  }
}

/**
 * Authenticated fetch wrapper that automatically injects the token.
 * Checks options -> localStorage -> cookie.
 */
export async function authFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = options.token || localStorage.getItem('token') || getCookie('token');
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    return await commonFetch<T>(endpoint, { ...options, headers });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw error;
  }
}
