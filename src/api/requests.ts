// API functions for requests
import { authFetch, commonFetch } from '../utils/api';
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
  if (filters.vendor_group_id) params.append('vendor_group_id', filters.vendor_group_id.toString());
  
  const queryString = params.toString();
  const endpoint = queryString ? `/requests?${queryString}` : '/requests';
  
  return authFetch<RequestListResponse>(endpoint);
}

/**
 * Fetch request statistics
 */
export async function getRequestStats(filters: RequestFilters = {}): Promise<RequestStats> {
  const params = new URLSearchParams();
  
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.search) params.append('search', filters.search);
  if (filters.vendor_group_id) params.append('vendor_group_id', filters.vendor_group_id.toString());
  // Note: We typically don't filter stats by 'page' or 'limit', but 'status' filter might be relevant if we wanted to drill down, 
  // but usually stats OVERVIEW shows all statuses. However, if user filters by "Waiting", should the charts only show "Waiting"?
  // Usually the cards show totals for each status, so filtering by status might make the cards redundant or confusing.
  // For now, let's keep status filter OUT of stats to keep the overview holistic, OR only apply it if explicitly needed.
  // The plan said "Status, Vendor, Search". Let's include status if the backend supports it, but checking backend implementation...
  // The backend implementation I just wrote APPLIES standard filters.
  // The "Status" card query calculates counts FOR EACH status. If I filter by status=waiting, the query will logically only return count for waiting.
  // This is acceptable behavior: "Show me stats for Waiting requests".
  if (filters.status) params.append('status', filters.status);

  const queryString = params.toString();
  const endpoint = queryString ? `/requests/stats?${queryString}` : '/requests/stats';
  
  return authFetch<RequestStats>(endpoint);
}

/**
 * Fetch premium request statistics
 */
export async function getPremiumRequestStats(filters: RequestFilters = {}): Promise<RequestStats> {
  const params = new URLSearchParams();
  
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.search) params.append('search', filters.search);
  if (filters.vendor_group_id) params.append('vendor_group_id', filters.vendor_group_id.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/requests/stats/premium?${queryString}` : '/requests/stats/premium';
  
  return authFetch<RequestStats>(endpoint);
}

/**
 * Create a new request
 */
export async function createRequest(data: {
  title: string;
  description?: string;
  embedded_pic_list?: string[];
  followup_link?: string;
  is_description_secure?: boolean;
  description_pin?: string;
  vendor_group_id?: number;
  scheduled_time?: string;
}): Promise<Request> {
  try {
    return await authFetch<Request>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    if (err.status === 429 || err.status === 403) {
      // Re-throw with plan data if available
      const error = new Error(err.message) as Error & { 
        status?: number; 
        current_plan?: string;
      };
      error.status = err.status;
      if (err.data && err.data.current_plan) {
        error.current_plan = err.data.current_plan;
      }
      throw error;
    }
    throw err;
  }
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
export async function deleteRequest(uuid: string): Promise<void> {
  return authFetch(`/requests/${uuid}`, { method: 'DELETE' });
}

/**
 * Reopen a completed request
 */
export async function reopenRequest(id: number): Promise<Request> {
  return authFetch<Request>(`/requests/${id}/reopen`, { method: 'PUT' });
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
  try {
    return await commonFetch<PublicCreateResponse>('/public/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    // Preserve the existing error structure for catch blocks that expect specific properties
    if (err.data) {
       const error = new Error(err.message) as Error & { 
        status?: number; 
        remaining_quota?: number;
        reset_at?: string;
      };
      error.status = err.status;
      error.remaining_quota = err.data.remaining_quota;
      error.reset_at = err.data.reset_at;
      throw error;
    }
    throw err;
  }
}

/**
 * Create a public request for a specific user (no auth required)
 */
export interface CreatePublicRequestResponse {
    request: Request;
    remaining_quota: number;
}
  
export const createPublicRequestForUser = async (username: string, data: { title: string; description?: string; followup_link?: string; fingerprint: string }) => {
  const response = await commonFetch<CreatePublicRequestResponse>(`/public/requests/${username}`, {
      method: 'POST',
      body: JSON.stringify(data),
  });
  return response;
};

// =====================
// Public SmartLink API
// =====================

export interface PublicRequest {
  id: number;
  url_token: string;
  title: string;
  description?: string;
  followup_link?: string;
  status: 'waiting' | 'in_progress' | 'done' | 'scheduled';
  embedded_pic_list: string[];
  start_pic?: string;
  end_pic?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  response_time_seconds?: number;
  pic_is_public?: boolean;
  is_description_secure: boolean;
  scheduled_time?: string;
  reopened_at?: string;
  reopen_count?: number;
  checkbox_issue_mismatch?: boolean;
  resolution_notes?: string;
  vendor_name?: string;
}



/**
 * Get public request by token (no auth required)
 */
export async function getPublicRequest(token: string): Promise<PublicRequest> {
  return commonFetch<PublicRequest>(`/public/t/${token}`);
}

/**
 * Start response on a public request
 */
export async function startPublicRequest(token: string, picName?: string): Promise<PublicRequest> {
  return commonFetch<PublicRequest>(`/public/t/${token}/start`, {
    method: 'POST',
    body: JSON.stringify({ pic_name: picName }),
  });
}

/**
 * Finish/resolve a public request
 */
export async function finishPublicRequest(
  token: string, 
  picName?: string,
  checkboxIssueMismatch?: boolean,
  resolutionNotes?: string
): Promise<PublicRequest> {
  return commonFetch<PublicRequest>(`/public/t/${token}/finish`, {
    method: 'POST',
    body: JSON.stringify({ 
      pic_name: picName,
      checkbox_issue_mismatch: checkboxIssueMismatch || false,
      resolution_notes: resolutionNotes 
    }),
  });
}

/**
 * Verify PIN for secured description
 */
export async function verifyDescriptionPin(token: string, pin: string, fingerprint: string): Promise<{ success: boolean; description?: string }> {
  return commonFetch<{ success: boolean; description?: string }>(`/public/t/${token}/verify-pin`, {
    method: 'POST',
    body: JSON.stringify({ pin, fingerprint }),
  });
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

  return commonFetch<PublicMonitoringResponse>(
    `/public/monitoring/${username}?${query.toString()}`,
    { signal }
  );
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
