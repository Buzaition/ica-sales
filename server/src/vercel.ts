import app from "./app.js";

type VercelHandler = (req: unknown, res: unknown) => unknown;

export default function handler(req: unknown, res: unknown): unknown {
  return (app as VercelHandler)(req, res);
}
