import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import * as authService from '../services/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUserAndToken: (user: Record<string, unknown>, token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): User | null {
  const stored = sessionStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
}

function readToken(): string | null {
  return sessionStorage.getItem('token');
}

function writeSession(user: User | null, token: string | null) {
  if (user) {
    sessionStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('user');
  }
  if (token) {
    sessionStorage.setItem('token', token);
  } else {
    sessionStorage.removeItem('token');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);
  const [token, setToken] = useState<string | null>(readToken);

  const isAuthenticated = !!token && !!user;

  const login = useCallback(async (username: string, password: string) => {
    const response = await authService.login(username, password);
    writeSession(response.user, response.token);
    setUser(response.user);
    setToken(response.token);
  }, []);

  const logout = useCallback(() => {
    writeSession(null, null);
    setUser(null);
    setToken(null);
  }, []);

  const setUserAndToken = useCallback((userData: Record<string, unknown>, newToken: string) => {
    const u = userData as unknown as User;
    writeSession(u, newToken);
    setUser(u);
    setToken(newToken);
  }, []);

  return (
    <AuthContext value={{ user, token, isAuthenticated, login, logout, setUserAndToken }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
