import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  contentUrl: string;
  requiredMembership: 'free' | 'premium' | 'elite';
}

export default function CourseEditor() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [requiredMembership, setRequiredMembership] = useState<'free' | 'premium' | 'elite'>('free');
  const [modules, setModules] = useState<Module[]>([]);

  const addModule = () => {
    setModules([
      ...modules,
      {
        id: Date.now().toString(),
        title: '',
        lessons: []
      }
    ]);
  };

  const addLesson = (moduleId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: [
            ...module.lessons,
            {
              id: Date.now().toString(),
              title: '',
              duration: '',
              contentUrl: '',
              requiredMembership: 'free'
            }
          ]
        };
      }
      return module;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle course creation/update
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Course Editor</h1>
        <p className="text-gray-400 mt-2">Create or edit course content</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Course Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="e.g., Price Action Mastery"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                rows={4}
                placeholder="Course description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Thumbnail URL
              </label>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Required Membership
              </label>
              <select
                value={requiredMembership}
                onChange={(e) => setRequiredMembership(e.target.value as 'free' | 'premium' | 'elite')}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="elite">Elite</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Course Modules</h2>
            <button
              type="button"
              onClick={addModule}
              className="flex items-center gap-2 px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => {
                      const newModules = [...modules];
                      newModules[moduleIndex].title = e.target.value;
                      setModules(newModules);
                    }}
                    className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                    placeholder="Module title"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newModules = modules.filter(m => m.id !== module.id);
                      setModules(newModules);
                    }}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 pl-8">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => {
                          const newModules = [...modules];
                          newModules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                          setModules(newModules);
                        }}
                        className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                        placeholder="Lesson title"
                      />
                      <input
                        type="text"
                        value={lesson.duration}
                        onChange={(e) => {
                          const newModules = [...modules];
                          newModules[moduleIndex].lessons[lessonIndex].duration = e.target.value;
                          setModules(newModules);
                        }}
                        className="w-24 bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                        placeholder="Duration"
                      />
                      <select
                        value={lesson.requiredMembership}
                        onChange={(e) => {
                          const newModules = [...modules];
                          newModules[moduleIndex].lessons[lessonIndex].requiredMembership = e.target.value as 'free' | 'premium' | 'elite';
                          setModules(newModules);
                        }}
                        className="w-32 bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="elite">Elite</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const newModules = [...modules];
                          newModules[moduleIndex].lessons = module.lessons.filter(l => l.id !== lesson.id);
                          setModules(newModules);
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addLesson(module.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-trading-accent text-gray-900 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            <Save className="w-5 h-5" /> Save Course
          </button>
        </div>
      </form>
    </div>
  );
}