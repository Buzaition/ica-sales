import type { RequestHandler } from "express";
import { readSession } from "../utils/session.js";

export const sessionMiddleware: RequestHandler = (req, _res, next) => {
  req.authUser = readSession(req) ?? undefined;
  next();
};
