import { z } from "zod";
import {
  AuthUserRoleSchema,
  AuthUserSchema,
  ErrorResponseSchema,
  GetLeadsQueryParamsSchema,
  HealthCheckResponseSchema,
  LeadSchema,
  LeadStatsSchema,
  LoginBodySchema,
  LogoutResponseSchema,
  SubmitLeadBodySchema,
  SuccessResponseSchema,
  UpdateLeadBodySchema,
} from "../schemas/index.js";

export type AuthUserRole = z.infer<typeof AuthUserRoleSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type GetLeadsParams = z.infer<typeof GetLeadsQueryParamsSchema>;
export type HealthStatus = z.infer<typeof HealthCheckResponseSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type LeadInput = z.infer<typeof SubmitLeadBodySchema>;
export type LeadStats = z.infer<typeof LeadStatsSchema>;
export type LoginInput = z.infer<typeof LoginBodySchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadBodySchema>;
