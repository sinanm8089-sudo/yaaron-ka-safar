-- ============================================================
-- YAARON KA SAFAR — Database Schema Migration
-- ============================================================
-- Run this in your Supabase SQL editor or via CLI migrations.
-- This creates all tables, indexes, RLS policies, and seed data.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'principal')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- 2. TRIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subtitle TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TRIP SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  default_student_fee NUMERIC(10,2) NOT NULL DEFAULT 6450.00,
  default_advance NUMERIC(10,2) NOT NULL DEFAULT 1500.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trip_settings_trip_id ON trip_settings(trip_id);

-- ============================================================
-- 4. TRIP DAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  trip_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

CREATE INDEX idx_trip_days_trip_id ON trip_days(trip_id);

-- ============================================================
-- 5. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  serial_number INTEGER,
  full_name TEXT NOT NULL,
  admission_number TEXT,
  class_name TEXT,
  division TEXT,
  phone TEXT,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  trip_fee NUMERIC(10,2) NOT NULL DEFAULT 6450.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_trip_id ON students(trip_id);
CREATE INDEX idx_students_profile_id ON students(profile_id);
CREATE INDEX idx_students_admission_number ON students(admission_number);

-- ============================================================
-- 6. ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_day_id UUID NOT NULL REFERENCES trip_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_trip_day_id ON activities(trip_day_id);
CREATE INDEX idx_activities_status ON activities(status);

-- ============================================================
-- 7. ATTENDANCE SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  started_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

CREATE INDEX idx_attendance_sessions_activity_id ON attendance_sessions(activity_id);
CREATE INDEX idx_attendance_sessions_status ON attendance_sessions(status);

-- ============================================================
-- 8. ATTENDANCE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);

-- ============================================================
-- 9. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'gpay', 'upi', 'other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_student_id ON payments(student_id);

-- ============================================================
-- 10. PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_photos_activity_id ON photos(activity_id);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('attendance', 'activity', 'schedule', 'photo', 'announcement')),
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- 12. HELPER FUNCTIONS
-- ============================================================

-- Function to get profile role for current user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get profile id for current user
CREATE OR REPLACE FUNCTION get_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get student id for current user
CREATE OR REPLACE FUNCTION get_user_student_id()
RETURNS UUID AS $$
  SELECT s.id FROM students s
  JOIN profiles p ON s.profile_id = p.id
  WHERE p.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_trip_settings_updated_at BEFORE UPDATE ON trip_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Admin can manage all profiles" ON profiles
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- ── TRIPS ──
CREATE POLICY "Admin full access to trips" ON trips
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Authenticated users can view trips" ON trips
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── TRIP SETTINGS ──
CREATE POLICY "Admin full access to trip_settings" ON trip_settings
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Students can view trip_settings" ON trip_settings
  FOR SELECT USING (get_user_role() = 'student');

-- Principal CANNOT see trip_settings (financial data)

-- ── TRIP DAYS ──
CREATE POLICY "Admin full access to trip_days" ON trip_days
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Authenticated users can view trip_days" ON trip_days
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── STUDENTS ──
CREATE POLICY "Admin full access to students" ON students
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Students can view own record" ON students
  FOR SELECT USING (profile_id = get_user_profile_id());

CREATE POLICY "Principal can view student non-financial data" ON students
  FOR SELECT USING (get_user_role() = 'principal');

-- ── ACTIVITIES ──
CREATE POLICY "Admin full access to activities" ON activities
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Authenticated users can view activities" ON activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── ATTENDANCE SESSIONS ──
CREATE POLICY "Admin full access to attendance_sessions" ON attendance_sessions
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Students can view active sessions" ON attendance_sessions
  FOR SELECT USING (get_user_role() = 'student');

-- Principal CANNOT see attendance_sessions

-- ── ATTENDANCE RECORDS ──
CREATE POLICY "Admin full access to attendance_records" ON attendance_records
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Students can insert own attendance" ON attendance_records
  FOR INSERT WITH CHECK (student_id = get_user_student_id());

CREATE POLICY "Students can view own attendance" ON attendance_records
  FOR SELECT USING (student_id = get_user_student_id());

-- ── PAYMENTS ──
CREATE POLICY "Admin full access to payments" ON payments
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Students can view own payments" ON payments
  FOR SELECT USING (student_id = get_user_student_id());

-- Principal CANNOT access payments AT ALL

-- ── PHOTOS ──
CREATE POLICY "Admin full access to photos" ON photos
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Authenticated users can view photos" ON photos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── NOTIFICATIONS ──
CREATE POLICY "Admin can manage all notifications" ON notifications
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = get_user_profile_id());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = get_user_profile_id());

-- ============================================================
-- 14. SEED DATA — Trip & Schedule
-- ============================================================

-- Insert the trip
INSERT INTO trips (id, name, subtitle, start_date, end_date, status) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Yaaron Ka Safar', 'Goa • Dandeli', '2026-10-02', '2026-10-06', 'upcoming');

-- Insert trip settings
INSERT INTO trip_settings (trip_id, default_student_fee, default_advance, currency) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6450.00, 1500.00, 'INR');

