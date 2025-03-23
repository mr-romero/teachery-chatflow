-- First, remove any existing policies
DROP POLICY IF EXISTS "Give public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to update and delete" ON storage.objects;

-- Allow anyone to read images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow anyone to upload to public folder
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'images' 
    AND path LIKE 'public/%'
);

-- Allow deletion of files in public folder
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'images'
    AND path LIKE 'public/%'
);
