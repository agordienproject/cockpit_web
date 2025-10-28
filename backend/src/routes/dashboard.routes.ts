import express from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(verifyToken);

// Get all dashboard data in one call
router.get("/", dashboardController.getDashboardData);

// Individual endpoints for specific dashboard sections
router.get("/stats", dashboardController.getInspectionStats);
router.get("/pieces", dashboardController.getCurrentPieceStates);
router.get("/inspectors", dashboardController.getInspectorPerformance);
router.get("/trends", dashboardController.getDailyTrends);
router.get("/piece-history", dashboardController.getPieceHistory);
router.get("/piece-history/:ref_piece", dashboardController.getPieceHistory);
router.get("/piece-history/:ref_piece/detail", dashboardController.getPieceHistoryDetail);
// Route to get validation time distribution
router.get('/validation-times', dashboardController.getValidationTimeDistribution);

// FTP images endpoints
router.get('/inspection-images', dashboardController.listInspectionImages);
router.get('/inspection-images/:file', dashboardController.streamInspectionImage);

// FTP media (images + videos) endpoints
router.get('/inspection-media', dashboardController.listInspectionMedia);
router.get('/inspection-media/:file', dashboardController.streamInspectionMedia);

// PLY scans and analysis report
router.get('/inspection-scans', dashboardController.listInspectionScans);
router.get('/inspection-scans/:file', dashboardController.streamInspectionScan);
router.get('/inspection-scan-report', dashboardController.getInspectionScanReport);

export default router;