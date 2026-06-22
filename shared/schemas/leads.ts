import { z } from "zod";

export const SubmitLeadBodySchema = z.object({
  cxName: z.string().min(2, "Customer Name is required"),
  cxPhone: z.string().min(5, "Customer Phone is required"),
  callSummary: z.string().min(10, "Please provide a detailed call summary"),
});

export const GetLeadsQueryParamsSchema = z.object({
  salesman: z.coerce.string().optional(),
  date: z.coerce.string().optional(),
  search: z.coerce.string().optional(),
});

export const LeadSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  salesman: z.string(),
  cxName: z.string(),
  cxPhone: z.string(),
  callSummary: z.string(),
  updatedAt: z.string(),
});

export const LeadStatsSchema = z.object({
  total: z.number(),
  bySalesman: z.array(
    z.object({
      salesman: z.string(),
      count: z.number(),
    }),
  ),
});

export const UpdateLeadBodySchema = SubmitLeadBodySchema.partial().refine(
  (value) =>
    value.cxName !== undefined ||
    value.cxPhone !== undefined ||
    value.callSummary !== undefined,
  "At least one field must be provided",
);

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
