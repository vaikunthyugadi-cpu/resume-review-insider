-- The production Supabase project already contains the ResumeReview MVP
-- schema, RLS policies, triggers, seed packages, and workflow RPCs.
-- This migration expands private resume uploads to the product requirement.

update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
where id = 'resumes';
