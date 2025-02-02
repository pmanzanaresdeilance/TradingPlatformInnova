import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  fetchUpcomingClasses,
  fetchUserRegistrations,
  registerForClass as register,
  LiveClass
} from '@/services/liveClasses';

interface ClassStats {
  weeklyClasses: number;
  totalStudents: number;
  totalRecordings: number;
  totalHours: number;
}

export function useLiveClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState<ClassStats>({
    weeklyClasses: 0,
    totalStudents: 0,
    totalRecordings: 0,
    totalHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    if (user) {
      setIsInstructor(
        user.user_metadata?.role === 'instructor' || 
        user.user_metadata?.role === 'admin'
      );
    }

    const loadClasses = async () => {
      try {
        setLoading(true);
        const [classesData, registrationsData] = await Promise.all([
          fetchUpcomingClasses(),
          user ? fetchUserRegistrations(user.id) : Promise.resolve([])
        ]);

        setClasses(classesData);
        setRegistrations(registrationsData);

        // Calculate stats
        setStats({
          weeklyClasses: classesData.filter(c => {
            const classDate = new Date(c.date);
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return classDate <= weekFromNow;
          }).length,
          totalStudents: classesData.reduce((acc, c) => acc + c.attendees, 0),
          totalRecordings: 245, // This would come from a separate API call in production
          totalHours: Math.ceil(classesData.reduce((acc, c) => acc + c.duration, 0) / 60)
        });
      } catch (err) {
        setError('Failed to load live classes');
      } finally {
        setLoading(false);
      }
    };

    loadClasses();

    // Set up real-time subscription for class updates
    const subscription = supabase
      .channel('live_classes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_classes'
        },
        () => {
          loadClasses();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const registerForClass = async (classId: string) => {
    if (!user) throw new Error('Must be logged in to register');
    
    try {
      await register(classId, user.id);
      const updatedRegistrations = await fetchUserRegistrations(user.id);
      setRegistrations(updatedRegistrations);
    } catch (err) {
      throw new Error('Failed to register for class');
    }
  };

  return {
    classes,
    registrations,
    stats,
    loading,
    error,
    registerForClass,
    isInstructor
  };
}