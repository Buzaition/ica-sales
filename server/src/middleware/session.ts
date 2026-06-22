import type * as Express from "express";
import { readSession } from "../utils/session.js";

export function sessionMiddleware(
  req: Express.Request,
  _res: Express.Response,
  next: Express.NextFunction,
): void {
  req.authUser = readSession(req) ?? undefined;
  next();
}
