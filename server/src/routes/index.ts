import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import leadsRouter from "./leads.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(leadsRouter);

export default router;
