// Request types for dashboard

export interface Request {
  id: number;
  uuid: string;
  url_token: string;
  title: string;
  description?: string;
  followup_link?: string;
  status: 'waiting' | 'in_progress' | 'done' | 'scheduled';
  embedded_pic_list: string[];
  start_pic?: string;
  end_pic?: string;
  start_ip?: string;
  end_ip?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  response_time_seconds?: number;
  vendor_group_id?: number;
  vendor_name?: string;
  scheduled_time?: string;
  reopened_at?: string;
  reopen_count?: number;
  checkbox_issue_mismatch?: boolean;
  resolution_notes?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface RequestListResponse {
  requests: Request[];
  pagination: Pagination;
}

export interface RequestStats {
  waiting: number;
  in_progress: number;
  done: number;
  total: number;
  avg_response_time_minutes?: number;
  avg_completion_time_minutes?: number;
  scheduled_count?: number;
  reopen_count?: number;
  daily_counts: { date: string; count: number }[];
  vendor_stats?: {
    vendor_name: string;
    total: number;
    avg_response_time_minutes: number;
    avg_completion_time_minutes: number;
    total_reopen: number;
  }[];
}

export interface RequestFilters {
  page?: number;
  limit?: number;
  status?: 'waiting' | 'in_progress' | 'done' | 'scheduled' | '';
  start_date?: string;
  end_date?: string;
  search?: string;
  vendor_group_id?: number;
}
