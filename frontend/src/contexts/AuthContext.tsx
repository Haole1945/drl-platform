'use client';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@/types/auth';
import { getCurrentUser, logout as apiLogout } from '@/lib/auth';
import { removeAuthToken, getAuthToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user from token on mount
   */
  useEffect(() => {
    const loadUser = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
          // Store user ID for X-User-Id header
          if (typeof window !== 'undefined' && response.data.id) {
            localStorage.setItem('userId', String(response.data.id));
          }
        } else {
          // Token invalid, remove it
          removeAuthToken();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userId');
          }
        }
      } catch (error) {
        // API client handles retries automatically
        // Only log persistent errors after all retries
        removeAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login function - sets user and token
   */
  const login = useCallback((userData: User, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
    setUser(userData);
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId');
    }
  }, []);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      // API client handles retries automatically
      // Only log persistent errors after all retries
      // If refresh fails, user might be logged out
      await logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

