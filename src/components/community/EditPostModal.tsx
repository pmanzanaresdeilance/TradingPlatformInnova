import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { X, Image as ImageIcon, Upload, Loader2, Hash, Link2, Clock } from 'lucide-react';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  post: {
    id: string;
    title: string;
    content: string;
    category: string;
    trading_pair?: string;
    timeframe?: string;
    image_url?: string;
    tags: string[];
  };
}

export function EditPostModal({ isOpen, onClose, onSuccess, post }: EditPostModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState(post.category);
  const [tradingPair, setTradingPair] = useState(post.trading_pair || '');
  const [timeframe, setTimeframe] = useState(post.timeframe || '');
  const [tags, setTags] = useState(post.tags.join(', '));
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([]);

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
      let imageUrl = post.image_url;

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

      // Update the post
      const { error: postError } = await supabase
        .from('community_posts')
        .update({
          title,
          content,
          category,
          trading_pair: tradingPair || null,
          timeframe: timeframe || null,
          image_url: imageUrl
        })
        .eq('id', post.id);

      if (postError) throw postError;

      // Update tags
      if (tags.trim()) {
        // First delete existing tags
        await supabase
          .from('post_tags')
          .delete()
          .eq('post_id', post.id);

        // Then add new tags
        const tagList = tags.split(',').map(tag => tag.trim().toLowerCase());
        const { error: tagsError } = await supabase
          .from('post_tags')
          .insert(
            tagList.map(tag => ({
              post_id: post.id,
              tag
            }))
          );

        if (tagsError) throw tagsError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      const error = err as Error;
      console.error('Error updating post:', error);
      setError(error.message || 'Failed to update post. Please try again.');
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
            <h2 className="text-2xl font-bold">Edit Post</h2>
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
              <div className="mb-6 p-4 bg-trading-danger/10 border border-trading-danger/20 rounded-lg">
                <p className="text-sm text-trading-danger">{error}</p>
              </div>
            )}

            <form id="editPostForm" onSubmit={handleSubmit} className="space-y-6">
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
                      placeholder="Enter post title"
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
                      placeholder="Write your post content..."
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
                        placeholder="Enter tags separated by commas"
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
                      Image
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
                        className="w-full h-48 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center hover:border-trading-accent/50 transition-colors"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-gray-400">Click to upload image</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </button>
                    )}
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
                form="editPostForm"
                disabled={loading}
                className="px-6 py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}