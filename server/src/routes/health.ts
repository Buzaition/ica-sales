import { Router } from "express";
import { HealthCheckResponseSchema } from "@workspace/shared";
import type { RouteResponse } from "../types/http.js";

const router = Router();

router.get("/healthz", (_req: unknown, res: unknown): void => {
  const response = res as RouteResponse;
  const data = HealthCheckResponseSchema.parse({ status: "ok" });
  response.json(data);
});

export default router;
