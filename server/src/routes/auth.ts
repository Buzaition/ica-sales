import { Router } from "express";
import { LoginBodySchema } from "@workspace/shared";
import { authenticateUser } from "../services/users.js";
import type { RouteRequest, RouteResponse } from "../types/http.js";
import {
  clearSessionCookie,
  getRequestAuthUser,
  isSessionConfigured,
  setSessionCookie,
} from "../utils/session.js";

const router = Router();

router.post("/auth/login", async (req: unknown, res: unknown): Promise<void> => {
  const request = req as RouteRequest;
  const response = res as RouteResponse;
  const parsed = LoginBodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid Input" });
    return;
  }

  const { username, password } = parsed.data;
  const user = authenticateUser(username, password);

  if (!user) {
    request.log.warn({ username }, "Failed login attempt");
    response.status(401).json({ error: "Invalid Input" });
    return;
  }

  if (!isSessionConfigured()) {
    request.log.error({ username }, "SESSION_SECRET is not configured");
    response.status(500).json({ error: "Server authentication is not configured" });
    return;
  }

  setSessionCookie(response, user);
  request.log.info({ username: user.username, role: user.role }, "User logged in");
  response.json(user);
});

router.post("/auth/logout", async (_req: unknown, res: unknown): Promise<void> => {
  const response = res as RouteResponse;
  clearSessionCookie(response);
  response.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", async (req: unknown, res: unknown): Promise<void> => {
  const response = res as RouteResponse;
  const user = getRequestAuthUser(req);
  if (!user) {
    response.status(401).json({ error: "Not authenticated" });
    return;
  }
  response.json(user);
});

export default router;
