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
* Logged-in user DTO (global).
* After login these fields are set in the store and optionally persisted to localStorage.
 */
export interface LoggedInUserDto {
  /** Mobile number */
  mobile: string;
  /** National ID */
  nationalId: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Birth date in Shamsi format (e.g. 1370/05/15) */
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

