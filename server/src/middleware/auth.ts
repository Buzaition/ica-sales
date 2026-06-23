import type { Request } from "express";
import type { RouteResponse } from "../types/http.js";
import { getRequestAuthUser } from "../utils/session.js";

type Next = (err?: unknown) => void;

export function requireAuth(
  req: Request,
  res: unknown,
  next: Next,
): void {
  if (!getRequestAuthUser(req)) {
    (res as RouteResponse).status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: unknown,
  next: Next,
): void {
  const user = getRequestAuthUser(req);
  if (!user || user.role !== "admin") {
    (res as RouteResponse).status(401).json({ error: "Admin access required" });
    return;
  }
  next();
}
