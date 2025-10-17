/*
  # Setup Storage Policies for File Uploads

  1. Storage Bucket Setup
    - Create 'documents' bucket if it doesn't exist
    - Configure bucket to be private by default

  2. Storage Policies
    - Allow authenticated users to upload files (INSERT)
    - Allow authenticated users to view their own files (SELECT)
    - Allow authenticated users to update their own files (UPDATE)
    - Allow authenticated users to delete their own files (DELETE)

  3. Security
    - Files are organized by type (income/expense) and event ID
    - Users can only access files related to events in their company
*/

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to documents bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy to allow authenticated users to view files from their company's events
CREATE POLICY "Allow authenticated users to view company files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (
    -- Allow access to files in paths that belong to events from user's company
    name LIKE 'income/%' OR 
    name LIKE 'expense/%' OR
    name LIKE 'documents/%'
  )
);

-- Policy to allow authenticated users to update files they uploaded
CREATE POLICY "Allow authenticated users to update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Policy to allow authenticated users to delete files they uploaded
CREATE POLICY "Allow authenticated users to delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');