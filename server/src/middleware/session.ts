import type { Request, Response } from "express";
import { readSession, setRequestAuthUser } from "../utils/session.js";

type Next = (err?: unknown) => void;

export function sessionMiddleware(
  req: Request,
  _res: Response,
  next: Next,
): void {
  setRequestAuthUser(req, readSession(req) ?? undefined);
  next();
}
