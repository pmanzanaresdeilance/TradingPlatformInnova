import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  ChevronDown,
  Clock,
  Play,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface MarketAnalysis {
  id: string;
  title: string;
  content: string;
  symbol: string;
  timeframe: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  image_url?: string;
  video_url?: string;
  author_id: string;
  author_username: string;
  author_avatar_url?: string;
  created_at: string;
  key_levels: {
    support: number[];
    resistance: number[];
  };
}

export default function Premarket() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<MarketAnalysis | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<'bullish' | 'bearish' | 'neutral' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'instructor';

  useEffect(() => {
    const loadAnalyses = async () => {
      try {
        setLoading(true);
        setLoadingError(null);

        const { data, error } = await supabase
          .from('market_analysis_details')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading analyses:', error);
          throw new Error('Failed to load market analyses');
        }

        setAnalyses(data || []);
      } catch (err) {
        console.error('Error loading analyses:', err);
        setLoadingError('Failed to load market analyses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyses();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      const { error } = await supabase
        .from('market_analysis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnalyses(prev => prev.filter(a => a.id !== id));
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Error deleting analysis:', err);
      alert('Failed to delete analysis');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchQuery === '' || 
      analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSymbol = !selectedSymbol || analysis.symbol === selectedSymbol;
    const matchesTimeframe = !selectedTimeframe || analysis.timeframe === selectedTimeframe;
    const matchesTrend = !selectedTrend || analysis.trend === selectedTrend;
    
    return matchesSearch && matchesSymbol && matchesTimeframe && matchesTrend;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trading-accent"></div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-trading-danger" />
        <p className="text-trading-danger text-lg">{loadingError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Market Analysis</h1>
          <p className="text-gray-400 mt-2">Expert insights and technical analysis</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingAnalysis(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-trading-accent to-cyan-400 text-gray-900 rounded-xl font-medium hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Analysis
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedSymbol || ''}
              onChange={(e) => setSelectedSymbol(e.target.value || null)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
            >
              <option value="">All Symbols</option>
              {Array.from(new Set(analyses.map(a => a.symbol))).map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTimeframe || ''}
              onChange={(e) => setSelectedTimeframe(e.target.value || null)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
            >
              <option value="">All Timeframes</option>
              <option value="M5">M5</option>
              <option value="M15">M15</option>
              <option value="H1">H1</option>
              <option value="H4">H4</option>
              <option value="D1">D1</option>
              <option value="W1">W1</option>
            </select>
          </div>

          <div>
            <select
              value={selectedTrend || ''}
              onChange={(e) => setSelectedTrend(e.target.value as any || null)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
            >
              <option value="">All Trends</option>
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAnalyses.map((analysis) => (
          <div key={analysis.id} className="bg-gray-800 rounded-xl overflow-hidden">
            {/* Author Info */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {analysis.author_avatar_url ? (
                    <img
                      src={analysis.author_avatar_url}
                      alt={analysis.author_username || 'Author'}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${
                          encodeURIComponent(analysis.author_username || 'A')
                        }&background=7C3AED&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-trading-accent/20 to-trading-accent/5 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {(analysis.author_username || 'A')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{analysis.author_username || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {isAdmin && user?.id === analysis.author_id && analysis.author_id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingAnalysis(analysis);
                        setShowAddModal(true);
                      }}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(analysis.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-trading-danger" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="relative">
              {analysis.image_url && (
                <img
                  src={analysis.image_url}
                  alt="Market Analysis"
                  className="w-full h-64 object-cover"
                />
              )}
              {analysis.video_url && (
                <div className="relative">
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  <img
                    src={`https://img.youtube.com/vi/${analysis.video_url.split('v=')[1]}/maxresdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.trend === 'bullish' ? 'bg-trading-success/20 text-trading-success' :
                  analysis.trend === 'bearish' ? 'bg-trading-danger/20 text-trading-danger' :
                  'bg-gray-600/20 text-gray-400'
                }`}>
                  {analysis.trend.charAt(0).toUpperCase() + analysis.trend.slice(1)}
                </span>
                <span className="px-3 py-1 bg-trading-accent/20 text-trading-accent rounded-full text-sm font-medium">
                  {analysis.symbol}
                </span>
                <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm font-medium">
                  {analysis.timeframe}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">{analysis.title}</h3>
              <p className="text-gray-300 mb-6">{analysis.content}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Support Levels</h4>
                  {analysis.key_levels.support.map((level, index) => (
                    <div key={index} className="text-trading-success font-medium">
                      {level.toFixed(4)}
                    </div>
                  ))}
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Resistance Levels</h4>
                  {analysis.key_levels.resistance.map((level, index) => (
                    <div key={index} className="text-trading-danger font-medium">
                      {level.toFixed(4)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(null)} />
          
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-trading-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-trading-danger" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Delete Analysis</h2>
                <p className="text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this market analysis? This action is permanent and cannot be reversed.
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteModal && handleDelete(showDeleteModal)}
                disabled={deleteLoading}
                className="px-6 py-2 bg-trading-danger text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Analysis'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}