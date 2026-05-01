-- =====================================================
-- ADMIN NOTIFICATIONS & AVATARS BUCKET
-- =====================================================

-- 1. Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_notifications_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow only authenticated admins to select and update notifications
DROP POLICY IF EXISTS "Allow admins to read notifications" ON public.admin_notifications;
CREATE POLICY "Allow admins to read notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Allow admins to update notifications" ON public.admin_notifications;
CREATE POLICY "Allow admins to update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Enable Realtime for admin_notifications
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  CREATE PUBLICATION supabase_realtime;
  ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
COMMIT;

-- =====================================================
-- STORAGE SETUP
-- =====================================================

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
-- Allow public access to view avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatars." ON storage.objects;
CREATE POLICY "Users can upload their own avatars."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'avatars' );

-- Allow users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'avatars' );
  
-- Allow users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars." ON storage.objects;
CREATE POLICY "Users can delete their own avatars."
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'avatars' );
