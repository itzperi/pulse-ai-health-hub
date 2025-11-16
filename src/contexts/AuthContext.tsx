import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string, mobile: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Fetch profile data
          setTimeout(() => {
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  const userData: User = {
                    id: profile.id,
                    username: profile.email || '',
                    email: profile.email,
                    mobile: profile.mobile,
                    role: profile.role as UserRole,
                    name: profile.name || ''
                  };
                  setUser(userData);
                }
              });
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              const userData: User = {
                id: profile.id,
                username: profile.email || '',
                email: profile.email,
                mobile: profile.mobile,
                role: profile.role as UserRole,
                name: profile.name || ''
              };
              setUser(userData);
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Map username shortcuts to email addresses for demo accounts
      const emailMap: Record<string, string> = {
        'admin': 'admin@pulseai.com',
        'doctor': 'doctor@pulseai.com',
        'pharma': 'pharma@pulseai.com'
      };
      
      const email = emailMap[username] || username;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (data.user && data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const userData: User = {
            id: profile.id,
            username: profile.email || '',
            email: profile.email,
            mobile: profile.mobile,
            role: profile.role as UserRole,
            name: profile.name || ''
          };
          setUser(userData);
          setSession(data.session);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string, mobile: string): Promise<boolean> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            mobile
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            name,
            mobile,
            role: 'patient'
          });

        if (profileError) throw profileError;

        const userData: User = {
          id: data.user.id,
          username: email,
          email,
          mobile,
          role: 'patient',
          name
        };
        setUser(userData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
