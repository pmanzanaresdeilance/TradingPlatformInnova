import { useState, useEffect } from 'react';
import { fetchFAQs } from '@/services/support';
import type { FAQ } from '@/types';

export function useFAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        setLoading(true);
        const data = await fetchFAQs();
        setFaqs(data);
      } catch (err) {
        console.error('Error loading FAQs:', err);
        setError('Failed to load FAQs');
      } finally {
        setLoading(false);
      }
    };

    loadFAQs();
  }, []);

  return {
    faqs,
    loading,
    error
  };
}