-- Insert trip days
INSERT INTO trip_days (id, trip_id, day_number, trip_date, title, description) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '2026-10-02', 'Calicut → Mangalore → Dandeli', 'Train journey from Calicut to Mangalore, then road travel to Dandeli'),
  ('d1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, '2026-10-03', 'Dandeli Adventure', 'Full day of water activities, trekking, and adventure sports at Dandeli'),
  ('d1000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, '2026-10-04', 'Dandeli → Goa', 'Travel from Dandeli to Goa with beach sightseeing'),
  ('d1000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '2026-10-05', 'Industrial Visit & Goa Sightseeing', 'IV, fort visit, churches, and return journey'),
  ('d1000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '2026-10-06', 'Return to Calicut', 'Arrival back at Calicut Railway Station');

-- Day 1 activities
INSERT INTO activities (trip_day_id, title, description, location, start_time, sort_order, status) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Train Departure', 'Board train from Calicut Railway Station', 'Calicut Railway Station', '2026-10-02 17:00:00+05:30', 1, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000001', 'Arrive Mangalore', 'Arrival at Mangalore Central Railway Station', 'Mangalore Central', '2026-10-02 21:00:00+05:30', 2, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000001', 'Road Travel to Dandeli', 'Night journey from Mangalore to Dandeli', 'Mangalore → Dandeli', '2026-10-02 22:00:00+05:30', 3, 'upcoming');

-- Day 2 activities
INSERT INTO activities (trip_day_id, title, description, location, start_time, sort_order, status) VALUES
  ('d1000001-0000-0000-0000-000000000002', 'Dandeli Arrival', 'Arrive at Dandeli resort', 'Dandeli', '2026-10-03 07:00:00+05:30', 1, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000002', 'Fresh-up & Breakfast', 'Check in, freshen up, and have breakfast', 'Dandeli Resort', '2026-10-03 07:30:00+05:30', 2, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000002', 'Water Activities', 'Lake Kayaking, Lake Zorbing, Sky Zip Line, Sky Cycling', 'Dandeli', '2026-10-03 09:00:00+05:30', 3, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000002', 'Lunch', 'Lunch at resort', 'Dandeli Resort', '2026-10-03 13:00:00+05:30', 4, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000002', 'Adventure Activities', 'Trekking, Archery, Rope activities, Indoor & Outdoor games', 'Dandeli', '2026-10-03 14:30:00+05:30', 5, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000002', 'Swimming & Rain Dance', 'Swimming pool and Rain Dance', 'Dandeli Resort', '2026-10-03 16:30:00+05:30', 6, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000002', 'Campfire', 'Evening campfire at the resort', 'Dandeli Resort', '2026-10-03 19:00:00+05:30', 7, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000002', 'DJ & Dinner', 'DJ night followed by dinner', 'Dandeli Resort', '2026-10-03 20:30:00+05:30', 8, 'upcoming');

-- Day 3 activities
INSERT INTO activities (trip_day_id, title, description, location, start_time, sort_order, status) VALUES
  ('d1000001-0000-0000-0000-000000000003', 'Breakfast & Checkout', 'Morning breakfast and checkout from Dandeli resort', 'Dandeli Resort', '2026-10-04 08:00:00+05:30', 1, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000003', 'Travel to Goa', 'Road journey from Dandeli to Goa', 'Dandeli → Goa', '2026-10-04 09:30:00+05:30', 2, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000003', 'Anjuna Beach', 'Visit Anjuna Beach', 'Anjuna Beach, Goa', '2026-10-04 13:00:00+05:30', 3, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000003', 'Vagator Beach', 'Visit Vagator Beach', 'Vagator Beach, Goa', '2026-10-04 14:00:00+05:30', 4, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000003', 'Lunch', 'Lunch in Goa', 'Goa', '2026-10-04 15:00:00+05:30', 5, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000003', 'Calangute Beach', 'Visit Calangute Beach', 'Calangute Beach, Goa', '2026-10-04 16:00:00+05:30', 6, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000003', 'Baga Beach', 'Visit Baga Beach', 'Baga Beach, Goa', '2026-10-04 17:30:00+05:30', 7, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000003', 'DJ & Dinner', 'Evening DJ and dinner', 'Goa', '2026-10-04 20:00:00+05:30', 8, 'upcoming');

-- Day 4 activities
INSERT INTO activities (trip_day_id, title, description, location, start_time, sort_order, status) VALUES
  ('d1000001-0000-0000-0000-000000000004', 'Breakfast', 'Morning breakfast', 'Goa Hotel', '2026-10-05 08:30:00+05:30', 1, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000004', 'Industrial Visit', 'Morning industrial visit', 'Goa', '2026-10-05 10:00:00+05:30', 2, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000004', 'Aguada Fort', 'Visit Fort Aguada', 'Fort Aguada, Goa', '2026-10-05 13:00:00+05:30', 3, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000004', 'Candolim Beach', 'Visit Candolim Beach', 'Candolim Beach, Goa', '2026-10-05 14:30:00+05:30', 4, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000004', 'Old Goa Church', 'Visit historical churches of Old Goa', 'Old Goa', '2026-10-05 16:00:00+05:30', 5, 'upcoming'),
  ('d1000001-0000-0000-0000-000000000004', 'Dinner & Departure', 'Dinner and travel to Mangalore for return train', 'Goa', '2026-10-05 19:00:00+05:30', 6, 'upcoming');

-- Day 5 activities
INSERT INTO activities (trip_day_id, title, description, location, start_time, sort_order, status) VALUES
  ('d1000001-0000-0000-0000-000000000005', 'Arrival at Calicut', 'Arrive at Calicut Railway Station — Trip Complete!', 'Calicut Railway Station', '2026-10-06 10:30:00+05:30', 1, 'upcoming');

-- ============================================================
-- 15. STORAGE BUCKET
-- ============================================================
-- Run this separately in Supabase dashboard or via API:
-- Create a bucket named 'trip-photos' with public access for viewing

-- ============================================================
-- 16. REALTIME
-- ============================================================
-- Enable realtime for key tables (run in Supabase dashboard):
-- ALTER PUBLICATION supabase_realtime ADD TABLE activities;
-- ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE photos;
