import { getAuthUser } from "../utils/auth-user.js";

type Next = (err?: unknown) => void;
type RouteResponse = {
  status: (code: number) => RouteResponse;
  json: (body: unknown) => void;
};

export function requireAuth(req: unknown, res: RouteResponse, next: Next): void {
  if (!getAuthUser(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: unknown, res: RouteResponse, next: Next): void {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
