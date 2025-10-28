import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";
import { listImageFiles, getImageStream, isImage, listMediaFiles, getFileStream, isVideo, listPlyCleanedFiles, isPlyCleaned, fileExists, getTextFile } from "../utils/ftp";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

// Get overall dashboard data
export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const [
            inspectionStats,
            currentPieceStates,
            inspectorPerformance,
            dailyTrends,
            pieceHistory
        ] = await Promise.all([
            dashboardService.getInspectionStats(),
            dashboardService.getCurrentPieceStates(),
            dashboardService.getInspectorPerformance(),
            dashboardService.getDailyInspectionTrends(),
            dashboardService.getPieceHistorySummary()
        ]);

        res.status(200).json(convertBigIntToString({
            inspectionStats,
            currentPieceStates,
            inspectorPerformance,
            dailyTrends,
            pieceHistory
        }));
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};

// Get inspection statistics
export const getInspectionStats = async (req: Request, res: Response) => {
    try {
        const stats = await dashboardService.getInspectionStats();
        res.status(200).json(convertBigIntToString(stats));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch inspection statistics" });
    }
};

// Get current piece states
export const getCurrentPieceStates = async (req: Request, res: Response) => {
    try {
        const pieces = await dashboardService.getCurrentPieceStates();
        res.status(200).json(convertBigIntToString(pieces));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch current piece states" });
    }
};

// Get inspector performance
export const getInspectorPerformance = async (req: Request, res: Response) => {
    try {
        const performance = await dashboardService.getInspectorPerformance();
        res.status(200).json(convertBigIntToString(performance));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch inspector performance" });
    }
};

// Get daily inspection trends
export const getDailyTrends = async (req: Request, res: Response) => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const trends = await dashboardService.getDailyInspectionTrends(days);
        res.status(200).json(convertBigIntToString(trends));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch daily trends" });
    }
};

