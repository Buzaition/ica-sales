import { Router } from "express";
import { LoginBodySchema } from "@workspace/shared";
import { authenticateUser } from "../services/users.js";
import { clearSessionCookie, setSessionCookie } from "../utils/session.js";

const router = Router();

router.post("/login", async (req, res): Promise<void> => {
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

router.post("/logout", async (req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", async (req, res): Promise<void> => {
  if (!req.authUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(req.authUser);
});

export default router;
