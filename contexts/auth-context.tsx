'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api-client/auth-api';
import Cookies from 'js-cookie';
import { User } from '@/models/auth';
import { AxiosError } from 'axios';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Set up token refresh interval
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (isLoggedIn) {
      // Refresh token every 59 minutes
      refreshInterval = setInterval(() => {
        refreshToken();
      }, 59 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isLoggedIn]);

  // Get user data on initial load and when login status changes
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    if (token) {
      setIsLoggedIn(true);
      fetchUserData();
    }
  }, [isLoggedIn]);

  const fetchUserData = async () => {
    try {
      const response = await authApi.getAccount();
      if (response?.data?.data) {
        setUser(response.data.data);
      }
    } catch (error: unknown) {
      console.error('Error fetching user data:', error);
      // If we can't get user data, consider the user logged out
      if ((error as AxiosError)?.response?.status === 401) {
        logout();
      }
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken();
      const newToken = response?.data?.data?.accessToken;

      if (newToken) {
        localStorage.setItem('accessToken', newToken);
        Cookies.set('accessToken', newToken, {
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
    } catch (error: unknown) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  const login = (token: string) => {
    if (!token) return;

    // Store token in both localStorage and cookie
    localStorage.setItem('accessToken', token);
    Cookies.set('accessToken', token, {
      expires: 7, // 7 days
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    setIsLoggedIn(true);
    fetchUserData();
  };

  const logout = () => {
    // Clear token from both localStorage and cookie
    localStorage.removeItem('accessToken');
    Cookies.remove('accessToken', { path: '/' });

    // Clear user data
    setUser(null);
    setIsLoggedIn(false);
  };

  const hasRole = (roleName: string) => {
    if (!user || !user.rolesSecured || user.rolesSecured.length === 0) {
      return false;
    }
    return user.rolesSecured.some(role => role.name === roleName.toUpperCase());
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
