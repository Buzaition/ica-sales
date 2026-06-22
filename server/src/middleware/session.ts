import type {} from "../types/express.js";
import type { Request, Response, NextFunction } from "express";
import { readSession } from "../utils/session.js";

export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  void res;
  const user = readSession(req);
  req.authUser = user ?? undefined;
  next();
}
