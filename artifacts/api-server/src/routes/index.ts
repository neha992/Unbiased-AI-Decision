import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fairnessRouter from "./fairness";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fairnessRouter);

export default router;
