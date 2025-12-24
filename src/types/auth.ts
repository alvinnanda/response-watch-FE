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
