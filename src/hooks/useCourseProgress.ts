import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCourses } from '@/services/courses';

export function useCourseProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState({
    completedLessons: 0,
    totalLessons: 0,
    currentCourse: null,
    nextLesson: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadProgress = async () => {
      try {
        setLoading(true);
        const courses = await fetchCourses();
        
        let completed = 0;
        let total = 0;
        let currentCourse = null;
        let nextLesson = null;

        for (const course of courses) {
          for (const module of course.modules) {
            for (const lesson of module.lessons) {
              total++;
              if (lesson.completed) {
                completed++;
              } else if (!nextLesson) {
                nextLesson = lesson;
                currentCourse = course;
              }
            }
          }
        }

        setProgress({
          completedLessons: completed,
          totalLessons: total,
          currentCourse,
          nextLesson
        });
      } catch (err) {
        setError('Failed to load course progress');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  return { progress, loading, error };
}