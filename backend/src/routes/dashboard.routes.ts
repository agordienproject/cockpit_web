import express from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(verifyToken);

// Get all dashboard data (overview)
router.get("/", dashboardController.getDashboardData);

// New lightweight endpoints used by the frontend overview
router.get('/machines', dashboardController.getMachines);
router.get('/workers', dashboardController.getWorkers);
// inspection-related routes removed

// Note: media/image streaming endpoints were removed in the new API design.

export default router;