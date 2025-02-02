import { supabase } from '@/lib/supabase';

export interface LiveClass {
  id: string;
  title: string;
  instructor_id: string;
  date: string;
  time: string;
  duration: number;
  zoom_link: string;
  attendees: number;
  max_attendees: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  thumbnail_url: string;
  required_membership: 'free' | 'premium' | 'elite';
}

export async function fetchUpcomingClasses(): Promise<LiveClass[]> {
  const { data, error } = await supabase
    .from('live_classes')
    .select(`
      *,
      instructor:instructor_id (
        username,
        avatar_url
      )
    `)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function registerForClass(classId: string, userId: string) {
  const { error } = await supabase
    .from('class_registrations')
    .insert({ class_id: classId, user_id: userId });

  if (error) throw error;

  // Fetch class and user details for email
  const { data: classData } = await supabase
    .from('live_classes')
    .select(`
      *,
      instructor:instructor_id (
        raw_user_meta_data->>'email' as email,
        raw_user_meta_data->>'username' as username
      )
    `)
    .eq('id', classId)
    .single();

  const { data: userData } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', userId)
    .single();

  if (classData && userData) {
    // Send confirmation email to student
    await supabase.functions.invoke('send-email', {
      body: {
        to: userData.email,
        template: 'class-registration',
        data: {
          className: classData.title,
          date: classData.date,
          time: classData.time,
          instructorName: classData.instructor.username,
          zoomLink: classData.zoom_link
        }
      }
    });

    // Send notification to instructor
    await supabase.functions.invoke('send-email', {
      body: {
        to: classData.instructor.email,
        template: 'new-registration',
        data: {
          className: classData.title,
          studentEmail: userData.email
        }
      }
    });
  }
}

export async function fetchUserRegistrations(userId: string) {
  const { data, error } = await supabase
    .from('class_registrations')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function uploadRecording(classId: string, recordingUrl: string) {
  const { error } = await supabase
    .from('live_classes')
    .update({ recording_url: recordingUrl })
    .eq('id', classId);

  if (error) throw error;

  // Notifications will be handled by the database trigger
}