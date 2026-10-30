import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { isSupabaseConfigured, supabase, supabaseAuth } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isSupabaseActive: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { fullName: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (role: 'USER' | 'ADMIN') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const isSupabaseActive = isSupabaseConfigured();

  const refreshUser = async () => {
    // If Supabase is active, check Supabase session first
    if (isSupabaseActive && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await supabaseAuth.getProfile(session.user.id);
          const mappedUser: User = {
            id: profile?.id || session.user.id,
            fullName: profile?.full_name || session.user.user_metadata?.full_name || 'EV Driver',
            email: session.user.email || '',
            role: (profile?.role === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
            phone: profile?.phone || '',
            accountStatus: profile?.account_status || 'ACTIVE',
            createdAt: profile?.created_at || new Date().toISOString(),
          };
          setUser(mappedUser);
          setToken(session.access_token);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[Supabase Auth] Session fetch error:', err);
      }
    }

    // Standard API fallback
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Session expired or invalid, logging out.');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen to Supabase Auth State changes if configured
    if (isSupabaseActive && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await supabaseAuth.getProfile(session.user.id);
          setUser({
            id: profile?.id || session.user.id,
            fullName: profile?.full_name || session.user.user_metadata?.full_name || 'EV Driver',
            email: session.user.email || '',
            role: (profile?.role === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
            phone: profile?.phone || '',
            accountStatus: profile?.account_status || 'ACTIVE',
            createdAt: profile?.created_at || new Date().toISOString(),
          });
          setToken(session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isSupabaseActive]);

  const login = async (email: string, pass: string) => {
    if (isSupabaseActive) {
      try {
        const data = await supabaseAuth.login(email, pass);
        if (data.user) {
          const profile = await supabaseAuth.getProfile(data.user.id);
          setUser({
            id: profile?.id || data.user.id,
            fullName: profile?.full_name || data.user.user_metadata?.full_name || 'EV Driver',
            email: data.user.email || '',
            role: (profile?.role === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
            phone: profile?.phone || '',
            accountStatus: profile?.account_status || 'ACTIVE',
            createdAt: profile?.created_at || new Date().toISOString(),
          });
          if (data.session) {
            setToken(data.session.access_token);
            localStorage.setItem('token', data.session.access_token);
          }
          return;
        }
      } catch (err) {
        console.warn('[Supabase Auth Failed, trying backend API]:', err);
      }
    }

    const data = await api.login(email, pass);
    setUser(data.user);
    setToken(data.token);
  };

  const register = async (params: { fullName: string; email: string; password: string; phone?: string }) => {
    if (isSupabaseActive) {
      try {
        const data = await supabaseAuth.register(params);
        if (data.user) {
          setUser({
            id: data.user.id,
            fullName: params.fullName,
            email: params.email,
            role: 'USER',
            phone: params.phone,
            accountStatus: 'ACTIVE',
            createdAt: new Date().toISOString(),
          });
          if (data.session) {
            setToken(data.session.access_token);
            localStorage.setItem('token', data.session.access_token);
          }
          return;
        }
      } catch (err) {
        console.warn('[Supabase Registration Failed, trying backend API]:', err);
      }
    }

    const data = await api.register(params);
    setUser(data.user);
    setToken(data.token);
  };

  const logout = async () => {
    if (isSupabaseActive) {
      await supabaseAuth.logout().catch(console.warn);
    }
    await api.logout().catch(console.warn);
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const demoLogin = async (role: 'USER' | 'ADMIN') => {
    if (role === 'ADMIN') {
      await api.login('admin@iilm.edu', 'Admin@12345').then((data) => {
        setUser(data.user);
        setToken(data.token);
      });
    } else {
      await api.login('rahul.sharma@example.com', 'User@12345').then((data) => {
        setUser(data.user);
        setToken(data.token);
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isSupabaseActive,
        login,
        register,
        logout,
        demoLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
