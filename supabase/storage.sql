-- First, ensure the storage extension is enabled
CREATE EXTENSION IF NOT EXISTS "storage" schema "storage";

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Simple policy to allow everything on the images bucket
CREATE POLICY "Allow all operations on images bucket"
ON storage.objects FOR ALL
USING (bucket_id = 'images');

-- Delete any existing restrictive policies
DROP POLICY IF EXISTS "Give public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to update and delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;
