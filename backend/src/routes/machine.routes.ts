import express from "express";
import * as machineController from "../controllers/machine.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { verifyRole } from "../middlewares/user.middleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);
// Endpoints for machine referential (define BEFORE parameterized routes)
router.get("/machine-ref", machineController.getAllRefMachinesInfos);                             // Route for Machine referential
router.get("/machine-ref/:id", machineController.getRefMachineInfos);                            // Route to get one Machine referential infos
router.post("/machine-ref/", verifyRole, machineController.createRefMachineInfos);               // Route to create one Machine referential
router.put("/machine-ref/:id", verifyRole, machineController.updateRefMachineInfos);             // Route to update one Machine referential
router.delete("/machine-ref/:id", verifyRole, machineController.deleteRefMachineInfos);          // Route to delete one Machine by id

// Endpoints for machines
router.get("/", machineController.getAllMachinesInfos);
router.get("/:id", machineController.getMachineInfos);                          // Route to get machine view
router.get("/:id/test", machineController.testMachine);                         // Route to test if we can access to the machine's metrics
router.post("/", verifyRole, machineController.createMachineInfos);             // Route to create machine
router.put("/:id", verifyRole, machineController.updateMachineInfos);           // Route to update machine
router.delete("/:id", verifyRole, machineController.deleteMachineInfos);        // Route to delete machine by id

export default router;
