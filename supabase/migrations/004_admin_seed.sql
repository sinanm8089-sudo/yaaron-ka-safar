-- ============================================================
-- YAARON KA SAFAR — Admin Seed Data
-- ============================================================
-- This migration creates the default admin user.

DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
  admin_profile_id UUID := gen_random_uuid();
BEGIN

  -- ============================================================
  -- 1. Create Admin Auth User (Password: admin123)
  -- Uses crypt('admin123', gen_salt('bf'))
  -- Login ID will be 'admin' (email: admin@yaaron.com)
  -- ============================================================
  
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
    (admin_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@yaaron.com', crypt('admin123', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "System Admin"}', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 2. Create Admin Profile
  -- ============================================================
  
  INSERT INTO public.profiles (id, user_id, full_name, role, phone, created_at, updated_at)
  VALUES
    (admin_profile_id, admin_user_id, 'System Admin', 'admin', '0000000000', NOW(), NOW())
  ON CONFLICT DO NOTHING;

END $$;
