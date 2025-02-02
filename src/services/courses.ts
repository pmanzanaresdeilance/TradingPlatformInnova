import { supabase } from '@/lib/supabase';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: string;
  instructor_id: string;
  required_membership: 'free' | 'premium' | 'elite';
  created_at: string;
  modules: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  content_url: string;
  required_membership: 'free' | 'premium' | 'elite';
  order: number;
  completed: boolean;
}

export async function fetchCourses() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules:course_modules(
        id,
        title,
        order,
        lessons:course_lessons(
          id,
          title,
          duration,
          content_url,
          required_membership,
          order,
          completed:user_progress(completed_at)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return courses;
}

export async function markLessonComplete(lessonId: string) {
  const { error } = await supabase
    .from('user_progress')
    .upsert({ lesson_id: lessonId });

  if (error) throw error;
}

// Admin functions
export async function createCourse(courseData: Partial<Course>) {
  const { data, error } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(courseId: string, courseData: Partial<Course>) {
  const { data, error } = await supabase
    .from('courses')
    .update(courseData)
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourse(courseId: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
}