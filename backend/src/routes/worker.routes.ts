import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { verifyRole, verifyWorkerServiceAccess } from "../middlewares/user.middleware";
import * as workerController from "../controllers/worker.controller";

const router = Router();

// Apply authentication middleware to all worker routes
router.use(verifyToken);

router.get("/", workerController.getAllWorkersInfos);
router.get("/:id", workerController.getWorkerInfos);
router.post("/", verifyRole, verifyWorkerServiceAccess, workerController.createWorkerInfos);
router.put("/:id", verifyRole, verifyWorkerServiceAccess, workerController.updateWorkerInfos);
router.delete("/:id", verifyRole, verifyWorkerServiceAccess, workerController.deleteWorkerInfos);

export default router;
