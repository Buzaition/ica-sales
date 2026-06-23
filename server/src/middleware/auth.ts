import type { Request, Response } from "express";
import { getRequestAuthUser } from "../utils/session.js";

type Next = (err?: unknown) => void;

export function requireAuth(
  req: Request,
  res: Response,
  next: Next,
): void {
  if (!getRequestAuthUser(req)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: Next,
): void {
  const user = getRequestAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  next();
}
