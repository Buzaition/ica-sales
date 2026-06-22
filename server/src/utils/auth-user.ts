import type { AuthUser } from "./session.js";

export type AuthenticatedRequest = {
  authUser?: AuthUser;
};

export function getAuthUser(req: unknown): AuthUser | undefined {
  return (req as AuthenticatedRequest).authUser;
}

export function setAuthUser(req: unknown, user: AuthUser | undefined): void {
  (req as AuthenticatedRequest).authUser = user;
}
