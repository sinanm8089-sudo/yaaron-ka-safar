import { z } from 'zod';

export const loginSchema = z.object({
  admission_number: z.string().min(1, 'Please enter your admission number'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const paymentSchema = z.object({
  student_id: z.string().uuid(),
  amount: z.number().min(0, 'Amount must be positive'),
  payment_method: z.enum(['cash', 'gpay', 'upi', 'other']),
  payment_date: z.string(),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const activitySchema = z.object({
  trip_day_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  sort_order: z.number().int().min(0).default(0),
});

export type ActivityFormData = z.infer<typeof activitySchema>;

export const studentSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  admission_number: z.string().optional(),
  class_name: z.string().optional(),
  division: z.string().optional(),
  phone: z.string().optional(),
  trip_fee: z.number().min(0).default(6450),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export const photoSchema = z.object({
  activity_id: z.string().uuid().optional(),
  caption: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type PhotoFormData = z.infer<typeof photoSchema>;
