import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";
import { info, error as logError } from "../utils/logger";

// GET /dashboards/
export const getDashboardData = async (_req: Request, res: Response) => {
    try {
        info('dashboard.getDashboardData - start');
        const overview = await dashboardService.getDashboardOverview();
        info('dashboard.getDashboardData - success');
        res.status(200).json(overview);
    } catch (err: any) {
        logError('dashboard.getDashboardData - error', { error: err?.message || err });
        res.status(500).json({ error: err.message || 'Internal error' });
    }
};

export const getMachines = async (_req: Request, res: Response) => {
    try {
        info('dashboard.getMachines - start');
        const machines = await dashboardService.getAllMachines();
        info('dashboard.getMachines - success', { count: Array.isArray(machines) ? machines.length : undefined });
        res.status(200).json(machines);
    } catch (err: any) {
        logError('dashboard.getMachines - error', { error: err?.message || err });
        res.status(500).json({ error: err.message || 'Internal error' });
    }
};

export const getWorkers = async (_req: Request, res: Response) => {
    try {
        info('dashboard.getWorkers - start');
        const workers = await dashboardService.getAllWorkers();
        info('dashboard.getWorkers - success', { count: Array.isArray(workers) ? workers.length : undefined });
        res.status(200).json(workers);
    } catch (err: any) {
        logError('dashboard.getWorkers - error', { error: err?.message || err });
        res.status(500).json({ error: err.message || 'Internal error' });
    }
};
