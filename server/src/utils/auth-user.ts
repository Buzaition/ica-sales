import type { Request } from "express";
import type { AuthUser } from "./session.js";

export type AuthenticatedRequest = Request & {
  authUser?: AuthUser;
};

export function getAuthUser(req: Request): AuthUser | undefined {
  return (req as AuthenticatedRequest).authUser;
}

export function setAuthUser(req: Request, user: AuthUser | undefined): void {
  (req as AuthenticatedRequest).authUser = user;
}
