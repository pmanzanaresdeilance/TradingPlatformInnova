/*
  # Fix storage bucket policies

  1. Changes
    - Create storage buckets if they don't exist
    - Add proper RLS policies for storage buckets
    - Enable public access for required buckets
*/

-- Create buckets if they don't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('trade-screenshots', 'trade-screenshots', true),
    ('avatars', 'avatars', true),
    ('community-images', 'community-images', true),
    ('market-analysis', 'market-analysis', true),
    ('premarket-images', 'premarket-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable storage policies for trade screenshots
CREATE POLICY "Trade screenshots are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trade-screenshots');

CREATE POLICY "Users can upload trade screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trade-screenshots' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own trade screenshots"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'trade-screenshots' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'trade-screenshots' AND owner = auth.uid());

CREATE POLICY "Users can delete their own trade screenshots"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'trade-screenshots' AND owner = auth.uid());

-- Enable storage policies for avatars
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enable storage policies for community images
CREATE POLICY "Community images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-images');

CREATE POLICY "Users can upload community images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'community-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own community images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'community-images' 
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'community-images' 
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own community images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'community-images' 
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enable storage policies for market analysis images
CREATE POLICY "Market analysis images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'market-analysis');

CREATE POLICY "Instructors can upload market analysis images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'market-analysis' 
    AND auth.role() = 'authenticated'
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  );

CREATE POLICY "Instructors can update their market analysis images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'market-analysis' 
    AND owner = auth.uid()
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'market-analysis' 
    AND owner = auth.uid()
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  );

CREATE POLICY "Instructors can delete their market analysis images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'market-analysis' 
    AND owner = auth.uid()
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  );

-- Enable storage policies for premarket images
CREATE POLICY "Premarket images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'premarket-images');

CREATE POLICY "Instructors can upload premarket images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'premarket-images' 
    AND auth.role() = 'authenticated'
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  );

CREATE POLICY "Instructors can update their premarket images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'premarket-images' 
    AND owner = auth.uid()
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'premarket-images' 
    AND owner = auth.uid()
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  );

CREATE POLICY "Instructors can delete their premarket images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'premarket-images' 
    AND owner = auth.uid()
    AND (
      auth.jwt()->>'role' = 'instructor' 
      OR auth.jwt()->>'role' = 'admin'
    )
  );