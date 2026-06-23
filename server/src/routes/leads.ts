import { randomUUID } from "node:crypto";
import { Router } from "express";
import {
  GetLeadsQueryParamsSchema,
  SubmitLeadBodySchema,
  UpdateLeadBodySchema,
} from "@workspace/shared";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import type { RouteRequest, RouteResponse } from "../types/http.js";
import { getRequestAuthUser } from "../utils/session.js";
import {
  createSubmission,
  getAllSubmissions,
  getSubmissionStats,
  getSubmissionsBySalesman,
  updateSubmissionById,
} from "../services/google-script.js";

const router = Router();

router.post("/leads", requireAuth, async (req: unknown, res: unknown): Promise<void> => {
  const request = req as RouteRequest;
  const response = res as RouteResponse;
  const parsed = SubmitLeadBodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid Input" });
    return;
  }

  const user = getRequestAuthUser(req);
  if (!user) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }
  const now = new Date().toISOString();

  try {
    const submission = await createSubmission({
      id: randomUUID(),
      timestamp: now,
      updatedAt: now,
      salesman: user.username,
      cxName: parsed.data.cxName,
      cxPhone: parsed.data.cxPhone,
      callSummary: parsed.data.callSummary,
    });
    request.log.info({ salesman: user.username, id: submission.id }, "Lead submitted");
    response.status(201).json(submission);
  } catch (err) {
    request.log.error({ err }, "Failed to submit lead to Google Sheets");
    response.status(500).json({ error: "Failed to save lead. Please try again later." });
  }
});

router.get("/leads/my", requireAuth, async (req: unknown, res: unknown): Promise<void> => {
  const request = req as RouteRequest;
  const response = res as RouteResponse;
  const user = getRequestAuthUser(req);
  if (!user) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const submissions = await getSubmissionsBySalesman(user.username);
    response.json(submissions);
  } catch (err) {
    request.log.error({ err }, "Failed to fetch user leads from Google Sheets");
    response.status(500).json({ error: "Failed to fetch leads. Please try again later." });
  }
});

router.get("/leads", requireAdmin, async (req: unknown, res: unknown): Promise<void> => {
  const request = req as RouteRequest;
  const response = res as RouteResponse;
  const queryParsed = GetLeadsQueryParamsSchema.safeParse(request.query);
  const filters = queryParsed.success ? queryParsed.data : {};

  try {
    const data = await getAllSubmissions(filters);
    response.json(data);
  } catch (err) {
    request.log.error({ err }, "Failed to fetch leads from Google Sheets");
    response.status(500).json({ error: "Failed to fetch leads. Please try again later." });
  }
});

router.get("/leads/stats", requireAdmin, async (req: unknown, res: unknown): Promise<void> => {
  const request = req as RouteRequest;
  const response = res as RouteResponse;
  try {
    const data = await getSubmissionStats();
    response.json(data);
  } catch (err) {
    request.log.error({ err }, "Failed to fetch stats from Google Sheets");
    response.status(500).json({ error: "Failed to fetch stats. Please try again later." });
  }
});

router.patch("/leads/:id", requireAuth, async (req: unknown, res: unknown): Promise<void> => {
  const request = req as RouteRequest;
  const response = res as RouteResponse;
  const id = String(request.params?.id ?? "");
  const parsed = UpdateLeadBodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid Input" });
    return;
  }

  try {
    const submissions = await getAllSubmissions();
    const existingSubmission = submissions.find((submission) => submission.id === id);

    if (!existingSubmission) {
      response.status(404).json({ error: "Submission not found" });
      return;
    }

    const user = getRequestAuthUser(req);
    if (!user) {
      response.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (user.role !== "admin" && existingSubmission.salesman !== user.username) {
      response.status(403).json({ error: "You can only edit your own submissions" });
      return;
    }

    const updatedSubmission = await updateSubmissionById(id, {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });

    request.log.info({ id, username: user.username }, "Lead updated");
    response.json(updatedSubmission);
  } catch (err) {
    request.log.error({ err, id }, "Failed to update lead in Google Sheets");
    response.status(500).json({ error: "Failed to update lead. Please try again later." });
  }
});

export default router;
