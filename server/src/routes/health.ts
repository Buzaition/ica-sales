import { Router } from "express";
import { HealthCheckResponseSchema } from "@workspace/shared";

const router = Router();

type JsonResponse = {
  json(body: unknown): unknown;
};

router.get("/healthz", (_req: unknown, res: JsonResponse): void => {
  const data = HealthCheckResponseSchema.parse({ status: "ok" });
  res.json(data);
});

export default router;
