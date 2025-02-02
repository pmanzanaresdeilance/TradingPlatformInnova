import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload, Image as ImageIcon, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';
import type { PremarketAnalysis } from '@/services/premarket';

interface PremarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  analysis: PremarketAnalysis | null;
}

export function PremarketModal({ isOpen, onClose, onSuccess, analysis }: PremarketModalProps) {
  const { user } = useAuth();
  const { symbols } = useMasterData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    symbol: analysis?.symbol || '',
    timeframe: analysis?.timeframe || 'H4',
    trend: analysis?.trend || 'neutral',
    key_levels: analysis?.key_levels || {
      support: [],
      resistance: [],
      pivot: 0
    },
    analysis: analysis?.analysis || '',
    sentiment_score: analysis?.sentiment_score || 50,
    volume_analysis: analysis?.volume_analysis || ''
  });

  useEffect(() => {
    if (analysis) {
      setFormData({
        symbol: analysis.symbol,
        timeframe: analysis.timeframe,
        trend: analysis.trend,
        key_levels: analysis.key_levels,
        analysis: analysis.analysis,
        sentiment_score: analysis.sentiment_score,
        volume_analysis: analysis.volume_analysis || ''
      });

      if (analysis.chart_images) {
        setImagesPreviews(analysis.chart_images);
      }
    }
  }, [analysis]);

  if (!isOpen) return null;

  const handleImageChange = (files: FileList) => {
    const newImages: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Files must be images');
        return;
      }

      newImages.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setImagesPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let chartImages: string[] = [];

      // Upload new images
      if (images.length > 0) {
        for (const image of images) {
          const fileName = `${user.id}/${Date.now()}-${image.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('premarket-images')
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('premarket-images')
            .getPublicUrl(fileName);

          chartImages.push(publicUrl);
        }
      }

      // Keep existing images
      if (analysis?.chart_images) {
        chartImages = [...analysis.chart_images, ...chartImages];
      }

      const analysisData = {
        ...formData,
        chart_images: chartImages
      };

      if (analysis) {
        // Update existing analysis
        const { error: updateError } = await supabase
          .from('premarket_analysis')
          .update(analysisData)
          .eq('id', analysis.id);

        if (updateError) throw updateError;
      } else {
        // Create new analysis
        const { error: insertError } = await supabase
          .from('premarket_analysis')
          .insert([analysisData]);

        if (insertError) throw insertError;
      }

      onSuccess();
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
      
      <div className="relative bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700/50">
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
              <select
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                required
              >
                <option value="">Select Symbol</option>
                {symbols.map((symbol) => (
                  <option key={symbol.id} value={symbol.symbol}>
                    {symbol.symbol} - {symbol.description}
                  </option>
                ))}
              </select>
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
                onChange={(e) => setFormData({ ...formData, trend: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                required
              >
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
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
              Chart Images
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleImageChange(e.target.files)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {imagesPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-2 bg-gray-900/80 rounded-lg hover:bg-gray-900 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-trading-accent/50 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-400">Add Chart Image</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Analysis *
            </label>
            <textarea
              value={formData.analysis}
              onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
              rows={4}
              placeholder="Enter your market analysis..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Sentiment Score *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.sentiment_score}
                onChange={(e) => setFormData({ ...formData, sentiment_score: parseInt(e.target.value) })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Volume Analysis
              </label>
              <input
                type="text"
                value={formData.volume_analysis}
                onChange={(e) => setFormData({ ...formData, volume_analysis: e.target.value })}
                className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                placeholder="Optional volume analysis..."
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