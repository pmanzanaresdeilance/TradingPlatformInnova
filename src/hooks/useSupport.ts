import { useAuth } from '@/contexts/AuthContext';

export function useSupport() {
  const { user } = useAuth();
  const isSupport = user?.user_metadata?.role === 'support' || user?.user_metadata?.role === 'admin';

  return {
    isSupport
  };
}