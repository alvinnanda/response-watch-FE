// Request types for dashboard

export interface Request {
  id: number;
  uuid: string;
  url_token: string;
  title: string;
  description?: string;
  followup_link?: string;
  status: 'waiting' | 'in_progress' | 'done';
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
}

export interface RequestFilters {
  page?: number;
  limit?: number;
  status?: 'waiting' | 'in_progress' | 'done' | '';
  start_date?: string;
  end_date?: string;
  search?: string;
}
