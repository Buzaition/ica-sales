import { Router } from "express";
import { HealthCheckResponseSchema } from "@workspace/shared";

const router = Router();

type RouteResponse = {
  json: (body: unknown) => void;
};

router.get("/healthz", (_req: unknown, res: RouteResponse) => {
  const data = HealthCheckResponseSchema.parse({ status: "ok" });
  res.json(data);
});

export default router;
