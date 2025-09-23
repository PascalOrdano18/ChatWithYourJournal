-- Supabase Storage Setup for Journal Media
-- Execute this SQL in your Supabase dashboard SQL editor

-- Create storage bucket for journal media
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-media', 'journal-media', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Users can upload their own media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'journal-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'journal-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'journal-media' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Optional: Create a function to automatically create user folders
CREATE OR REPLACE FUNCTION create_user_folder()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used to automatically create user folders
  -- when a user is created, but it's optional for this implementation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


