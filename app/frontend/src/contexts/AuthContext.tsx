import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthContextType } from '../types';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use sessionStorage for per-tab auth state (each tab maintains its own session)
  // localStorage is only used for cross-tab data refresh triggers

  useEffect(() => {
    const loadStoredAuth = () => {
      // Load from sessionStorage (per-tab, not shared across tabs)
      const storedToken = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Set token and user initially - verification will happen on first API call
          setToken(storedToken);
          setUser(userData);
        } catch (error) {
          // Invalid stored data, clear it
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    loadStoredAuth();

    // Listen for data refresh events from other tabs (not auth changes)
    // Each tab maintains its own auth state - don't let other tabs change it
    const handleStorageChange = (e: StorageEvent) => {
      // IGNORE token/user changes from localStorage - each tab has its own session
      // Only listen for data refresh triggers for cross-tab data updates
      
      // Listen for data refresh events from other tabs
      if (e.key === 'data-refresh-trigger') {
        // When any tab updates data, trigger refresh in other tabs
        try {
          const refreshData = e.newValue ? JSON.parse(e.newValue) : null;
          if (refreshData && refreshData.type) {
            // Dispatch custom event for components to listen to
            window.dispatchEvent(new CustomEvent('data-refresh', { 
              detail: { type: refreshData.type, timestamp: refreshData.timestamp } 
            }));
          }
        } catch (error) {
          console.error('Error parsing refresh data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array - only run once on mount

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const sanitized = {
        email: (credentials.email || '').trim().toLowerCase(),
        password: (credentials.password || '').trim()
      };
      const response = await apiService.login(sanitized);
      
      if (response.status === 'success') {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        // Store in sessionStorage (per-tab, not shared across tabs)
        // Each tab maintains its own independent session
        sessionStorage.setItem('token', authToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        toast.success('Login successful!');
        return userData;
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(data);
      
      if (response.status === 'success') {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        // Store in sessionStorage (per-tab, not shared across tabs)
        // Each tab maintains its own independent session
        sessionStorage.setItem('token', authToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        toast.success('Registration successful!');
        return userData;
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await apiService.updateProfile(data);
      
      if (response.status === 'success') {
        const { user: userData } = response.data;
        setUser(userData);
        // Update both sessionStorage and localStorage
        sessionStorage.setItem('user', JSON.stringify(userData));
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // Clear sessionStorage (this tab only)
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    login: login as unknown as (credentials: LoginCredentials) => Promise<User>,
    register: register as unknown as (data: RegisterData) => Promise<User>,
    updateProfile,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
