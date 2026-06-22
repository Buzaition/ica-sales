import type { Request, Response } from "express";
import { getAuthUser } from "../utils/auth-user.js";

type Next = (err?: unknown) => void;

export function requireAuth(req: Request, res: Response, next: Next): void {
  if (!getAuthUser(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: Next): void {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
