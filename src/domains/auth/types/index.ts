import { z } from "zod";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token?: string;
}

/**
 * DTO کاربر لاگین‌شده (گلوبال)
 * پس از ورود کاربر این فیلدها در استور و در صورت نیاز در localStorage پر می‌شوند.
 */
export interface LoggedInUserDto {
  /** شماره همراه */
  mobile: string;
  /** کد ملی */
  nationalId: string;
  /** نام */
  firstName: string;
  /** نام خانوادگی */
  lastName: string;
  /** تاریخ تولد به صورت شمسی (مثلاً 1370/05/15) */
  birthDate: string;
}

/**
 * Validation schema for login credentials
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Validation schema for user registration
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