// Get piece history summary
export const getPieceHistory = async (req: Request, res: Response) => {
    try {
        const ref_piece = req.params.ref_piece;
        if (ref_piece) {
            const history = await dashboardService.getPieceHistorySummaryByRef(ref_piece);
            res.status(200).json(convertBigIntToString(history));
        } else {
            const history = await dashboardService.getPieceHistorySummary();
            res.status(200).json(convertBigIntToString(history));
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch piece history" });
    }
};

// Get detailed piece history for a specific ref_piece
export const getPieceHistoryDetail = async (req: Request, res: Response) => {
    try {
        const ref_piece = req.params.ref_piece;
        if (!ref_piece) {
            res.status(400).json({ error: 'ref_piece is required' });
            return;
        }
        const detail = await dashboardService.getPieceHistoryDetailByRef(ref_piece);
        res.status(200).json(convertBigIntToString(detail));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch piece history detail' });
    }
};

// Controller to get validation time distribution
export const getValidationTimeDistribution = async (req: Request, res: Response) => {
    try {
        const from = typeof req.query.from === 'string' ? req.query.from : undefined;
        const to = typeof req.query.to === 'string' ? req.query.to : undefined;
        let groupBy = typeof req.query.groupBy === 'string' ? req.query.groupBy : undefined;
        if (typeof req.query.groupBy === 'string' && ['day','week','month','year'].includes(req.query.groupBy)) {
            groupBy = req.query.groupBy;
        }
        const data = await dashboardService.getValidationTimeDistribution(from, to, groupBy as 'day'|'week'|'month'|'year');
        res.status(200).json(convertBigIntToString(data));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// List images in an inspection FTP folder (by passing folderPath)
export const listInspectionImages = async (req: Request, res: Response) => {
    try {
        console.log("Listing inspection images");
        const folderPath = req.query.folderPath as string;
        if (!folderPath) {
            res.status(400).json({ error: 'folderPath query param is required' });
            return;
        }
        const files = await listImageFiles(folderPath);
        res.status(200).json(files);
    } catch (error: any) {
        console.error("Error listing inspection images:", error);
        res.status(500).json({ error: error.message || 'Failed to list images' });
    }
};

// Stream a specific image file from the FTP folder
export const streamInspectionImage = async (req: Request, res: Response) => {
    try {
        const folderPath = req.query.folderPath as string;
        const file = req.params.file as string;
        if (!folderPath || !file) {
            res.status(400).json({ error: 'folderPath query and file param are required' });
            return;
        }
        if (!isImage(file)) {
            res.status(400).json({ error: 'Unsupported file type' });
            return;
        }
        const contentType = file.toLowerCase().endsWith('.png') ? 'image/png'
            : file.toLowerCase().endsWith('.gif') ? 'image/gif'
            : 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        await getImageStream(folderPath, file, res);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to stream image' });
    }
};

// List images+videos in an inspection FTP folder
export const listInspectionMedia = async (req: Request, res: Response) => {
    try {
        const folderPath = req.query.folderPath as string;
        if (!folderPath) {
            res.status(400).json({ error: 'folderPath query param is required' });
            return;
        }
        const files = await listMediaFiles(folderPath);
        res.status(200).json(files);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to list media' });
    }
};

// Stream any supported media file
export const streamInspectionMedia = async (req: Request, res: Response) => {
    try {
        const folderPath = req.query.folderPath as string;
        const file = req.params.file as string;
        if (!folderPath || !file) {
            res.status(400).json({ error: 'folderPath query and file param are required' });
            return;
        }
        const lower = file.toLowerCase();
        const contentType = isImage(file)
            ? (lower.endsWith('.png') ? 'image/png' : lower.endsWith('.gif') ? 'image/gif' : 'image/jpeg')
            : isVideo(file)
                ? (lower.endsWith('.mp4') ? 'video/mp4' : lower.endsWith('.webm') ? 'video/webm' : lower.endsWith('.ogg') ? 'video/ogg' : 'application/octet-stream')
                : undefined;
        if (!contentType) {
            res.status(400).json({ error: 'Unsupported file type' });
            return;
        }
        res.setHeader('Content-Type', contentType);
        await getFileStream(folderPath, file, res);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to stream media' });
    }
};

// List cleaned PLY files (ending with _cleaned.ply) in an inspection folder
export const listInspectionScans = async (req: Request, res: Response) => {
    try {
        const folderPath = req.query.folderPath as string;
        if (!folderPath) {
            res.status(400).json({ error: 'folderPath query param is required' });
            return;
        }
        const files = await listPlyCleanedFiles(folderPath);
        res.status(200).json(files);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to list PLY scans' });
    }
};

// Stream a PLY cleaned file
export const streamInspectionScan = async (req: Request, res: Response) => {
    try {
        const folderPath = req.query.folderPath as string;
        // Support both route param :file and query param relativePath for nested files
        const file = (req.query.relativePath as string) || (req.params.file as string);
        if (!folderPath || !file) {
            res.status(400).json({ error: 'folderPath query and file param are required' });
            return;
        }
        if (!isPlyCleaned(file)) {
            res.status(400).json({ error: 'Unsupported file type (expected *_cleaned.ply)' });
            return;
        }
        res.setHeader('Content-Type', 'application/octet-stream');
        await getFileStream(folderPath, file, res);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to stream PLY file' });
    }
};

// Parse scan_analysis_report.txt from an inspection folder
export const getInspectionScanReport = async (req: Request, res: Response) => {
    try {
        const folderPath = req.query.folderPath as string;
        if (!folderPath) {
            res.status(400).json({ error: 'folderPath query param is required' });
            return;
        }
        const reportName = 'scan_analysis_report.txt';
        const exists = await fileExists(folderPath, reportName);
        if (!exists) {
            res.status(404).json({ error: 'scan_analysis_report.txt not found' });
            return;
        }
        const text = await getTextFile(folderPath, reportName);
        // Parse key metrics from the sample format provided
        const lines = text.split(/\r?\n/);
        const result: any = {
            pieceReference: undefined,
            similarityScore: undefined,
            meanDistance: undefined,
            centroidDistance: undefined,
            pointCountRatio: undefined,
            quality: undefined,
        };

        // Piece Reference: <value>
        const refLine = lines.find(l => l.includes('Piece Reference'));
        if (refLine) {
            const m = refLine.match(/Piece Reference:\s*(.+)$/);
            if (m) result.pieceReference = m[1].trim();
        }

        // Similarity Score: 100.0%
        const simLine = lines.find(l => l.includes('Similarity Score'));
        if (simLine) {
            const m = simLine.match(/Similarity Score:\s*([0-9]+(?:\.[0-9]+)?)%/);
            if (m) result.similarityScore = parseFloat(m[1]);
        }

        // Mean Distance: 0.00mm
        const meanLine = lines.find(l => l.includes('Mean Distance'));
        if (meanLine) {
            const m = meanLine.match(/Mean Distance:\s*([0-9]+(?:\.[0-9]+)?)mm/);
            if (m) result.meanDistance = parseFloat(m[1]);
        }

        // Centroid Distance: 0.00mm
        const centLine = lines.find(l => l.includes('Centroid Distance'));
        if (centLine) {
            const m = centLine.match(/Centroid Distance:\s*([0-9]+(?:\.[0-9]+)?)mm/);
            if (m) result.centroidDistance = parseFloat(m[1]);
        }

        // Point Count Ratio: 1.00
        const ratioLine = lines.find(l => l.includes('Point Count Ratio'));
        if (ratioLine) {
            const m = ratioLine.match(/Point Count Ratio:\s*([0-9]+(?:\.[0-9]+)?)/);
            if (m) result.pointCountRatio = parseFloat(m[1]);
        }

        // QUALITY: EXCELLENT
        const qualLine = lines.find(l => l.includes('QUALITY:'));
        if (qualLine) {
            const m = qualLine.match(/QUALITY:\s*(\w+)/);
            if (m) result.quality = m[1];
        }

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to parse scan report' });
    }
};