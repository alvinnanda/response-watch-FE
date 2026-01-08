import { toast } from 'sonner';

// Primary and fallback API URLs from environment
const API_PRIMARY = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_FALLBACK = import.meta.env.VITE_API_FALLBACK_URL || '';
const TIMEOUT_MS = 2500; // 5 seconds timeout before trying fallback

// Export for backward compatibility
export const API_BASE_URL = API_PRIMARY;

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
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string, 
  config: RequestInit, 
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Common fetch wrapper with failover support.
 * Tries primary API first, falls back to secondary if timeout or error.
 */
export async function commonFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { headers = {}, ...rest } = options;

  const config: RequestInit = {
    credentials: 'include',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  let response: Response;
  let slowNetworkTimeout: ReturnType<typeof setTimeout> | undefined;
  let usedFallback = false;

  // Show toast if taking too long
  slowNetworkTimeout = setTimeout(() => {
    toast.warning("Server is waking up... please wait.");
  }, 8000);

  try {
    // Try primary API first
    try {
      response = await fetchWithTimeout(`${API_PRIMARY}${endpoint}`, config, TIMEOUT_MS);
      
      // If server error (5xx), try fallback (only for GET requests)
      if (response.status >= 500 && API_FALLBACK && (!config.method || config.method === 'GET')) {
        throw new Error(`Primary API error: ${response.status}`);
      }
    } catch (primaryError) {
      // Only try fallback if configured, primary failed, and it's a GET request
      // This prevents mutations (POST, PUT, DELETE) from being retried on fallback
      const isGetRequest = !config.method || config.method === 'GET';
      if (API_FALLBACK && isGetRequest) {
        console.log('Primary API failed, trying fallback...', primaryError);
        usedFallback = true;
        response = await fetch(`${API_FALLBACK}${endpoint}`, config);
      } else {
        throw primaryError;
      }
    }
  } finally {
    if (slowNetworkTimeout) clearTimeout(slowNetworkTimeout);
  }

  // Log which API was used (for debugging)
  if (usedFallback) {
    console.log(`Request served by fallback API: ${endpoint}`);
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData = null;

    try {
      const data = await response.json();
      errorData = data;
      errorMessage = data.message || data.error || errorMessage;
    } catch (e) {
      errorMessage = response.statusText;
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
    return {} as T;
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
