import { Request, Response } from "express";
import * as inspectionService from "../services/inspection.service";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

// Function to get all inspections
export const getInspections = async (req: Request, res: Response) => {
    try {
        const response = await inspectionService.getAllInspections();
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to get inspection by id
export const getInspection = async (req: Request, res: Response) => {
    try {
        console.log("Fetching inspection by ID");
        const id = req.params.id;
        const response = await inspectionService.getInspectionById(id);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to create inspection
export const createInspection = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user.id;
        const response = await inspectionService.createInspectionInfos(data, user_id);
        // Create historical data after inspection creation
        await inspectionService.createHistoricalData(response.ref_piece, response, user_id);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to update inspection by id
export const updateInspection = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user.id;
        const response = await inspectionService.updateInspectionById(id, data, user_id);
        // Create historical data after inspection update
        await inspectionService.createHistoricalData(response.ref_piece, response, user_id);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to update inspection status by id
export const updateInspectionStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const user_id = req.user.id;
        if (!['PENDING', 'VALIDATED', 'REJECTED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status value' });
            return;
        }
        const response = await inspectionService.updateInspectionStatus(id, status, user_id);
        // Create historical data after inspection status update
        await inspectionService.createHistoricalData(response.ref_piece, response, user_id);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    return;
}

// Function to delete inspection by id
export const deleteInspection = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user.id;
        const response = await inspectionService.deleteInspectionById(id, user_id);
        // Create historical data after inspection deletion
        await inspectionService.createHistoricalData(response.ref_piece, response, user_id);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to get the most recent inspections
export const getRecentInspections = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const response = await inspectionService.getRecentInspections(limit);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}





