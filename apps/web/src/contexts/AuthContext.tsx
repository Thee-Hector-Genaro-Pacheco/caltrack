import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginDto } from '@caltrack/types';
import api from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginDto) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('caltrack_token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const profile = await api.getCurrentUser();
          setUser(profile);
        } catch (error) {
          console.error('Failed to load authenticated user profile:', error);
          // Token expired or invalid
          localStorage.removeItem('caltrack_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (credentials: LoginDto) => {
    try {
      const res = await api.login(credentials);
      localStorage.setItem('caltrack_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('caltrack_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
