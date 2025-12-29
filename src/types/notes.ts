export interface Note {
  id: string; // UUID
  user_id: number;
  title: string;
  content: string;
  remind_at?: string; // ISO string
  is_reminder: boolean;
  reminder_channel?: 'email' | 'webhook' | '';
  webhook_url?: string;
  webhook_payload?: string;
  background_color?: string;
  tagline?: string;
  created_at: string;
  updated_at: string;
}

export interface NoteFilters {
  page?: number;
  limit?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export interface NoteListResponse {
  notes: Note[];
  pagination: Pagination;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  remind_at?: string;
  is_reminder: boolean;
  reminder_channel?: 'email' | 'webhook' | '';
  webhook_url?: string;
  webhook_payload?: string;
  background_color?: string;
  tagline?: string;
}

export interface UpdateNoteRequest extends CreateNoteRequest {}
