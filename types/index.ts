// ============================================================
// YAARON KA SAFAR — Type Definitions
// ============================================================

// ── Enums ──
export type UserRole = 'admin' | 'student' | 'principal';
export type TripStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type ActivityStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export type AttendanceSessionStatus = 'active' | 'closed';
export type AttendanceRecordStatus = 'present' | 'absent' | 'late';
export type PaymentMethod = 'cash' | 'gpay' | 'upi' | 'other';
export type NotificationType = 'attendance' | 'activity' | 'schedule' | 'photo' | 'announcement';

// ── Database Row Types ──
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  name: string;
  subtitle: string | null;
  start_date: string;
  end_date: string;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface TripSettings {
  id: string;
  trip_id: string;
  default_student_fee: number;
  default_advance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  trip_date: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  profile_id: string | null;
  serial_number: number | null;
  full_name: string;
  admission_number: string | null;
  class_name: string | null;
  division: string | null;
  phone: string | null;
  trip_id: string;
  trip_fee: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  trip_day_id: string;
  title: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  activity_id: string;
  started_by: string | null;
  started_at: string;
  closed_at: string | null;
  status: AttendanceSessionStatus;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  marked_at: string;
  status: AttendanceRecordStatus;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  trip_id: string;
  activity_id: string | null;
  storage_path: string;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  taken_at: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Extended/Joined Types ──
export interface StudentWithPayments extends Student {
  payments: Payment[];
  total_paid: number;
  balance: number;
}

export interface ActivityWithDay extends Activity {
  trip_day: TripDay;
}

export interface TripDayWithActivities extends TripDay {
  activities: Activity[];
}

export interface AttendanceSessionWithRecords extends AttendanceSession {
  attendance_records: AttendanceRecord[];
  activity: Activity;
  present_count: number;
  total_students: number;
}

// ── Dashboard Types ──
export interface AdminDashboardData {
  trip: Trip;
  total_students: number;
  total_collected: number;
  total_pending: number;
  current_activity: Activity | null;
  next_activity: Activity | null;
  current_day: TripDay | null;
}

export interface StudentDashboardData {
  trip: Trip;
  student: Student;
  current_activity: Activity | null;
  next_activity: Activity | null;
  current_day: TripDay | null;
  today_activities: Activity[];
  total_paid: number;
  balance: number;
}

export interface PrincipalDashboardData {
  trip: Trip;
  current_activity: Activity | null;
  next_activity: Activity | null;
  current_day: TripDay | null;
  today_activities: Activity[];
}

// ── Excel Import Types ──
export interface ExcelStudentRow {
  row_number: number;
  name: string;
  admission_number?: string;
  class_name?: string;
  division?: string;
  phone?: string;
  total_amount: number;
  amount_paid: number;
}

export interface ImportPreview {
  total_rows: number;
  valid_rows: ExcelStudentRow[];
  invalid_rows: { row: ExcelStudentRow; errors: string[] }[];
  new_count: number;
  existing_count: number;
  conflict_count: number;
}

// ── Fund Summary ──
export interface FundSummary {
  total_students: number;
  total_expected: number;
  total_collected: number;
  total_pending: number;
}
