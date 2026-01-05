// Auth types definitions
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  organization?: string;
  is_active?: boolean;
  is_public?: boolean;
  email_verified?: boolean;
  role?: 'admin' | 'user';
  plan?: 'free' | 'basic' | 'pro' | 'enterprise'; // Added plan field
  subscription_expires_at?: string; // Expiration date
  monthly_request_count?: number; // Added tracking field
  notify_email?: boolean; // Email notification preference
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  full_name?: string;
  organization?: string;
}
