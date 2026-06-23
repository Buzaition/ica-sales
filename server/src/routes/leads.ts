import { randomUUID } from "node:crypto";
import { Router } from "express";
import {
  GetLeadsQueryParamsSchema,
  SubmitLeadBodySchema,
  UpdateLeadBodySchema,
} from "@workspace/shared";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { getRequestAuthUser } from "../utils/session.js";
import {
  createSubmission,
  getAllSubmissions,
  getSubmissionStats,
  getSubmissionsBySalesman,
  updateSubmissionById,
} from "../services/google-script.js";

const router = Router();

router.post("/leads", requireAuth, async (req, res): Promise<void> => {
  const parsed = SubmitLeadBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid Input" });
    return;
  }

  const user = getRequestAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
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
    req.log.info({ salesman: user.username, id: submission.id }, "Lead submitted");
    res.status(201).json(submission);
  } catch (err) {
    req.log.error({ err }, "Failed to submit lead to Google Sheets");
    res.status(500).json({ error: "Failed to save lead. Please try again later." });
  }
});

router.get("/leads/my", requireAuth, async (req, res): Promise<void> => {
  const user = getRequestAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const submissions = await getSubmissionsBySalesman(user.username);
    res.json(submissions);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user leads from Google Sheets");
    res.status(500).json({ error: "Failed to fetch leads. Please try again later." });
  }
});

router.get("/leads", requireAdmin, async (req, res): Promise<void> => {
  const queryParsed = GetLeadsQueryParamsSchema.safeParse(req.query);
  const filters = queryParsed.success ? queryParsed.data : {};

  try {
    const data = await getAllSubmissions(filters);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch leads from Google Sheets");
    res.status(500).json({ error: "Failed to fetch leads. Please try again later." });
  }
});

router.get("/leads/stats", requireAdmin, async (req, res): Promise<void> => {
  try {
    const data = await getSubmissionStats();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats from Google Sheets");
    res.status(500).json({ error: "Failed to fetch stats. Please try again later." });
  }
});

router.patch("/leads/:id", requireAuth, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const parsed = UpdateLeadBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid Input" });
    return;
  }

  try {
    const submissions = await getAllSubmissions();
    const existingSubmission = submissions.find((submission) => submission.id === id);

    if (!existingSubmission) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const user = getRequestAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (user.role !== "admin" && existingSubmission.salesman !== user.username) {
      res.status(403).json({ error: "You can only edit your own submissions" });
      return;
    }

    const updatedSubmission = await updateSubmissionById(id, {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });

    req.log.info({ id, username: user.username }, "Lead updated");
    res.json(updatedSubmission);
  } catch (err) {
    req.log.error({ err, id }, "Failed to update lead in Google Sheets");
    res.status(500).json({ error: "Failed to update lead. Please try again later." });
  }
});

export default router;
