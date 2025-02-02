import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, BookOpen, MessageSquare, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">Manage courses and review student trades</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Total Students</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">1,245</div>
            <p className="text-gray-400">Active users</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Courses</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">12</div>
            <p className="text-gray-400">Published</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Pending Reviews</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">24</div>
            <p className="text-gray-400">Trade reviews</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-trading-accent" />
            <h2 className="text-lg font-semibold">Success Rate</h2>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">72%</div>
            <p className="text-gray-400">Student trades</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Trade Reviews</h2>
            <button className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-trading-accent">EURUSD</span>
                  <span className="text-sm text-gray-400">H4</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">Submitted 2 hours ago</p>
              </div>
              <button className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
                Review
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-trading-accent">GBPJPY</span>
                  <span className="text-sm text-gray-400">D1</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">Submitted 3 hours ago</p>
              </div>
              <button className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
                Review
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Latest Courses</h2>
            <button className="px-4 py-2 bg-trading-accent text-gray-900 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
              Add New
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-medium">Price Action Mastery</h3>
                <p className="text-sm text-gray-400 mt-1">24 lessons • Premium</p>
              </div>
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
                Edit
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h3 className="font-medium">Risk Management Pro</h3>
                <p className="text-sm text-gray-400 mt-1">16 lessons • Elite</p>
              </div>
              <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}