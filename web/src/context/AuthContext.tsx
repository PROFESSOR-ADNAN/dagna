import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api.js';

export interface User {
  id: string;
  handle: string;
  displayName: string;
  email: string;
  phone?: string;
  role: 'user' | 'setter' | 'organizer' | 'admin';
  rating: number;
  solvedCount?: number;
  isMfaEnabled?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('dagna_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await apiRequest('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      localStorage.removeItem('dagna_access_token');
      localStorage.removeItem('dagna_refresh_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('dagna_access_token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('dagna_access_token');
    localStorage.removeItem('dagna_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
