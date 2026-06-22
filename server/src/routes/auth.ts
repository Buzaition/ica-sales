import { Router } from "express";
import { LoginBodySchema } from "@workspace/shared";
import { authenticateUser } from "../services/users.js";
import { getAuthUser } from "../utils/auth-user.js";
import { clearSessionCookie, setSessionCookie } from "../utils/session.js";

const router = Router();

type RouteRequest = {
  body?: unknown;
  log: {
    warn: (data: unknown, message?: string) => void;
    info: (data: unknown, message?: string) => void;
  };
};

type RouteResponse = {
  status: (code: number) => RouteResponse;
  json: (body: unknown) => void;
};

router.post("/login", async (req: RouteRequest, res: RouteResponse): Promise<void> => {
  const parsed = LoginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid Input" });
    return;
  }

  const { username, password } = parsed.data;
  const user = authenticateUser(username, password);

  if (!user) {
    req.log.warn({ username }, "Failed login attempt");
    res.status(401).json({ error: "Invalid Input" });
    return;
  }

  setSessionCookie(res, user);
  req.log.info({ username: user.username, role: user.role }, "User logged in");
  res.json(user);
});

router.post("/logout", async (_req: RouteRequest, res: RouteResponse): Promise<void> => {
  clearSessionCookie(res);
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req: RouteRequest, res: RouteResponse): Promise<void> => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(user);
});

export default router;
