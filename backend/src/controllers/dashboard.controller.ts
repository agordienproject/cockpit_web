import { Request, Response } from "express";

// Dashboard is disabled / blank per request. Return empty structures.
export const getDashboardData = async (_req: Request, res: Response) => {
    res.status(200).json({ inspectionStats: {}, currentPieceStates: [], inspectorPerformance: [], dailyTrends: [], pieceHistory: [] });
};

export const getInspectionStats = async (_req: Request, res: Response) => res.status(200).json({});
export const getCurrentPieceStates = async (_req: Request, res: Response) => res.status(200).json([]);
export const getInspectorPerformance = async (_req: Request, res: Response) => res.status(200).json([]);
export const getDailyTrends = async (_req: Request, res: Response) => res.status(200).json([]);
export const getPieceHistory = async (_req: Request, res: Response) => res.status(200).json([]);
export const getPieceHistoryDetail = async (_req: Request, res: Response) => res.status(200).json([]);
export const getValidationTimeDistribution = async (_req: Request, res: Response) => res.status(200).json([]);

// FTP/media endpoints are kept but stubbed to return empty lists / not-implemented
export const listInspectionImages = async (_req: Request, res: Response) => res.status(200).json([]);
export const streamInspectionImage = async (_req: Request, res: Response) => res.status(404).json({ error: 'Disabled' });
export const listInspectionMedia = async (_req: Request, res: Response) => res.status(200).json([]);
export const streamInspectionMedia = async (_req: Request, res: Response) => res.status(404).json({ error: 'Disabled' });
export const listInspectionScans = async (_req: Request, res: Response) => res.status(200).json([]);
export const streamInspectionScan = async (_req: Request, res: Response) => res.status(404).json({ error: 'Disabled' });
export const getInspectionScanReport = async (_req: Request, res: Response) => res.status(404).json({ error: 'Disabled' });