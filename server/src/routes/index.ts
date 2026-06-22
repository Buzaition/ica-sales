import { Router } from "express";
import authRoutes from "./auth.js";
import leadsRoutes from "./leads.js";
import healthRoutes from "./health.js";

export const router = Router();

router.use("/auth", authRoutes);
router.use("/leads", leadsRoutes);
router.use("/health", healthRoutes);

export default router;
