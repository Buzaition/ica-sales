import type * as Express from "express";

export function requireAuth(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction,
): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction,
): void {
  if (!req.authUser || req.authUser.role !== "admin") {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  next();
}
