import { Router } from "express";
import { verifyWorkerCreds } from "../middlewares/worker.middleware";
import { verifyRole } from "../middlewares/user.middleware";
import * as verifController from "../controllers/verif.controller";

const router = Router();
router.use(verifyWorkerCreds);

// Classify routes for inspections
router.get("/", verifController.getAllVerifInfos);                      // Route to get all verifications
router.get("/current", verifController.getAllCurrentVerifInfos);        // Route to get all current verifications
router.get("/:id", verifController.getVerifInfos);                      // Route to get verification by id
router.post("/", verifyWorkerCreds, verifController.createVerifInfos);                     // Route to create verification
router.put("/:id", verifyRole, verifController.updateVerifInfos);                   // Route to update verification by id
router.delete("/:id", verifyRole, verifController.deleteVerifInfos);    // Route to delete verification by id

export default router;
