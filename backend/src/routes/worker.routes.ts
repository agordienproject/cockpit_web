import { Router } from "express";
import { verifyRole } from "../middlewares/user.middleware";
import * as workerController from "../controllers/worker.controller";

const router = Router();

router.get("/", verifyRole, workerController.getAllWorkersInfos);
router.get("/:id", verifyRole, workerController.getWorkerInfos);
router.post("/", verifyRole, workerController.createWorkerInfos);
router.put("/:id", verifyRole, workerController.updateWorkerInfos);
router.delete("/:id", verifyRole, workerController.deleteWorkerInfos);

export default router;
