import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  X, 
  ChevronDown, 
  AlertTriangle,
  Link2,
  Play
} from 'lucide-react';

interface MarketAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  analysis?: {
    id: string;
    title: string;
    content: string;
    symbol: string;
    timeframe: string;
    trend: 'bullish' | 'bearish' | 'neutral';
    image_url?: string;
    video_url?: string;
    key_levels: {
      support: number[];
      resistance: number[];
    };
  };
}

export function MarketAnalysisModal({
  isOpen,
  onClose,
  onSuccess,
  analysis
}: MarketAnalysisModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(analysis?.image_url || null);
  const [formData, setFormData] = useState({
    title: analysis?.title || '',
    content: analysis?.content || '',
    symbol: analysis?.symbol || '',
    timeframe: analysis?.timeframe || 'H4',
    trend: analysis?.trend || 'neutral',
    video_url: analysis?.video_url || '',
    key_levels: analysis?.key_levels || {
      support: [],
      resistance: []
    }
  });

  useEffect(() => {
    if (analysis) {
      setFormData({
        title: analysis.title,
        content: analysis.content,
        symbol: analysis.symbol,
        timeframe: analysis.timeframe,
        trend: analysis.trend,
        video_url: analysis.video_url || '',
        key_levels: analysis.key_levels
      });
      if (analysis.image_url) {
        setImagePreview(analysis.image_url);
      }
    }
  }, [analysis]);

  if (!isOpen) return null;

  const handleImageChange = (file: File) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let imageUrl = analysis?.image_url;

      if (image) {
        const fileName = `${user.id}/${Date.now()}-${image.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('market-analysis')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('market-analysis')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const analysisData = {
        ...formData,
        image_url: imageUrl,
        author_id: user.id
      };

      if (analysis) {
        // Update existing analysis
        const { error: updateError } = await supabase
          .from('market_analysis')
          .update(analysisData)
          .eq('id', analysis.id);

        if (updateError) throw updateError;
      } else {
        // Create new analysis
        const { error: insertError } = await supabase
          .from('market_analysis')
          .insert([analysisData]);

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to save analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {analysis ? 'Edit Analysis' : 'New Market Analysis'}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-trading-danger shrink-0" />
            <p className="text-sm text-trading-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Symbol *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="e.g., EURUSD"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Timeframe *
              </label>
              <select
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                required
              >
                <option value="M5">M5</option>
                <option value="M15">M15</option>
                <option value="H1">H1</option>
                <option value="H4">H4</option>
                <option value="D1">D1</option>
                <option value="W1">W1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Trend *
              </label>
              <select
                value={formData.trend}
                onChange={(e) => setFormData({ ...formData, trend: e.target.value as any })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                required
              >
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              placeholder="Enter analysis title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Analysis *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              rows={4}
              placeholder="Provide your market analysis..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Support Levels
              </label>
              <input
                type="text"
                value={formData.key_levels.support.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  key_levels: {
                    ...formData.key_levels,
                    support: e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
                  }
                })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="Enter levels separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Resistance Levels
              </label>
              <input
                type="text"
                value={formData.key_levels.resistance.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  key_levels: {
                    ...formData.key_levels,
                    resistance: e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
                  }
                })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="Enter levels separated by commas"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Chart Image
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
            />
            
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Analysis preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-gray-900/80 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-64 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-trading-accent/50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-400">Click to upload chart image</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Video URL (Optional)
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="YouTube or Vimeo URL"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                analysis ? 'Update Analysis' : 'Create Analysis'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}