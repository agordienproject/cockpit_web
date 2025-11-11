import express from "express";
import * as systemController from "../controllers/system.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { verifyRole, requireAdmin, verifySystemServiceAccess } from "../middlewares/user.middleware";

const router = express.Router();

// Apply authentication middleware to all systems routes
router.use(verifyToken);
// Endpoints for system referential (define BEFORE parameterized routes)
// Endpoints for system referential (define BEFORE parameterized routes)
router.get("/sys-ref", systemController.getAllRefSystemsInfos);                             // Route for system referential
// Admin: list disabled system referential entries and reactivate (fixed paths before parameterized)
router.get("/sys-ref/disabled", requireAdmin, systemController.getAllDisabledRefSystemsInfos);
router.put("/sys-ref/:id/activate", requireAdmin, systemController.activateRefSystemInfos);
router.get("/sys-ref/:id", systemController.getRefSystemInfos);                            // Route to get one system referential infos
router.post("/sys-ref/", requireAdmin, systemController.createRefSystemInfos);               // Route to create one system referential
router.put("/sys-ref/:id", requireAdmin, systemController.updateRefSystemInfos);             // Route to update one system referential
router.delete("/sys-ref/:id", requireAdmin, systemController.deleteRefSystemInfos);          // Route to delete one system by id

// Endpoints for systems
router.get("/", systemController.getAllSystemsInfos);                            // Route for all systems  
router.get("/:id", systemController.getSystemInfos);                            // Route to get system infos
router.post("/", verifyRole, verifySystemServiceAccess, systemController.createSystemInfos);               // Route to create system
router.put("/:id", verifyRole, verifySystemServiceAccess, systemController.updateSystemInfos);             // Route to update system
router.delete("/:id", verifyRole, verifySystemServiceAccess, systemController.deleteSystemInfos);          // Route to delete system by id

export default router;
