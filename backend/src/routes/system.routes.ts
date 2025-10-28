import express from "express";
import * as systemController from "../controllers/system.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { verifyRole } from "../middlewares/user.middleware";

const router = express.Router();

// Apply authentication middleware to all systems routes
router.use(verifyToken);

// Endpoints for systems
router.get("/", systemController.getAllSystemsInfos);                            // Route for all systems  
router.get("/:id", systemController.getSystemInfos);                            // Route to get system infos
router.post("/", verifyRole, systemController.createSystemInfos);               // Route to create system
router.put("/:id", verifyRole, systemController.updateSystemInfos);             // Route to update system
router.delete("/:id", verifyRole, systemController.deleteSystemInfos);          // Route to delete system by id

// Endpoints for system referential
router.get("/sys-ref", systemController.getAllRefSystemsInfos);                             // Route for system referential
router.get("/sys-ref/:id", systemController.getRefSystemInfos);                            // Route to get one system referential infos
router.post("/sys-ref/", verifyRole, systemController.createRefSystemInfos);               // Route to create one system referential
router.put("/sys-ref/:id", verifyRole, systemController.updateRefSystemInfos);             // Route to update one system referential
router.delete("/sys-ref/:id", verifyRole, systemController.deleteRefSystemInfos);          // Route to delete one system by id

export default router;
