import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export const authApi = {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return {
        user: data.user as User,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error
      };
    }
  },

  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            subscription_tier: 'free'
          }
        }
      });

      if (error) throw error;

      return {
        user: data.user as User,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error
      };
    }
  },

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      return {
        user: user as User,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: error as Error
      };
    }
  }
};