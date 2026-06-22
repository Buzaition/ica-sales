import { z } from "zod";

export const allowedUsernames = ["admin", "fatma", "nehal", "sara", "sera"] as const;

export const AuthUserRoleSchema = z.enum(["admin", "rep"]);
export const UsernameSchema = z.enum(allowedUsernames);

export const LoginBodySchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const AuthUserSchema = z.object({
  username: UsernameSchema,
  role: AuthUserRoleSchema,
});

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});
