import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Image as ImageIcon, Upload, Loader2, Hash, Link2, Clock, AlertTriangle } from 'lucide-react';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewPostModal({ isOpen, onClose, onSuccess }: NewPostModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tradingPair, setTradingPair] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  React.useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('post_categories')
        .select('name')
        .order('name');
      
      if (!error && data) {
        setCategories(data.map(c => c.name));
      }
    };

    loadCategories();
  }, []);

  if (!isOpen) return null;

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
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleImageChange(files[0]);
    }
  };

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
    if (!title.trim() || !content.trim() || !category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;

      if (image) {
        const fileName = `${user.id}/${Date.now()}-${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create the post
      const { data: newPost, error: postError } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title,
          content,
          category,
          trading_pair: tradingPair || null,
          timeframe: timeframe || null,
          image_url: imageUrl
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add tags if provided
      if (tags.trim()) {
        const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(
            tagList.map(tag => ({
              post_id: newPost.id,
              tag
            }))
          );

        if (tagsError) throw tagsError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      const error = err as Error;
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gray-800 rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold">Share with the Community</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-trading-danger shrink-0 mt-0.5" />
                <p className="text-sm text-trading-danger">{error}</p>
              </div>
            )}

            <form id="newPostForm" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      placeholder="What's your post about?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      rows={8}
                      placeholder="Share your analysis, insights, or questions..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Tags
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                        placeholder="trading, analysis, forex (comma separated)"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Trading Pair
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={tradingPair}
                        onChange={(e) => setTradingPair(e.target.value.toUpperCase())}
                        className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                        placeholder="e.g., EURUSD"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Timeframe
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-trading-accent focus:outline-none"
                      >
                        <option value="">Select timeframe</option>
                        <option value="M5">M5</option>
                        <option value="M15">M15</option>
                        <option value="H1">H1</option>
                        <option value="H4">H4</option>
                        <option value="D1">D1</option>
                        <option value="W1">W1</option>
                      </select>
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
                    
                    <div
                      className={`relative ${
                        dragActive
                          ? 'border-trading-accent bg-trading-accent/10'
                          : 'border-gray-700 hover:border-trading-accent/50'
                      } border-2 border-dashed rounded-lg transition-colors`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Post preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full hover:bg-gray-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-48 flex flex-col items-center justify-center"
                        >
                          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-gray-400">
                            {dragActive ? 'Drop image here' : 'Click or drag image here'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 bg-gray-800">
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
                form="newPostForm"
                disabled={loading}
                className="px-6 py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Post...
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}