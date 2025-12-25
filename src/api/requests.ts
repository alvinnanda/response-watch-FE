// API functions for requests
import { authFetch } from '../utils/api';
import type { RequestListResponse, RequestStats, RequestFilters, Request } from '../types/requests';

/**
 * Fetch paginated requests with filters
 */
export async function getRequests(filters: RequestFilters = {}): Promise<RequestListResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  const endpoint = queryString ? `/requests?${queryString}` : '/requests';
  
  return authFetch<RequestListResponse>(endpoint);
}

/**
 * Fetch request statistics
 */
export async function getRequestStats(): Promise<RequestStats> {
  return authFetch<RequestStats>('/requests/stats');
}

/**
 * Create a new request
 */
export async function createRequest(data: {
  title: string;
  description?: string;
  embedded_pic_list?: string[];
  followup_link?: string;
}): Promise<Request> {
  return authFetch<Request>('/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing request
 */
export async function updateRequest(id: number, data: {
  title?: string;
  description?: string;
  embedded_pic_list?: string[];
  followup_link?: string;
}): Promise<Request> {
  return authFetch<Request>(`/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get a single request by ID
 */
export async function getRequest(id: number): Promise<Request> {
  return authFetch<Request>(`/requests/${id}`);
}

/**
 * Delete a request
 */
export async function deleteRequest(id: number): Promise<void> {
  return authFetch(`/requests/${id}`, { method: 'DELETE' });
}

/**
 * Response type for public create request
 */
export interface PublicCreateResponse {
  request: Request;
  remaining_quota: number;
}

/**
 * Create a public request (no auth required)
 * Limited to 10/month per device fingerprint
 */
export async function createPublicRequest(data: {
  title: string;
  description?: string;
  fingerprint: string;
  followup_link?: string;
}): Promise<PublicCreateResponse> {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  const response = await fetch(`${API_BASE_URL}/public/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Request failed') as Error & { 
      status?: number; 
      remaining_quota?: number;
      reset_at?: string;
    };
    error.status = response.status;
    error.remaining_quota = errorData.remaining_quota;
    error.reset_at = errorData.reset_at;
    throw error;
  }

  return response.json();
}

// =====================
// Public SmartLink API
// =====================

export interface PublicRequest {
  id: number;
  url_token: string;
  title: string;
  description?: string;
  followup_link?: string;
  status: 'waiting' | 'in_progress' | 'done';
  embedded_pic_list: string[];
  start_pic?: string;
  end_pic?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  response_time_seconds?: number;
  pic_is_public?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get public request by token (no auth required)
 */
export async function getPublicRequest(token: string): Promise<PublicRequest> {
  const response = await fetch(`${API_BASE_URL}/public/t/${token}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request not found');
  }
  
  return response.json();
}

/**
 * Start response on a public request
 */
export async function startPublicRequest(token: string, picName?: string): Promise<PublicRequest> {
  const response = await fetch(`${API_BASE_URL}/public/t/${token}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pic_name: picName }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to start response');
  }
  
  return response.json();
}

/**
 * Finish/resolve a public request
 */
export async function finishPublicRequest(token: string, picName?: string): Promise<PublicRequest> {
  const response = await fetch(`${API_BASE_URL}/public/t/${token}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pic_name: picName }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to finish response');
  }
  
  return response.json();
}

/**
 * Response for public monitoring
 */
export interface PublicMonitoringResponse {
  requests: PublicRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  user: {
    username: string;
    full_name?: string;
    organization?: string;
  };
}

/**
 * Get public requests by username for monitoring
 */
export async function getPublicRequestsByUsername(
  username: string, 
  params: { status?: string, page: number, limit: number, start_date?: string, end_date?: string },
  signal?: AbortSignal
): Promise<PublicMonitoringResponse> {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('limit', params.limit.toString());
  if (params.status) query.append('status', params.status);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  const response = await fetch(`${API_BASE_URL}/public/monitoring/${username}?${query.toString()}`, { signal });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch requests');
  }

  return response.json();
}

/**
 * Get monitoring requests for the dashboard (authenticated)
 */
export async function getDashboardMonitoring(
  params: { status?: string, page: number, limit: number, start_date?: string, end_date?: string },
  signal?: AbortSignal
): Promise<PublicMonitoringResponse> {
  const query = new URLSearchParams();
  query.append('page', params.page.toString());
  query.append('limit', params.limit.toString());
  if (params.status) query.append('status', params.status);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);

  return authFetch<PublicMonitoringResponse>(`/requests/monitoring?${query.toString()}`, { signal });
}
