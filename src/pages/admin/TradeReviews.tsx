import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface TradeReview {
  id: string;
  userId: string;
  imageUrl: string;
  description: string;
  pair: string;
  timeframe: string;
  submittedAt: Date;
}

const pendingReviews: TradeReview[] = [
  {
    id: '1',
    userId: '123',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&h=600',
    description: 'Looking for confirmation of trend reversal on EURUSD',
    pair: 'EURUSD',
    timeframe: 'H4',
    submittedAt: new Date()
  }
];

export default function TradeReviews() {
  const { user } = useAuth();
  const [selectedReview, setSelectedReview] = useState<TradeReview | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleSubmitFeedback = (outcome: 'win' | 'loss') => {
    // Handle feedback submission
    setSelectedReview(null);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Trade Reviews</h1>
        <p className="text-gray-400 mt-2">Review and provide feedback on student trades</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Pending Reviews</h2>
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className={`p-4 rounded-lg transition-colors ${
                    selectedReview?.id === review.id
                      ? 'bg-trading-accent/10 border border-trading-accent'
                      : 'bg-gray-700/50 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedReview(review)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-trading-accent">{review.pair}</span>
                      <span className="text-sm text-gray-400">{review.timeframe}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {review.submittedAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <img
                    src={review.imageUrl}
                    alt="Trade setup"
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <p className="text-sm text-gray-300">{review.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedReview ? (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Provide Feedback</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  rows={6}
                  placeholder="Provide detailed feedback..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmitFeedback('win')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-trading-success text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" /> Win
                </button>
                <button
                  onClick={() => handleSubmitFeedback('loss')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-trading-danger text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                >
                  <XCircle className="w-5 h-5" /> Loss
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300">Select a Trade</h3>
            <p className="text-sm text-gray-400 mt-2">
              Click on a trade from the list to provide feedback
            </p>
          </div>
        )}
      </div>
    </div>
  );
}