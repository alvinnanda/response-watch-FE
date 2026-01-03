// Notification types for frontend

export interface NotificationMetadata {
  // Status change fields
  old_status?: string;
  new_status?: string;
  request_title?: string;
  request_token?: string;
  
  // Reminder fields
  note_id?: string;
  note_title?: string;
  channel?: 'email' | 'whatsapp' | 'webhook';
  delivery_status?: 'sent' | 'failed';
  delivery_error?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  request_id?: number;
  type: 'status_change' | 'request_created' | 'reminder';
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  metadata: NotificationMetadata;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}
