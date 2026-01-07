import express from "express";
import * as dbController from "../controllers/db.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { verifyRole, requireAdmin } from "../middlewares/user.middleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Endpoints for database type referential (define BEFORE parameterized routes)
router.get("/db-ref", dbController.getAllRefDatabaseTypesInfos);
router.get("/db-ref/disabled", requireAdmin, dbController.getAllDisabledRefDatabaseTypesInfos);
router.put("/db-ref/:id/activate", requireAdmin, dbController.activateRefDatabaseTypeInfos);
router.get("/db-ref/:id", dbController.getRefDatabaseTypeInfos);
router.post("/db-ref/", requireAdmin, dbController.createRefDatabaseTypeInfos);
router.put("/db-ref/:id", requireAdmin, dbController.updateRefDatabaseTypeInfos);
router.delete("/db-ref/:id", requireAdmin, dbController.deleteRefDatabaseTypeInfos);

// Endpoints for databases
router.get("/", dbController.getAllDatabasesInfos);
router.get("/:id", dbController.getDatabaseInfos);
router.post("/", verifyRole, dbController.createDatabaseInfos);
router.put("/:id", verifyRole, dbController.updateDatabaseInfos);
router.delete("/:id", verifyRole, dbController.deleteDatabaseInfos);
router.post("/test-connection", verifyRole, dbController.testDatabaseConnection);

export default router;
