import { supabase } from './supabase';
import type { User, AuthError } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

/**
 * Sign up a new user
 */
export async function signUp({ email, password }: SignUpData): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      return { user: null, error };
    }

    // Profile creation will be handled by the API route

    return { user: data.user, error: null };
  } catch (err) {
    return {
      user: null,
      error: {
        message: 'An unexpected error occurred',
        name: 'UnknownError',
      } as AuthError,
    };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn({ email, password }: SignInData): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data.user, error };
  } catch (err) {
    return {
      user: null,
      error: {
        message: 'An unexpected error occurred',
        name: 'UnknownError',
      } as AuthError,
    };
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithProvider(provider: 'google' | 'github') {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error(`OAuth sign in error:`, err);
    throw err;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get the current user session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get the current user
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Subscription check error:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('Subscription check error:', err);
    return false;
  }
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth() {
  if (typeof window !== 'undefined') {
    getSession().then(({ session }) => {
      if (!session) {
        window.location.href = '/login';
      }
    });
  }
}