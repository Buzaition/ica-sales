import type { NextFunction, Request, Response } from "express";
import { readSession } from "../utils/session.js";

export function sessionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.authUser = readSession(req) ?? undefined;
  next();
}
