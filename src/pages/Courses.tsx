import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Play, Clock, Star, Lock, ChevronRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  lessons: number;
  rating: number;
  instructor: string;
  progress: number;
  requiredMembership: 'free' | 'premium' | 'elite';
  modules: {
    title: string;
    lessons: {
      title: string;
      duration: string;
      completed: boolean;
      requiredMembership: 'free' | 'premium' | 'elite';
    }[];
  }[];
}

const courses: Course[] = [
  {
    id: '1',
    title: 'Price Action Mastery',
    description: 'Master the art of reading price action and market structure',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&h=600',
    duration: '12h 30m',
    lessons: 24,
    rating: 4.8,
    instructor: 'Sarah Johnson',
    progress: 45,
    requiredMembership: 'premium',
    modules: [
      {
        title: 'Introduction to Price Action',
        lessons: [
          {
            title: 'What is Price Action?',
            duration: '15:00',
            completed: true,
            requiredMembership: 'free'
          },
          {
            title: 'Market Structure Basics',
            duration: '25:00',
            completed: true,
            requiredMembership: 'free'
          }
        ]
      },
      {
        title: 'Advanced Patterns',
        lessons: [
          {
            title: 'Pin Bars and Price Rejection',
            duration: '30:00',
            completed: false,
            requiredMembership: 'premium'
          },
          {
            title: 'Inside Bars Strategy',
            duration: '45:00',
            completed: false,
            requiredMembership: 'premium'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Advanced Risk Management',
    description: 'Learn professional risk management techniques and position sizing',
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&h=600',
    duration: '8h 45m',
    lessons: 16,
    rating: 4.9,
    instructor: 'Michael Chen',
    progress: 0,
    requiredMembership: 'elite',
    modules: [
      {
        title: 'Risk Management Fundamentals',
        lessons: [
          {
            title: 'Understanding Risk-Reward',
            duration: '20:00',
            completed: false,
            requiredMembership: 'premium'
          },
          {
            title: 'Position Sizing Strategies',
            duration: '35:00',
            completed: false,
            requiredMembership: 'elite'
          }
        ]
      }
    ]
  }
];

export default function Courses() {
  const { user } = useAuth();
  const userMembership = user?.subscription_tier || 'free';

  const canAccessContent = (requiredMembership: string) => {
    const membershipLevels = { free: 0, premium: 1, elite: 2 };
    return membershipLevels[userMembership] >= membershipLevels[requiredMembership];
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Trading Courses</h1>
        <p className="text-gray-400 mt-2">Comprehensive trading education for all levels</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="relative">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              {!canAccessContent(course.requiredMembership) && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-trading-accent mx-auto mb-2" />
                    <p className="text-white font-medium">
                      {course.requiredMembership.charAt(0).toUpperCase() + course.requiredMembership.slice(1)} Required
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-400">{course.rating}</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold">{course.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{course.description}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-trading-accent">{course.progress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-trading-accent rounded-full"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {course.modules.map((module, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">{module.title}</h4>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lessonIndex}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          canAccessContent(lesson.requiredMembership)
                            ? 'bg-gray-700/50 hover:bg-gray-700 cursor-pointer'
                            : 'bg-gray-700/20 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {lesson.completed ? (
                            <div className="w-5 h-5 rounded-full bg-trading-success flex items-center justify-center">
                              <Play className="w-3 h-3 text-gray-900" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                          )}
                          <span className={lesson.completed ? 'text-gray-300' : 'text-gray-400'}>
                            {lesson.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{lesson.duration}</span>
                          {!canAccessContent(lesson.requiredMembership) && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <button
                className={`w-full mt-6 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                  canAccessContent(course.requiredMembership)
                    ? 'bg-trading-accent text-gray-900 hover:bg-opacity-90'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canAccessContent(course.requiredMembership) ? (
                  <>Continue Learning <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Upgrade Required <Lock className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}