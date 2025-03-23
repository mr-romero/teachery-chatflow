-- First, remove any existing CORS configuration
DELETE FROM storage.buckets WHERE id = 'images';

-- Recreate the bucket with proper CORS configuration
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
);

-- Configure CORS for the bucket
BEGIN;
  INSERT INTO storage.buckets (id, name)
  VALUES ('images', 'images')
  ON CONFLICT (id) DO
  UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

  -- Set CORS configuration
  UPDATE storage.buckets
  SET cors_origins = ARRAY[
    'https://desmos.mr-romero.com',
    'http://localhost:8080',  -- For local development
    'http://localhost:3000'   -- For local API
  ]
  WHERE id = 'images';
END;

-- Verify the configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  cors_origins
FROM storage.buckets
WHERE id = 'images';
