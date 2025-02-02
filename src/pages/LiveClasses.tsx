import React from 'react';
import { Calendar, Users, Video, Clock, BookOpen, ExternalLink, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveClasses } from '@/hooks/useLiveClasses';

export default function LiveClasses() {
  const { user } = useAuth();
  const { classes, registrations, stats, loading, error, registerForClass, isInstructor } = useLiveClasses();
  const [showNewClassModal, setShowNewClassModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const canAccessClass = (requiredMembership: string) => {
    const membershipLevels = { free: 0, premium: 1, elite: 2 };
    return membershipLevels[user?.subscription_tier || 'free'] >= membershipLevels[requiredMembership];
  };

  const handleRegister = async (classId: string) => {
    try {
      await registerForClass(classId);
    } catch (err) {
      console.error('Failed to register for class:', err);
    }
  };

  const isRegistered = (classId: string) => {
    return registrations.some(reg => reg.class_id === classId);
  };

  const handleRegister = async (classId: string) => {
    try {
      await registerForClass(classId);
    } catch (err) {
      console.error('Failed to register for class:', err);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Live Trading Classes</h1>
        <p className="text-gray-400 mt-2">Interactive Zoom sessions with professional traders</p>
        {isInstructor && (
          <button
            onClick={() => setShowNewClassModal(true)}
            className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Create Class
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">This Week</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{stats.weeklyClasses}</div>
            <p className="text-gray-400">Live sessions</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Students</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{stats.totalStudents}</div>
            <p className="text-gray-400">Active learners</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Recordings</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{stats.totalRecordings}</div>
            <p className="text-gray-400">Available now</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Hours</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{stats.totalHours}+</div>
            <p className="text-gray-400">Of live training</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Upcoming Classes</h2>
          <button className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classes.map((class_) => (
            <div key={class_.id} className="flex gap-4 bg-gray-700/50 rounded-xl overflow-hidden">
              <img
                src={class_.thumbnail_url}
                alt={class_.title}
                className="w-48 h-full object-cover"
              />
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      class_.level === 'Advanced' ? 'bg-trading-danger/20 text-trading-danger' :
                      class_.level === 'Intermediate' ? 'bg-trading-warning/20 text-trading-warning' :
                      'bg-trading-success/20 text-trading-success'
                    }`}>
                      {class_.level}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      class_.required_membership === 'elite' ? 'bg-purple-500/20 text-purple-500' :
                      class_.required_membership === 'premium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {class_.required_membership.charAt(0).toUpperCase() + class_.required_membership.slice(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {class_.duration} min
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{class_.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{class_.description}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      {class_.attendees}/{class_.max_attendees} registered
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-full bg-trading-accent rounded-full"
                      style={{ width: `${(class_.attendees / class_.max_attendees) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm">
                    <p className="text-trading-accent">{class_.instructor.username}</p>
                    <p className="text-gray-400">
                      {new Date(class_.date).toLocaleDateString()} at {class_.time}
                    </p>
                  </div>
                  {canAccessClass(class_.required_membership) ? (
                    isRegistered(class_.id) ? (
                      <a
                        href={class_.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                      >
                        Join Zoom <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleRegister(class_.id)}
                        className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                        disabled={class_.attendees >= class_.max_attendees}
                      >
                        {class_.attendees >= class_.max_attendees ? 'Class Full' : 'Register Now'}
                      </button>
                    )
                  ) : (
                    <button className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                      Upgrade Required
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recordings Section */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Class Recordings</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <AlertTriangle className="w-4 h-4 text-trading-warning" />
            Available for 30 days after the class
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {classes
            .filter(c => c.recording_url)
            .map((recording) => (
              <div key={recording.id} className="bg-gray-700/50 rounded-xl overflow-hidden">
                <div className="relative">
                  <img
                    src={recording.thumbnail_url}
                    alt={recording.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                    {recording.duration} min
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      recording.level === 'Advanced' ? 'bg-trading-danger/20 text-trading-danger' :
                      recording.level === 'Intermediate' ? 'bg-trading-warning/20 text-trading-warning' :
                      'bg-trading-success/20 text-trading-success'
                    }`}>
                      {recording.level}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(recording.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{recording.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{recording.description}</p>
                  {canAccessClass(recording.required_membership) ? (
                    <a
                      href={recording.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                    >
                      <Video className="w-4 h-4" /> Watch Recording
                    </a>
                  ) : (
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                      <Lock className="w-4 h-4" /> Upgrade Required
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}