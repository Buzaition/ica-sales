import type { Request, Response } from "express";
import { setAuthUser } from "../utils/auth-user.js";
import { readSession } from "../utils/session.js";

type Next = (err?: unknown) => void;

export function sessionMiddleware(req: Request, res: Response, next: Next): void {
  void res;
  const user = readSession(req);
  setAuthUser(req, user ?? undefined);
  next();
}
