-- Storage policies for images bucket
-- Allow public read access to images
CREATE POLICY "Give public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated uploads to images bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
);

-- Allow owners to update and delete their files
CREATE POLICY "Allow owners to update and delete"
ON storage.objects
FOR ALL
USING (
    bucket_id = 'images'
    AND owner = auth.uid()
);
