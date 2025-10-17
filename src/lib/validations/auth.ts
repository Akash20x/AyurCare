import { z } from "zod";
import { UserRole } from "../../types";

/**
 * User registration validation schema
 */
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/,
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),

  name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name is too long")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Full name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .trim(),
});

/**
 * User login validation schema
 */
export const userLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password is too long"),
});

/**
 * Token refresh validation schema
 */
export const tokenRefreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required")
    .regex(
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
      "Invalid token format"
    ),
});

/**
 * Query parameter validation schemas
 */
export const authQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be a positive number"),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),

  search: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),

  role: z.enum(UserRole).optional(),
});

/**
 * Logout validation schema
 */
export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required")
    .regex(
      /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
      "Invalid token format"
    )
    .optional(), // Optional for logout all devices
});

/**
 * Type exports for TypeScript inference
 */
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type TokenRefreshInput = z.infer<typeof tokenRefreshSchema>;
export type AuthQueryInput = z.infer<typeof authQuerySchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;

/**
 * Validation helper functions
 */
export const authValidators = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const result = z.string().email().safeParse(email);
    return result.success;
  },

  /**
   * Validate password strength (basic check)
   */
  isValidPassword(password: string): boolean {
    const schema = z
      .string()
      .min(8)
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/
      );

    const result = schema.safeParse(password);
    return result.success;
  },

  /**
   * Validate phone number format
   */
  isValidPhone(phone: string): boolean {
    const result = z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .safeParse(phone);
    return result.success;
  },

  /**
   * Validate name format
   */
  isValidName(name: string): boolean {
    const result = z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-zA-Z\s'-]+$/)
      .safeParse(name);

    return result.success;
  },

  /**
   * Validate JWT token format
   */
  isValidTokenFormat(token: string): boolean {
    const result = z
      .string()
      .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)
      .safeParse(token);

    return result.success;
  },
};
