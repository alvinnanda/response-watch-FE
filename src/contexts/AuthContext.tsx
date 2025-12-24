import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, LoginCredentials, AuthResponse, RegisterCredentials } from '../types/auth';
import { commonFetch, authFetch, ApiError, getCookie, setCookie, removeCookie } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || getCookie('token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint to clear server-side session
      if (token) {
        await authFetch('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      // Ignore errors during logout - we'll clear local state anyway
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      removeCookie('token');
    }
  }, [token]);

  // Fetch current user from API
  const fetchUser = useCallback(async () => {
    try {
      const response = await authFetch<{ user: User }>('/auth/me');
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response.user;
    } catch (error) {
      // If fetching user fails, clear auth state
      if (error instanceof ApiError && error.status === 401) {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        removeCookie('token');
      }
      throw error;
    }
  }, []);

  // Check for stored token and validate it on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token') || getCookie('token');
      
      if (storedToken) {
        setToken(storedToken);
        
        // Try to load cached user first for faster UI
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
        
        // Then validate token by fetching fresh user data
        try {
          await fetchUser();
        } catch (error) {
          // Token invalid, user will be logged out
          console.warn('Failed to validate token:', error);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  // Listen for unauthorized events from api utils
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      removeCookie('token');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await commonFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const { user, token } = response;
    setUser(user);
    setToken(token);
    
    // Store in both localStorage AND cookie for maximum compatibility
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCookie('token', token);
  };

  const register = async (data: RegisterCredentials) => {
    // Register only - does NOT auto-login
    // User will be redirected to login page after successful registration
    await commonFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Success - but we don't set user/token here
    // The RegisterPage will redirect to login
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await authFetch<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const updatedUser = response.user;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
