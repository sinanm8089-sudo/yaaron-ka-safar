-- ============================================================
-- YAARON KA SAFAR — Dummy Students Seed Data
-- ============================================================
-- This migration creates 3 dummy students for testing purposes.
-- It safely inserts into auth.users, public.profiles, and public.students.

DO $$
DECLARE
  trip_id_val UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  -- Dummy Student 1
  user_1_id UUID := gen_random_uuid();
  profile_1_id UUID := gen_random_uuid();
  
  -- Dummy Student 2
  user_2_id UUID := gen_random_uuid();
  profile_2_id UUID := gen_random_uuid();
  
  -- Dummy Student 3
  user_3_id UUID := gen_random_uuid();
  profile_3_id UUID := gen_random_uuid();
BEGIN

  -- ============================================================
  -- 1. Create Auth Users (Password: 12345678)
  -- Uses crypt('12345678', gen_salt('bf'))
  -- ============================================================
  
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
    (user_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'IVS3-001@yaaron.com', crypt('12345678', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Arjun Kumar"}', NOW(), NOW()),
    (user_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'IVS3-002@yaaron.com', crypt('12345678', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Priya Sharma"}', NOW(), NOW()),
    (user_3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'IVS3-003@yaaron.com', crypt('12345678', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Rahul Verma"}', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 2. Create Profiles
  -- ============================================================
  
  INSERT INTO public.profiles (id, user_id, full_name, role, phone, created_at, updated_at)
  VALUES
    (profile_1_id, user_1_id, 'Arjun Kumar', 'student', '9876543210', NOW(), NOW()),
    (profile_2_id, user_2_id, 'Priya Sharma', 'student', '9876543211', NOW(), NOW()),
    (profile_3_id, user_3_id, 'Rahul Verma', 'student', '9876543212', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 3. Create Students
  -- ============================================================
  
  INSERT INTO public.students (profile_id, serial_number, full_name, admission_number, class_name, division, phone, trip_id, trip_fee, created_at, updated_at)
  VALUES
    (profile_1_id, 1, 'Arjun Kumar', 'IVS3-001', '10th', 'A', '9876543210', trip_id_val, 6450.00, NOW(), NOW()),
    (profile_2_id, 2, 'Priya Sharma', 'IVS3-002', '10th', 'A', '9876543211', trip_id_val, 6450.00, NOW(), NOW()),
    (profile_3_id, 3, 'Rahul Verma', 'IVS3-003', '10th', 'B', '9876543212', trip_id_val, 6450.00, NOW(), NOW())
  ON CONFLICT DO NOTHING;

END $$;
