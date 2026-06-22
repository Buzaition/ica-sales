import { Router } from "express";
import { HealthCheckResponseSchema } from "@workspace/shared";

const router = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponseSchema.parse({ status: "ok" });
  res.json(data);
});

export default router;
