import { Router, type Request, type Response } from "express";
import { HealthCheckResponseSchema } from "@workspace/shared";

const router = Router();

router.get("/healthz", (_req: Request, res: Response): void => {
  const data = HealthCheckResponseSchema.parse({ status: "ok" });
  res.json(data);
});

export default router;
