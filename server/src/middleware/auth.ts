import type { RequestHandler } from "express";

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.authUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.authUser || req.authUser.role !== "admin") {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  next();
};
