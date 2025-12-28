import { supabase } from '@/lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

/**
 * Authentication Service
 * Handles all user authentication operations using Supabase Auth
 */

interface AuthResponse {
  data: User | null;
  error: AuthError | Error | null;
}

interface AuthVoidResponse {
  data: null;
  error: AuthError | Error | null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: { nom?: string; prenom?: string }
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthVoidResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Don't log "session missing" errors as they are expected when user is not logged in
      if (error.message !== 'Auth session missing!') {
        console.error('Error getting current user:', error);
      }
      return { data: null, error };
    }

    return { data: data.user, error: null };
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Send a password reset email to the user
 */
export async function resetPassword(email: string): Promise<AuthVoidResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update user password (must be authenticated)
 */
export async function updatePassword(
  newPassword: string
): Promise<AuthVoidResponse> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error);
      return { data: null, error };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Unexpected error updating password:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const { data: subscription } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    }
  );

  return () => {
    subscription.subscription.unsubscribe();
  };
}
