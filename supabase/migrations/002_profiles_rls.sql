-- ============================================================
-- MIGRATION: Ensure Profiles RLS policies exist
-- ============================================================
-- Run this in the Supabase SQL Editor to ensure the admin
-- can read all profiles on the new /admin/profiles page.
-- ============================================================

-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to avoid "already exists" errors
DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Admin can do everything on profiles
CREATE POLICY "Admin can manage all profiles" ON profiles
  FOR ALL USING (get_user_role() = 'admin');

-- All authenticated users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());
