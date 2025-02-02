import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Image as ImageIcon, Send, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TradeReview {
  id: string;
  userId: string;
  imageUrl: string;
  description: string;
  status: 'pending' | 'reviewed';
  feedback?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  pair: string;
  timeframe: string;
  outcome: 'win' | 'loss' | 'pending';
}

const mockReviews: TradeReview[] = [
  {
    id: '1',
    userId: '123',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&h=600',
    description: 'Price action setup on EURUSD, looking for confirmation of trend reversal',
    status: 'reviewed',
    feedback: 'Good analysis of market structure. Consider waiting for a stronger confirmation signal before entry.',
    submittedAt: new Date('2024-02-28'),
    reviewedAt: new Date('2024-02-29'),
    pair: 'EURUSD',
    timeframe: 'H4',
    outcome: 'win'
  }
];

export default function TradeReview() {
  const { user } = useAuth();
  const [reviews] = useState<TradeReview[]>(mockReviews);
  const [description, setDescription] = useState('');
  const [pair, setPair] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Handle file upload logic here
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission logic here
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Trade Review</h1>
        <p className="text-gray-400 mt-2">Get expert feedback on your trades</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Submit New Trade</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center ${
                  dragActive
                    ? 'border-trading-accent bg-trading-accent/10'
                    : 'border-gray-700 hover:border-trading-accent/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-300 mb-2">Drag and drop your TradingView screenshot here</p>
                  <p className="text-sm text-gray-400">or click to select file</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Currency Pair
                  </label>
                  <input
                    type="text"
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                    placeholder="e.g., EURUSD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Timeframe
                  </label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  >
                    <option value="">Select timeframe</option>
                    <option value="M5">M5</option>
                    <option value="M15">M15</option>
                    <option value="H1">H1</option>
                    <option value="H4">H4</option>
                    <option value="D1">D1</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Trade Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                  rows={4}
                  placeholder="Describe your trade setup and analysis..."
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-trading-accent text-gray-900 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
              >
                Submit for Review
              </button>
            </form>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-trading-accent">{review.pair}</span>
                    <span className="text-sm text-gray-400">{review.timeframe}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    review.outcome === 'win' ? 'bg-trading-success/20 text-trading-success' :
                    review.outcome === 'loss' ? 'bg-trading-danger/20 text-trading-danger' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>
                    {review.outcome.charAt(0).toUpperCase() + review.outcome.slice(1)}
                  </span>
                </div>
                <div className="relative mb-3">
                  <img
                    src={review.imageUrl}
                    alt="Trade setup"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                    review.status === 'reviewed'
                      ? 'bg-trading-success/20 text-trading-success'
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </span>
                </div>
                {review.feedback && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-300">{review.feedback}</p>
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-400">
                  Submitted {review.submittedAt.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}