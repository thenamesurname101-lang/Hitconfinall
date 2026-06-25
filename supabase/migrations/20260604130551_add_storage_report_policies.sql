/*
  # Storage Policies for Reports Bucket

  ## Changes
  Adds RLS policies for the reports storage bucket so server-side API can manage files.

  ## Security
  - Service role has full access to the reports bucket
  - Anon role can read (needed for generating signed download URLs)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Service role can upload reports'
  ) THEN
    CREATE POLICY "Service role can upload reports"
      ON storage.objects
      FOR INSERT
      TO service_role
      WITH CHECK (bucket_id = 'reports');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Service role can read reports'
  ) THEN
    CREATE POLICY "Service role can read reports"
      ON storage.objects
      FOR SELECT
      TO service_role
      USING (bucket_id = 'reports');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Service role can delete reports'
  ) THEN
    CREATE POLICY "Service role can delete reports"
      ON storage.objects
      FOR DELETE
      TO service_role
      USING (bucket_id = 'reports');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Anon can read reports for download'
  ) THEN
    CREATE POLICY "Anon can read reports for download"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'reports');
  END IF;
END $$;
