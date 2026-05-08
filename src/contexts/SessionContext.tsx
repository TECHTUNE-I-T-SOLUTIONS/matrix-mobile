// src/contexts/SessionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  kyc_status?: 'pending' | 'submitted' | 'verified' | 'rejected' | 'not_started';
  kyc_required?: boolean;
}

export interface Session {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresResumeAuth: boolean;
}

interface SessionContextType {
  session: Session;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; kycRequired?: boolean }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  completeResumeAuth: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    requiresResumeAuth: false,
  });

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Check for stored session
      const storedSession = await AsyncStorage.getItem('session');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        console.log('[SessionInit] Loaded stored session:', parsedSession);
        
        // Always require resume auth when loading stored session for security
        // The user must authenticate again when the app is reloaded
        const requiresResume = !!(parsedSession.isAuthenticated && parsedSession.accessToken);
        
        setSession({
          ...parsedSession,
          isLoading: false,
          requiresResumeAuth: requiresResume,
        });
        console.log('[SessionInit] Set requiresResumeAuth to:', requiresResume);
      } else {
        console.log('[SessionInit] No stored session found');
        setSession(prev => ({ ...prev, isLoading: false, requiresResumeAuth: false }));
      }

      // Note: We're not using Supabase auth for session management, so we skip the auth state listener
      // to prevent interference with our custom backend authentication
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSignIn = async (authSession: any) => {
    try {
      const user: User = {
        id: authSession.user.id,
        email: authSession.user.email,
        full_name: authSession.user.user_metadata?.full_name,
        phone: authSession.user.user_metadata?.phone,
        avatar_url: authSession.user.user_metadata?.avatar_url,
        created_at: authSession.user.created_at,
        updated_at: authSession.user.updated_at,
        kyc_status: authSession.user.user_metadata?.kyc_status || 'not_started',
        kyc_required: authSession.user.user_metadata?.kyc_required || false,
      };

      const newSession: Session = {
        user,
        accessToken: authSession.access_token,
        refreshToken: authSession.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        requiresResumeAuth: false,
      };

      setSession(newSession);
      await AsyncStorage.setItem('session', JSON.stringify(newSession));
    } catch (error) {
      console.error('Failed to handle sign in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('[SignOut] Clearing session state');
      console.log('[SignOut] Current session before clearing:', session);
      const loggedOutSession = {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        requiresResumeAuth: false,
      };
      setSession(loggedOutSession);
      console.log('[SignOut] Session state updated to:', loggedOutSession);
      await AsyncStorage.setItem('session', JSON.stringify(loggedOutSession));
      console.log('[SignOut] Logged out session saved to AsyncStorage');
    } catch (error) {
      console.error('[SignOut] Failed to handle sign out:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Use backend login endpoint instead of Supabase
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';
      const loginUrl = `${apiUrl}/auth/login`;
      
      console.log('[Login] Attempting login to:', loginUrl);
      console.log('[Login] Email:', email);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      console.log('[Login] Response status:', response.status);
      console.log('[Login] Response data:', data);

      if (!response.ok) {
        console.error('[Login] Backend error:', data);
        return { 
          success: false, 
          error: data.error || data.message || 'Login failed' 
        };
      }

      console.log('[Login] Success:', data);

      // Use real user data from backend response
      const backendUser = data.user;
      
      if (backendUser && backendUser.id && backendUser.email) {
        console.log('[Login] Creating session for user:', backendUser.email);

        // Create a proper User object from backend data
        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          full_name: backendUser.name || `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim(),
          phone: backendUser.mobile,
          avatar_url: backendUser.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          kyc_status: backendUser.kyc_verified ? 'verified' : 'not_started',
          kyc_required: !backendUser.kyc_verified,
        };

        console.log('[Login] User object created:', user);

        // Create a proper session with real data (not mock)
        const newSession: Session = {
          user,
          accessToken: data.token || `session_${backendUser.id}`,
          refreshToken: data.refreshToken || `session_${backendUser.id}`,
          isAuthenticated: true,
          isLoading: false,
          requiresResumeAuth: false,
        };

        console.log('[Login] Session created:', newSession);
        
        // Save session to state and storage
        setSession(newSession);
        await AsyncStorage.setItem('session', JSON.stringify(newSession));
          // If backend says KYC is verified, clear any pending signup marker
          try {
            if (!newSession.user?.kyc_required) {
              await AsyncStorage.removeItem('kycPendingCustomer')
            }
          } catch (e) {
            console.warn('Failed to clear kycPendingCustomer after login', e)
          }
        
        return { success: true, kycRequired: !!newSession.user?.kyc_required };
      } else {
        console.error('[Login] Missing user data:', backendUser);
        return { 
          success: false, 
          error: 'Invalid user data in response' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network request failed';
      console.error('[Login] Network error:', errorMessage);
      console.error('[Login] Error details:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  };

  const signOut = async () => {
    try {
      console.log('[SignOut] Starting sign out process');
      // Note: We're not using Supabase auth for session management, so we skip supabase.auth.signOut()
      await handleSignOut();
      console.log('[SignOut] Sign out completed');
    } catch (error) {
      console.error('[SignOut] Sign out error:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        await handleSignOut();
      } else if (data.session) {
        await handleSignIn(data.session);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const completeResumeAuth = async () => {
    try {
      // Re-fetch fresh profile from backend to ensure flags (kyc_verified, photo_url) are up-to-date
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.117:3000/api';
      let updatedUser = session.user

      if (session.accessToken) {
        try {
          const res = await fetch(`${apiUrl}/user/profile`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
          if (res.ok) {
            const payload = await res.json()
            if (payload?.user) {
              const u = payload.user
              updatedUser = {
                ...session.user!,
                email: u.email || session.user?.email,
                full_name: u.full_name || session.user?.full_name,
                phone: u.mobile || u.phone || session.user?.phone,
                avatar_url: u.photo_url || u.avatar_url || session.user?.avatar_url,
                kyc_status: u.kyc_verified ? 'verified' : session.user?.kyc_status,
                kyc_required: !u.kyc_verified,
              }
            }
          }
        } catch (err) {
          console.warn('Failed to fetch profile during resume auth', err)
        }
      }

      const updatedSession = { ...session, user: updatedUser || session.user, requiresResumeAuth: false };
      setSession(updatedSession);
      await AsyncStorage.setItem('session', JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Failed to complete resume auth:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!session.user) {
        return { success: false, error: 'No user session' };
      }

      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local session
      const updatedUser = { ...session.user, ...updates };
      const updatedSession = { ...session, user: updatedUser };
      setSession(updatedSession);
      await AsyncStorage.setItem('session', JSON.stringify(updatedSession));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        signIn,
        signUp,
        signOut,
        refreshSession,
        updateProfile,
        completeResumeAuth,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};