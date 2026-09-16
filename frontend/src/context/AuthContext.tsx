import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  bootstrap: (data: { full_name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('pdm_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pdm_token'));
  const [loading, setLoading] = useState<boolean>(false);

  const saveAuthSession = (authData: AuthResponse | { access_token: string; user: User }) => {
    if ('access_token' in authData && 'role' in authData) {
      const u: User = {
        id: (authData as AuthResponse).user_id,
        email: authData.email,
        full_name: authData.full_name,
        role: authData.role,
        status: authData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('pdm_token', authData.access_token);
      localStorage.setItem('pdm_user', JSON.stringify(u));
      setToken(authData.access_token);
      setUser(u);
    } else if ('user' in authData) {
      localStorage.setItem('pdm_token', authData.access_token);
      localStorage.setItem('pdm_user', JSON.stringify(authData.user));
      setToken(authData.access_token);
      setUser(authData.user);
    }
  };

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('pdm_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      localStorage.setItem('pdm_user', JSON.stringify(userData));
    } catch {
      // If token is invalid or expired, log out
      localStorage.removeItem('pdm_token');
      localStorage.removeItem('pdm_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const data = await api.login({ email: cleanEmail, password });
      saveAuthSession(data);
    } finally {
      setLoading(false);
    }
  };

  const bootstrap = async (data: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      const authData = await api.bootstrapSuperAdmin(data);
      saveAuthSession(authData);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pdm_token');
    localStorage.removeItem('pdm_user');
    setToken(null);
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('pdm_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        bootstrap,
        logout,
        refreshUser,
        switchRole,
      }}
    >
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
