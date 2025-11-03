import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

// GET /dashboards/
export const getDashboardData = async (_req: Request, res: Response) => {
    try {
        const overview = await dashboardService.getDashboardOverview();
        res.status(200).json(overview);
    } catch (err: any) {
        console.error('getDashboardData error', err);
        res.status(500).json({ error: err.message || 'Internal error' });
    }
};

export const getMachines = async (_req: Request, res: Response) => {
    try {
        const machines = await dashboardService.getAllMachines();
        res.status(200).json(machines);
    } catch (err: any) {
        console.error('getMachines error', err);
        res.status(500).json({ error: err.message || 'Internal error' });
    }
};

export const getWorkers = async (_req: Request, res: Response) => {
    try {
        const workers = await dashboardService.getAllWorkers();
        res.status(200).json(workers);
    } catch (err: any) {
        console.error('getWorkers error', err);
        res.status(500).json({ error: err.message || 'Internal error' });
    }
};
// Inspection-related endpoints removed from controller