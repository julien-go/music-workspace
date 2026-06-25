import { z } from "zod/v4";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,72}$/;

export const registerSchema = z.object({
  email: z.email("Must be a valid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      USERNAME_REGEX,
      "Username can only contain letters, numbers, underscores and hyphens",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must contain at least one uppercase letter, one number and one special character",
    ),
});

export const loginSchema = z.object({
  email: z.email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
