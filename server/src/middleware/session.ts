<<<<<<< HEAD
import "../types/express.js";
=======
import type {} from "../types/express.js";
>>>>>>> 8a2ef891c4bd9c2ca26f50b41293a99c8a3863a9
import type { Request, Response, NextFunction } from "express";
import { readSession } from "../utils/session.js";

export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  void res;
  const user = readSession(req);
  req.authUser = user ?? undefined;
  next();
}
